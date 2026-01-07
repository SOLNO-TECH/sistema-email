"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscription = createSubscription;
exports.listSubscriptions = listSubscriptions;
exports.cancelSubscription = cancelSubscription;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Crear suscripción (después del pago)
async function createSubscription(req, res) {
    try {
        const user = req.user;
        const { planId, paymentMethodId, billingPeriod } = req.body; // billingPeriod: 'monthly' | 'yearly'
        if (!planId) {
            return res.status(400).json({ error: "planId is required" });
        }
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        // Aquí se integraría con Stripe u otra pasarela de pago
        // Por ahora, creamos la suscripción directamente
        // En producción, esto se haría después de confirmar el pago
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
        res.json({
            subscription: {
                id: subscription.id,
                plan: subscription.Plan,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
            },
        });
    }
    catch (err) {
        console.error("Create subscription error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Listar suscripciones del usuario
async function listSubscriptions(req, res) {
    try {
        const user = req.user;
        const subscriptions = await prisma_1.default.subscription.findMany({
            where: { userId: user.id },
            include: {
                Plan: true,
            },
            orderBy: {
                startDate: "desc",
            },
        });
        res.json(subscriptions);
    }
    catch (err) {
        console.error("List subscriptions error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Cancelar suscripción
async function cancelSubscription(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { id: parseInt(id), userId: user.id },
        });
        if (!subscription) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        await prisma_1.default.subscription.update({
            where: { id: parseInt(id) },
            data: {
                endDate: new Date(), // Cancelar inmediatamente
            },
        });
        res.json({ message: "Subscription cancelled successfully" });
    }
    catch (err) {
        console.error("Cancel subscription error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
