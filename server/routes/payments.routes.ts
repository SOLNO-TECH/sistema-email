import { Router } from "express";
import { 
  createPaymentIntent, 
  stripeWebhook, 
  processCardPayment, 
  processPayPalPayment, 
  createBankTransferSubscription,
  addPaymentMethod,
  listPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  addCredits
} from "../controllers/payments.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

// Webhook de Stripe no debe usar authMiddleware (Stripe lo llama directamente)
router.post("/webhook", stripeWebhook);
router.post("/create-intent", authMiddleware, createPaymentIntent);
router.post("/process-card", authMiddleware, processCardPayment);
router.post("/process-paypal", authMiddleware, processPayPalPayment);
router.post("/process-bank-transfer", authMiddleware, createBankTransferSubscription);

// Gestión de métodos de pago
router.post("/methods", authMiddleware, addPaymentMethod);
router.get("/methods", authMiddleware, listPaymentMethods);
router.delete("/methods/:paymentMethodId", authMiddleware, deletePaymentMethod);
router.post("/methods/default", authMiddleware, setDefaultPaymentMethod);

// Gestión de créditos
router.post("/add-credits", authMiddleware, addCredits);

export default router;

