import { Router } from "express";
import { createEmailAccount, listEmailAccounts, deleteEmailAccount } from "../controllers/email-accounts.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createEmailAccount);
router.get("/", authMiddleware, listEmailAccounts);
router.delete("/:id", authMiddleware, deleteEmailAccount);

export default router;

