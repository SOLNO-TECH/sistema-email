import { Router } from "express";
import { getUserInvoices } from "../controllers/invoices.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getUserInvoices);

export default router;

