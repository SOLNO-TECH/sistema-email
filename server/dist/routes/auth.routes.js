"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const r = (0, express_1.Router)();
r.post("/register", auth_controller_1.register);
r.post("/login", auth_controller_1.login);
r.post("/forgot-password", auth_controller_1.forgotPassword);
r.post("/reset-password", auth_controller_1.resetPassword);
r.post("/send-verification-code", auth_middleware_1.authMiddleware, auth_controller_1.sendVerificationCode); // Requiere autenticación
r.post("/verify-email-code", auth_middleware_1.authMiddleware, auth_controller_1.verifyEmailCode); // Requiere autenticación
r.post("/ensure-email-account", auth_middleware_1.authMiddleware, auth_controller_1.ensureEmailAccount); // Asegurar cuenta de correo
r.get("/me", auth_middleware_1.authMiddleware, auth_controller_1.me);
r.put("/profile", auth_middleware_1.authMiddleware, auth_controller_1.updateProfile);
r.put("/password", auth_middleware_1.authMiddleware, auth_controller_1.changePassword);
exports.default = r;
