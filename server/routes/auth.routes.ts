import { Router } from "express";
import { register, login, me, updateProfile, changePassword, forgotPassword, resetPassword, sendVerificationCode, verifyEmailCode, ensureEmailAccount } from "../controllers/auth.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const r = Router();
r.post("/register", register);
r.post("/login", login);
r.post("/forgot-password", forgotPassword);
r.post("/reset-password", resetPassword);
r.post("/send-verification-code", authMiddleware, sendVerificationCode); // Requiere autenticación
r.post("/verify-email-code", authMiddleware, verifyEmailCode); // Requiere autenticación
r.post("/ensure-email-account", authMiddleware, ensureEmailAccount); // Asegurar cuenta de correo
r.get("/me", authMiddleware, me);
r.put("/profile", authMiddleware, updateProfile);
r.put("/password", authMiddleware, changePassword);

export default r;

