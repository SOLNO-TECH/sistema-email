"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_settings_controller_1 = require("../controllers/user-settings.controller");
const recovery_controller_1 = require("../controllers/recovery.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const router = (0, express_1.Router)();
// Preferencias
router.get("/preferences", auth_middleware_1.authMiddleware, user_settings_controller_1.getUserPreferences);
router.put("/preferences", auth_middleware_1.authMiddleware, user_settings_controller_1.updateUserPreferences);
// Recuperación
router.put("/recovery", auth_middleware_1.authMiddleware, user_settings_controller_1.updateRecoverySettings);
// Seguridad
router.put("/security", auth_middleware_1.authMiddleware, user_settings_controller_1.updateSecuritySettings);
// Autenticación de dos factores
router.post("/2fa/generate-secret", auth_middleware_1.authMiddleware, user_settings_controller_1.generate2FASecret);
router.post("/2fa/verify", auth_middleware_1.authMiddleware, user_settings_controller_1.verify2FACode);
router.post("/2fa/disable", auth_middleware_1.authMiddleware, user_settings_controller_1.disable2FA);
// Créditos
router.get("/credits", auth_middleware_1.authMiddleware, user_settings_controller_1.getUserCredits);
router.post("/credits", auth_middleware_1.authMiddleware, user_settings_controller_1.addCredits);
// Códigos de regalo
router.post("/gift-code", auth_middleware_1.authMiddleware, user_settings_controller_1.applyGiftCode);
// Contactos de emergencia
router.get("/emergency-contacts", auth_middleware_1.authMiddleware, user_settings_controller_1.getEmergencyContacts);
router.post("/emergency-contacts", auth_middleware_1.authMiddleware, user_settings_controller_1.addEmergencyContact);
router.delete("/emergency-contacts", auth_middleware_1.authMiddleware, user_settings_controller_1.removeEmergencyContact);
// Eliminar cuenta
router.delete("/account", auth_middleware_1.authMiddleware, user_settings_controller_1.deleteAccount);
// Verificación de teléfono
router.post("/recovery/send-phone-code", auth_middleware_1.authMiddleware, recovery_controller_1.sendPhoneVerificationCode);
router.post("/recovery/verify-phone-code", auth_middleware_1.authMiddleware, recovery_controller_1.verifyPhoneCode);
// Frase de recuperación
router.post("/recovery/generate-phrase", auth_middleware_1.authMiddleware, user_settings_controller_1.generateRecoveryPhrase);
// Recuperación desde dispositivo
router.post("/recovery/setup-device", auth_middleware_1.authMiddleware, user_settings_controller_1.setupDeviceRecovery);
exports.default = router;
