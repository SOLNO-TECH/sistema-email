"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("../controllers/payments.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const router = (0, express_1.Router)();
// Webhook de Stripe no debe usar authMiddleware (Stripe lo llama directamente)
router.post("/webhook", payments_controller_1.stripeWebhook);
router.post("/create-intent", auth_middleware_1.authMiddleware, payments_controller_1.createPaymentIntent);
router.post("/process-card", auth_middleware_1.authMiddleware, payments_controller_1.processCardPayment);
router.post("/process-paypal", auth_middleware_1.authMiddleware, payments_controller_1.processPayPalPayment);
router.post("/process-bank-transfer", auth_middleware_1.authMiddleware, payments_controller_1.createBankTransferSubscription);
// Gestión de métodos de pago
router.post("/methods", auth_middleware_1.authMiddleware, payments_controller_1.addPaymentMethod);
router.get("/methods", auth_middleware_1.authMiddleware, payments_controller_1.listPaymentMethods);
router.delete("/methods/:paymentMethodId", auth_middleware_1.authMiddleware, payments_controller_1.deletePaymentMethod);
router.post("/methods/default", auth_middleware_1.authMiddleware, payments_controller_1.setDefaultPaymentMethod);
// Gestión de créditos
router.post("/add-credits", auth_middleware_1.authMiddleware, payments_controller_1.addCredits);
exports.default = router;
