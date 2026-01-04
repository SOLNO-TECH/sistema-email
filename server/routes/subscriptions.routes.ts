import { Router } from "express";
import { createSubscription, listSubscriptions, cancelSubscription } from "../controllers/subscriptions.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createSubscription);
router.get("/", authMiddleware, listSubscriptions);
router.delete("/:id", authMiddleware, cancelSubscription);

export default router;

