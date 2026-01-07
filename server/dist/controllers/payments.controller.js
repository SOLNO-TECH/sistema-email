"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.processCardPayment = processCardPayment;
exports.processPayPalPayment = processPayPalPayment;
exports.createBankTransferSubscription = createBankTransferSubscription;
exports.stripeWebhook = stripeWebhook;
exports.addPaymentMethod = addPaymentMethod;
exports.listPaymentMethods = listPaymentMethods;
exports.deletePaymentMethod = deletePaymentMethod;
exports.setDefaultPaymentMethod = setDefaultPaymentMethod;
exports.addCredits = addCredits;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Inicializar Stripe (opcional, solo si está instalado)
let Stripe = null;
let stripe = null;
try {
    Stripe = require("stripe");
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-11-20.acacia",
        });
    }
}
catch (e) {
    console.log("⚠️ Stripe no está instalado. Instala con: npm install stripe");
}
// Crear intención de pago (Stripe Checkout)
async function createPaymentIntent(req, res) {
    try {
        const user = req.user;
        const { planId, billingPeriod } = req.body; // 'monthly' | 'yearly'
        if (!planId || !billingPeriod) {
            return res.status(400).json({ error: "planId and billingPeriod are required" });
        }
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        const amount = billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
        // En producción, aquí se integraría con Stripe:
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const session = await stripe.checkout.sessions.create({...});
        // Por ahora, retornamos datos simulados para desarrollo
        res.json({
            clientSecret: `mock_client_secret_${Date.now()}`,
            amount,
            currency: "usd",
            planId: plan.id,
            billingPeriod,
            // En producción, esto sería la URL de checkout de Stripe
            checkoutUrl: `/checkout?plan=${planId}&period=${billingPeriod}`,
        });
    }
    catch (err) {
        console.error("Create payment intent error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Procesar pago con tarjeta de crédito/débito
async function processCardPayment(req, res) {
    try {
        const user = req.user;
        const { planId, billingPeriod, cardData } = req.body;
        if (!planId || !billingPeriod || !cardData) {
            return res.status(400).json({ error: "planId, billingPeriod and cardData are required" });
        }
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        // Validar datos de tarjeta básicos
        const cardNumber = cardData.cardNumber?.replace(/\s/g, "") || "";
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            return res.status(400).json({ error: "Número de tarjeta inválido" });
        }
        if (!cardData.cardHolder || cardData.cardHolder.trim().length < 3) {
            return res.status(400).json({ error: "Nombre del titular inválido" });
        }
        if (!cardData.expiryDate || !cardData.cvv) {
            return res.status(400).json({ error: "Fecha de expiración o CVV inválidos" });
        }
        const amount = billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
        // Procesar pago con Stripe (si está configurado)
        if (stripe) {
            try {
                // Crear PaymentMethod con los datos de la tarjeta
                const [month, year] = cardData.expiryDate.split("/");
                const paymentMethod = await stripe.paymentMethods.create({
                    type: "card",
                    card: {
                        number: cardNumber,
                        exp_month: parseInt(month),
                        exp_year: 2000 + parseInt(year),
                        cvc: cardData.cvv,
                    },
                    billing_details: {
                        name: cardData.cardHolder,
                        email: user.email,
                    },
                });
                // Crear PaymentIntent
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100), // Stripe usa centavos
                    currency: "usd",
                    payment_method: paymentMethod.id,
                    confirm: true,
                    description: `Suscripción ${plan.name} - ${billingPeriod === "yearly" ? "Anual" : "Mensual"}`,
                    metadata: {
                        userId: user.id.toString(),
                        planId: plan.id.toString(),
                        billingPeriod,
                    },
                });
                if (paymentIntent.status !== "succeeded") {
                    return res.status(400).json({
                        error: `El pago no se completó. Estado: ${paymentIntent.status}`
                    });
                }
                // El pago fue exitoso, continuar con la creación de suscripción
            }
            catch (stripeError) {
                console.error("Stripe payment error:", stripeError);
                return res.status(400).json({
                    error: stripeError.message || "Error al procesar el pago con la tarjeta"
                });
            }
        }
        else {
            // Modo desarrollo: simular pago exitoso
            console.log("⚠️ Stripe no configurado. Simulando pago en modo desarrollo.");
        }
        // Crear suscripción después del pago exitoso
        const startDate = new Date();
        const endDate = new Date();
        if (billingPeriod === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        // Cancelar todas las suscripciones anteriores (activas o no)
        await prisma_1.default.subscription.updateMany({
            where: {
                userId: user.id,
                OR: [
                    { endDate: null }, // Suscripciones permanentes
                    { endDate: { gte: new Date() } }, // Suscripciones activas
                ],
            },
            data: {
                endDate: new Date(), // Cancelar inmediatamente
            },
        });
        const subscription = await prisma_1.default.subscription.create({
            data: {
                userId: user.id,
                planId: plan.id,
                plan: plan.name,
                startDate,
                endDate,
            },
            include: {
                Plan: true,
            },
        });
        // Crear factura
        await prisma_1.default.invoice.create({
            data: {
                userId: user.id,
                subscriptionId: subscription.id,
            },
        });
        // Guardar método de pago en el usuario
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                paymentMethod: "card",
                paymentDetails: JSON.stringify({
                    last4: cardNumber.slice(-4),
                    brand: cardNumber.startsWith("4") ? "visa" : cardNumber.startsWith("5") ? "mastercard" : "other",
                }),
            },
        });
        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                plan: subscription.Plan,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
            },
            message: "Pago procesado exitosamente",
        });
    }
    catch (err) {
        console.error("Process card payment error:", err);
        res.status(500).json({ error: "Error al procesar el pago" });
    }
}
// Procesar pago con PayPal
async function processPayPalPayment(req, res) {
    try {
        const user = req.user;
        const { planId, billingPeriod, paypalOrderId } = req.body;
        if (!planId || !billingPeriod) {
            return res.status(400).json({ error: "planId and billingPeriod are required" });
        }
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        // Verificar pago con PayPal (si está configurado)
        if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
            try {
                // En producción, aquí se verificaría el pago con PayPal usando el SDK
                // Por ahora, si hay un paypalOrderId, asumimos que el pago fue exitoso
                // En producción real, se verificaría con la API de PayPal:
                /*
                const paypal = require('@paypal/paypal-server-sdk');
                const environment = new paypal.core.SandboxEnvironment(
                  process.env.PAYPAL_CLIENT_ID,
                  process.env.PAYPAL_CLIENT_SECRET
                );
                const client = new paypal.core.PayPalHttpClient(environment);
                const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
                const response = await client.execute(request);
                if (response.result.status !== 'COMPLETED') {
                  return res.status(400).json({ error: "Pago de PayPal no completado" });
                }
                */
                if (paypalOrderId && !paypalOrderId.startsWith("mock_")) {
                    // En producción, aquí se verificaría el orderId con PayPal
                    console.log("Verificando pago de PayPal:", paypalOrderId);
                }
            }
            catch (paypalError) {
                console.error("PayPal verification error:", paypalError);
                return res.status(400).json({
                    error: paypalError.message || "Error al verificar el pago con PayPal"
                });
            }
        }
        else {
            // Modo desarrollo: simular pago exitoso
            console.log("⚠️ PayPal no configurado. Simulando pago en modo desarrollo.");
        }
        const startDate = new Date();
        const endDate = new Date();
        if (billingPeriod === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        // Cancelar todas las suscripciones anteriores (activas o no)
        await prisma_1.default.subscription.updateMany({
            where: {
                userId: user.id,
                OR: [
                    { endDate: null }, // Suscripciones permanentes
                    { endDate: { gte: new Date() } }, // Suscripciones activas
                ],
            },
            data: {
                endDate: new Date(), // Cancelar inmediatamente
            },
        });
        const subscription = await prisma_1.default.subscription.create({
            data: {
                userId: user.id,
                planId: plan.id,
                plan: plan.name,
                startDate,
                endDate,
            },
            include: {
                Plan: true,
            },
        });
        // Crear factura
        await prisma_1.default.invoice.create({
            data: {
                userId: user.id,
                subscriptionId: subscription.id,
            },
        });
        // Guardar método de pago
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                paymentMethod: "paypal",
                paymentDetails: JSON.stringify({
                    paypalOrderId: paypalOrderId || `mock_${Date.now()}`,
                }),
            },
        });
        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                plan: subscription.Plan,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
            },
            message: "Pago con PayPal procesado exitosamente",
        });
    }
    catch (err) {
        console.error("Process PayPal payment error:", err);
        res.status(500).json({ error: "Error al procesar el pago con PayPal" });
    }
}
// Crear suscripción pendiente para transferencia bancaria
async function createBankTransferSubscription(req, res) {
    try {
        const user = req.user;
        const { planId, billingPeriod } = req.body;
        if (!planId || !billingPeriod) {
            return res.status(400).json({ error: "planId and billingPeriod are required" });
        }
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        const amount = billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
        // Crear una suscripción con estado pendiente (en producción, esto tendría un campo status: "pending")
        // Por ahora, creamos la suscripción pero con una fecha de inicio futura
        const startDate = new Date();
        const endDate = new Date();
        if (billingPeriod === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        // Guardar método de pago
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                paymentMethod: "bank_transfer",
                paymentDetails: JSON.stringify({
                    amount,
                    billingPeriod,
                    pending: true,
                    createdAt: new Date().toISOString(),
                }),
            },
        });
        // Crear suscripción pendiente (en producción, esto tendría status: "pending")
        // Por ahora, creamos la suscripción pero el usuario debe enviar el comprobante
        const reference = `XSTAR-${user.id}-${Date.now()}`;
        // Cancelar todas las suscripciones anteriores (activas o no)
        await prisma_1.default.subscription.updateMany({
            where: {
                userId: user.id,
                OR: [
                    { endDate: null }, // Suscripciones permanentes
                    { endDate: { gte: new Date() } }, // Suscripciones activas
                ],
            },
            data: {
                endDate: new Date(), // Cancelar inmediatamente
            },
        });
        const subscription = await prisma_1.default.subscription.create({
            data: {
                userId: user.id,
                planId: plan.id,
                plan: plan.name,
                startDate,
                endDate,
            },
            include: {
                Plan: true,
            },
        });
        // Crear factura pendiente
        await prisma_1.default.invoice.create({
            data: {
                userId: user.id,
                subscriptionId: subscription.id,
            },
        });
        res.json({
            success: true,
            message: "Suscripción pendiente creada. Por favor envía el comprobante de transferencia a pagos@xstarmail.es",
            amount,
            billingPeriod,
            subscription: {
                id: subscription.id,
                plan: subscription.Plan,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
            },
            bankDetails: {
                bank: "Banco Xstar",
                accountHolder: "Xstar Mail S.L.",
                iban: "ES91 2100 0418 4502 0005 1332",
                swift: "CAIXESBBXXX",
                reference,
            },
        });
    }
    catch (err) {
        console.error("Create bank transfer subscription error:", err);
        res.status(500).json({ error: "Error al crear suscripción pendiente" });
    }
}
// Webhook de Stripe (para confirmar pagos)
async function stripeWebhook(req, res) {
    try {
        // En producción, aquí se verificaría la firma de Stripe
        // const sig = req.headers['stripe-signature'];
        // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        // Por ahora, simulamos la confirmación del pago
        const { planId, userId, billingPeriod } = req.body;
        if (!planId || !userId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Continuar con el procesamiento manual en modo desarrollo
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: parseInt(planId) },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        const startDate = new Date();
        const endDate = new Date();
        if (billingPeriod === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        // Cancelar todas las suscripciones anteriores (activas o no)
        await prisma_1.default.subscription.updateMany({
            where: {
                userId: parseInt(userId),
                OR: [
                    { endDate: null }, // Suscripciones permanentes
                    { endDate: { gte: new Date() } }, // Suscripciones activas
                ],
            },
            data: {
                endDate: new Date(), // Cancelar inmediatamente
            },
        });
        const subscription = await prisma_1.default.subscription.create({
            data: {
                userId: parseInt(userId),
                planId: plan.id,
                plan: plan.name,
                startDate,
                endDate,
            },
        });
        // Crear factura
        await prisma_1.default.invoice.create({
            data: {
                userId: parseInt(userId),
                subscriptionId: subscription.id,
            },
        });
        return res.json({ success: true, subscription });
        // TODO: En producción, procesar eventos reales de Stripe
        // if (stripe && event && event.type === "checkout.session.completed") {
        //   const session = event.data.object;
        //   // ... procesar evento real
        // }
    }
    catch (err) {
        console.error("Stripe webhook error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Agregar método de pago (tarjeta)
async function addPaymentMethod(req, res) {
    try {
        const user = req.user;
        const { cardData, type } = req.body; // type: "card" | "paypal"
        if (type === "card") {
            if (!cardData) {
                return res.status(400).json({ error: "cardData is required" });
            }
            const cardNumber = cardData.cardNumber?.replace(/\s/g, "") || "";
            if (cardNumber.length < 13 || cardNumber.length > 19) {
                return res.status(400).json({ error: "Número de tarjeta inválido" });
            }
            if (!cardData.cardHolder || cardData.cardHolder.trim().length < 3) {
                return res.status(400).json({ error: "Nombre del titular inválido" });
            }
            if (!cardData.expiryDate || !cardData.cvv) {
                return res.status(400).json({ error: "Fecha de expiración o CVV inválidos" });
            }
            let stripeCustomerId = null;
            let paymentMethodId = null;
            // Si Stripe está configurado, crear PaymentMethod y Customer
            if (stripe) {
                try {
                    // Buscar o crear Customer en Stripe
                    const existingUser = await prisma_1.default.user.findUnique({
                        where: { id: user.id },
                        select: { paymentDetails: true },
                    });
                    let customerId = null;
                    if (existingUser?.paymentDetails) {
                        try {
                            const details = JSON.parse(existingUser.paymentDetails);
                            customerId = details.stripeCustomerId;
                        }
                        catch (e) {
                            // Ignorar error de parsing
                        }
                    }
                    if (!customerId) {
                        const customer = await stripe.customers.create({
                            email: user.email,
                            name: user.name,
                            metadata: {
                                userId: user.id.toString(),
                            },
                        });
                        customerId = customer.id;
                    }
                    // Crear PaymentMethod
                    const [month, year] = cardData.expiryDate.split("/");
                    const paymentMethod = await stripe.paymentMethods.create({
                        type: "card",
                        card: {
                            number: cardNumber,
                            exp_month: parseInt(month),
                            exp_year: 2000 + parseInt(year),
                            cvc: cardData.cvv,
                        },
                        billing_details: {
                            name: cardData.cardHolder,
                            email: user.email,
                        },
                    });
                    // Adjuntar PaymentMethod al Customer
                    await stripe.paymentMethods.attach(paymentMethod.id, {
                        customer: customerId,
                    });
                    // Obtener detalles de la tarjeta
                    const cardDetails = paymentMethod.card;
                    paymentMethodId = paymentMethod.id;
                    stripeCustomerId = customerId;
                    // Guardar en la base de datos
                    const paymentDetails = {
                        type: "card",
                        last4: cardDetails?.last4 || cardNumber.slice(-4),
                        brand: cardDetails?.brand || (cardNumber.startsWith("4") ? "visa" : cardNumber.startsWith("5") ? "mastercard" : "other"),
                        expMonth: cardDetails?.exp_month || parseInt(month),
                        expYear: cardDetails?.exp_year || (2000 + parseInt(year)),
                        cardHolder: cardData.cardHolder,
                        stripeCustomerId,
                        stripePaymentMethodId: paymentMethodId,
                        createdAt: new Date().toISOString(),
                    };
                    // Si el usuario ya tiene un método de pago, agregarlo a una lista
                    const existingDetails = existingUser?.paymentDetails
                        ? JSON.parse(existingUser.paymentDetails)
                        : {};
                    let paymentMethods = [];
                    if (existingDetails.paymentMethods && Array.isArray(existingDetails.paymentMethods)) {
                        paymentMethods = existingDetails.paymentMethods;
                    }
                    else if (existingDetails.type) {
                        // Migrar método existente a la lista
                        paymentMethods = [existingDetails];
                    }
                    paymentMethods.push(paymentDetails);
                    await prisma_1.default.user.update({
                        where: { id: user.id },
                        data: {
                            paymentMethod: "card",
                            paymentDetails: JSON.stringify({
                                ...existingDetails,
                                paymentMethods,
                                defaultMethod: paymentMethodId,
                                stripeCustomerId,
                            }),
                        },
                    });
                    res.json({
                        success: true,
                        paymentMethod: {
                            id: paymentMethodId,
                            type: "card",
                            last4: paymentDetails.last4,
                            brand: paymentDetails.brand,
                            expMonth: paymentDetails.expMonth,
                            expYear: paymentDetails.expYear,
                        },
                        message: "Método de pago agregado exitosamente",
                    });
                }
                catch (stripeError) {
                    console.error("Stripe payment method error:", stripeError);
                    return res.status(400).json({
                        error: stripeError.message || "Error al agregar método de pago con Stripe",
                    });
                }
            }
            else {
                // Modo desarrollo: simular guardado
                const paymentDetails = {
                    type: "card",
                    last4: cardNumber.slice(-4),
                    brand: cardNumber.startsWith("4") ? "visa" : cardNumber.startsWith("5") ? "mastercard" : "other",
                    cardHolder: cardData.cardHolder,
                    createdAt: new Date().toISOString(),
                };
                const existingUser = await prisma_1.default.user.findUnique({
                    where: { id: user.id },
                    select: { paymentDetails: true },
                });
                const existingDetails = existingUser?.paymentDetails
                    ? JSON.parse(existingUser.paymentDetails)
                    : {};
                let paymentMethods = [];
                if (existingDetails.paymentMethods && Array.isArray(existingDetails.paymentMethods)) {
                    paymentMethods = existingDetails.paymentMethods;
                }
                else if (existingDetails.type) {
                    paymentMethods = [existingDetails];
                }
                paymentMethods.push(paymentDetails);
                await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        paymentMethod: "card",
                        paymentDetails: JSON.stringify({
                            ...existingDetails,
                            paymentMethods,
                            defaultMethod: paymentDetails.last4,
                        }),
                    },
                });
                res.json({
                    success: true,
                    paymentMethod: paymentDetails,
                    message: "Método de pago agregado exitosamente (modo desarrollo)",
                });
            }
        }
        else if (type === "paypal") {
            // Agregar PayPal
            const existingUser = await prisma_1.default.user.findUnique({
                where: { id: user.id },
                select: { paymentDetails: true },
            });
            const existingDetails = existingUser?.paymentDetails
                ? JSON.parse(existingUser.paymentDetails)
                : {};
            let paymentMethods = [];
            if (existingDetails.paymentMethods && Array.isArray(existingDetails.paymentMethods)) {
                paymentMethods = existingDetails.paymentMethods;
            }
            else if (existingDetails.type) {
                paymentMethods = [existingDetails];
            }
            const paypalMethod = {
                type: "paypal",
                email: user.email,
                createdAt: new Date().toISOString(),
            };
            paymentMethods.push(paypalMethod);
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    paymentMethod: "paypal",
                    paymentDetails: JSON.stringify({
                        ...existingDetails,
                        paymentMethods,
                        defaultMethod: "paypal",
                    }),
                },
            });
            res.json({
                success: true,
                paymentMethod: paypalMethod,
                message: "Método de pago PayPal agregado exitosamente",
            });
        }
        else {
            return res.status(400).json({ error: "Tipo de método de pago no válido" });
        }
    }
    catch (err) {
        console.error("Add payment method error:", err);
        res.status(500).json({ error: "Error al agregar método de pago" });
    }
}
// Listar métodos de pago guardados
async function listPaymentMethods(req, res) {
    try {
        const user = req.user;
        const userData = await prisma_1.default.user.findUnique({
            where: { id: user.id },
            select: { paymentMethod: true, paymentDetails: true },
        });
        if (!userData || !userData.paymentDetails) {
            return res.json({ paymentMethods: [] });
        }
        const details = JSON.parse(userData.paymentDetails);
        const paymentMethods = details.paymentMethods || [];
        // Si hay métodos guardados en Stripe, sincronizar
        if (stripe && details.stripeCustomerId) {
            try {
                const stripeMethods = await stripe.paymentMethods.list({
                    customer: details.stripeCustomerId,
                    type: "card",
                });
                // Combinar métodos de Stripe con los de la BD
                const combinedMethods = stripeMethods.data.map((pm) => ({
                    id: pm.id,
                    type: "card",
                    last4: pm.card?.last4,
                    brand: pm.card?.brand,
                    expMonth: pm.card?.exp_month,
                    expYear: pm.card?.exp_year,
                    isStripe: true,
                }));
                // Agregar métodos de PayPal de la BD
                const paypalMethods = paymentMethods.filter((pm) => pm.type === "paypal");
                const allMethods = [...combinedMethods, ...paypalMethods];
                return res.json({ paymentMethods: allMethods });
            }
            catch (stripeError) {
                console.error("Error fetching Stripe payment methods:", stripeError);
            }
        }
        res.json({ paymentMethods });
    }
    catch (err) {
        console.error("List payment methods error:", err);
        res.status(500).json({ error: "Error al listar métodos de pago" });
    }
}
// Eliminar método de pago
async function deletePaymentMethod(req, res) {
    try {
        const user = req.user;
        const { paymentMethodId } = req.params;
        if (!paymentMethodId) {
            return res.status(400).json({ error: "paymentMethodId is required" });
        }
        const userData = await prisma_1.default.user.findUnique({
            where: { id: user.id },
            select: { paymentDetails: true },
        });
        if (!userData || !userData.paymentDetails) {
            return res.status(404).json({ error: "No se encontraron métodos de pago" });
        }
        const details = JSON.parse(userData.paymentDetails);
        let paymentMethods = details.paymentMethods || [];
        // Si es un método de Stripe, eliminarlo de Stripe también
        if (stripe && paymentMethodId.startsWith("pm_")) {
            try {
                await stripe.paymentMethods.detach(paymentMethodId);
            }
            catch (stripeError) {
                // Si el método ya no existe en Stripe, continuar
                if (stripeError.code !== "resource_missing") {
                    console.error("Error detaching Stripe payment method:", stripeError);
                }
            }
        }
        // Eliminar de la lista
        paymentMethods = paymentMethods.filter((pm) => {
            if (pm.stripePaymentMethodId) {
                return pm.stripePaymentMethodId !== paymentMethodId;
            }
            if (pm.id) {
                return pm.id !== paymentMethodId;
            }
            // Para métodos sin ID, usar last4 o email como identificador
            return pm.last4 !== paymentMethodId && pm.email !== paymentMethodId;
        });
        // Si se eliminó el método por defecto, establecer otro como predeterminado
        if (details.defaultMethod === paymentMethodId && paymentMethods.length > 0) {
            details.defaultMethod = paymentMethods[0].stripePaymentMethodId || paymentMethods[0].last4 || paymentMethods[0].email;
        }
        else if (paymentMethods.length === 0) {
            details.defaultMethod = null;
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                paymentDetails: JSON.stringify({
                    ...details,
                    paymentMethods,
                }),
            },
        });
        res.json({ success: true, message: "Método de pago eliminado exitosamente" });
    }
    catch (err) {
        console.error("Delete payment method error:", err);
        res.status(500).json({ error: "Error al eliminar método de pago" });
    }
}
// Establecer método de pago por defecto
async function setDefaultPaymentMethod(req, res) {
    try {
        const user = req.user;
        const { paymentMethodId } = req.body;
        if (!paymentMethodId) {
            return res.status(400).json({ error: "paymentMethodId is required" });
        }
        const userData = await prisma_1.default.user.findUnique({
            where: { id: user.id },
            select: { paymentDetails: true },
        });
        if (!userData || !userData.paymentDetails) {
            return res.status(404).json({ error: "No se encontraron métodos de pago" });
        }
        const details = JSON.parse(userData.paymentDetails);
        const paymentMethods = details.paymentMethods || [];
        // Verificar que el método existe
        const methodExists = paymentMethods.some((pm) => {
            return pm.stripePaymentMethodId === paymentMethodId ||
                pm.id === paymentMethodId ||
                pm.last4 === paymentMethodId ||
                pm.email === paymentMethodId;
        });
        if (!methodExists) {
            return res.status(404).json({ error: "Método de pago no encontrado" });
        }
        // Si es un método de Stripe, establecerlo como predeterminado en Stripe también
        if (stripe && paymentMethodId.startsWith("pm_") && details.stripeCustomerId) {
            try {
                await stripe.customers.update(details.stripeCustomerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
            }
            catch (stripeError) {
                console.error("Error setting default Stripe payment method:", stripeError);
            }
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                paymentDetails: JSON.stringify({
                    ...details,
                    defaultMethod: paymentMethodId,
                }),
            },
        });
        res.json({ success: true, message: "Método de pago por defecto actualizado" });
    }
    catch (err) {
        console.error("Set default payment method error:", err);
        res.status(500).json({ error: "Error al establecer método de pago por defecto" });
    }
}
// Añadir créditos al usuario
async function addCredits(req, res) {
    try {
        const user = req.user;
        const { amount } = req.body;
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: "El monto debe ser mayor a 0" });
        }
        const amountFloat = parseFloat(amount);
        // Verificar que el usuario tenga un método de pago registrado
        const userData = await prisma_1.default.user.findUnique({
            where: { id: user.id },
            select: { paymentMethod: true, paymentDetails: true, credits: true },
        });
        if (!userData) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        // Verificar que tenga métodos de pago
        if (!userData.paymentDetails) {
            return res.status(400).json({
                error: "No tienes métodos de pago registrados. Por favor, agrega un método de pago antes de añadir créditos."
            });
        }
        const paymentDetails = JSON.parse(userData.paymentDetails);
        const paymentMethods = paymentDetails.paymentMethods || [];
        if (paymentMethods.length === 0) {
            return res.status(400).json({
                error: "No tienes métodos de pago registrados. Por favor, agrega un método de pago antes de añadir créditos."
            });
        }
        // Obtener el método de pago por defecto o el primero disponible
        const defaultMethodId = paymentDetails.defaultMethod;
        let selectedMethod = null;
        if (defaultMethodId) {
            selectedMethod = paymentMethods.find((pm) => {
                return pm.stripePaymentMethodId === defaultMethodId ||
                    pm.id === defaultMethodId ||
                    pm.last4 === defaultMethodId ||
                    pm.email === defaultMethodId;
            });
        }
        if (!selectedMethod) {
            selectedMethod = paymentMethods[0];
        }
        // Procesar el pago según el tipo de método
        if (selectedMethod.type === "card") {
            // Si es un método de Stripe, procesar con Stripe
            if (stripe && selectedMethod.stripePaymentMethodId && paymentDetails.stripeCustomerId) {
                try {
                    // Crear PaymentIntent con el método de pago guardado
                    const paymentIntent = await stripe.paymentIntents.create({
                        amount: Math.round(amountFloat * 100), // Stripe usa centavos
                        currency: "eur",
                        customer: paymentDetails.stripeCustomerId,
                        payment_method: selectedMethod.stripePaymentMethodId,
                        confirm: true,
                        description: `Añadir ${amountFloat}€ de créditos a la cuenta`,
                        metadata: {
                            userId: user.id.toString(),
                            type: "add_credits",
                        },
                    });
                    if (paymentIntent.status !== "succeeded") {
                        return res.status(400).json({
                            error: `El pago no se completó. Estado: ${paymentIntent.status}`
                        });
                    }
                    // El pago fue exitoso, añadir créditos
                    const updatedUser = await prisma_1.default.user.update({
                        where: { id: user.id },
                        data: {
                            credits: {
                                increment: amountFloat,
                            },
                        },
                        select: { credits: true },
                    });
                    res.json({
                        success: true,
                        message: `Se añadieron ${amountFloat}€ de créditos exitosamente`,
                        credits: updatedUser.credits,
                        paymentIntentId: paymentIntent.id,
                    });
                }
                catch (stripeError) {
                    console.error("Stripe payment error:", stripeError);
                    return res.status(400).json({
                        error: stripeError.message || "Error al procesar el pago con la tarjeta"
                    });
                }
            }
            else {
                // Modo desarrollo: simular pago exitoso
                console.log("⚠️ Stripe no configurado. Simulando pago en modo desarrollo.");
                const updatedUser = await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        credits: {
                            increment: amountFloat,
                        },
                    },
                    select: { credits: true },
                });
                res.json({
                    success: true,
                    message: `Se añadieron ${amountFloat}€ de créditos exitosamente (modo desarrollo)`,
                    credits: updatedUser.credits,
                });
            }
        }
        else if (selectedMethod.type === "paypal") {
            // Para PayPal, en producción se verificaría el pago con PayPal
            // Por ahora, simulamos el pago en modo desarrollo
            if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
                // En producción, aquí se verificaría el pago con PayPal
                // Por ahora, simulamos el pago
                console.log("⚠️ PayPal configurado pero verificación no implementada. Simulando pago.");
            }
            else {
                console.log("⚠️ PayPal no configurado. Simulando pago en modo desarrollo.");
            }
            const updatedUser = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    credits: {
                        increment: amountFloat,
                    },
                },
                select: { credits: true },
            });
            res.json({
                success: true,
                message: `Se añadieron ${amountFloat}€ de créditos exitosamente`,
                credits: updatedUser.credits,
            });
        }
        else {
            return res.status(400).json({ error: "Tipo de método de pago no soportado" });
        }
    }
    catch (err) {
        console.error("Add credits error:", err);
        res.status(500).json({ error: "Error al añadir créditos" });
    }
}
