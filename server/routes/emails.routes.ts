import { Router } from "express";
import { getEmails, sendEmail } from "../controllers/emails.controller";

const router = Router();

router.get("/", getEmails);
router.post("/send", sendEmail);

export default router;

