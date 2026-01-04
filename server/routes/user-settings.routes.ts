import { Router } from "express";
import {
  updateUserPreferences,
  getUserPreferences,
  updateRecoverySettings,
  updateSecuritySettings,
  getUserCredits,
  addCredits,
  applyGiftCode,
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  deleteAccount,
  generateRecoveryPhrase,
  setupDeviceRecovery,
  generate2FASecret,
  verify2FACode,
  disable2FA,
} from "../controllers/user-settings.controller";
import {
  sendPhoneVerificationCode,
  verifyPhoneCode,
} from "../controllers/recovery.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

// Preferencias
router.get("/preferences", authMiddleware, getUserPreferences);
router.put("/preferences", authMiddleware, updateUserPreferences);

// Recuperación
router.put("/recovery", authMiddleware, updateRecoverySettings);

// Seguridad
router.put("/security", authMiddleware, updateSecuritySettings);

// Autenticación de dos factores
router.post("/2fa/generate-secret", authMiddleware, generate2FASecret);
router.post("/2fa/verify", authMiddleware, verify2FACode);
router.post("/2fa/disable", authMiddleware, disable2FA);

// Créditos
router.get("/credits", authMiddleware, getUserCredits);
router.post("/credits", authMiddleware, addCredits);

// Códigos de regalo
router.post("/gift-code", authMiddleware, applyGiftCode);

// Contactos de emergencia
router.get("/emergency-contacts", authMiddleware, getEmergencyContacts);
router.post("/emergency-contacts", authMiddleware, addEmergencyContact);
router.delete("/emergency-contacts", authMiddleware, removeEmergencyContact);

// Eliminar cuenta
router.delete("/account", authMiddleware, deleteAccount);

// Verificación de teléfono
router.post("/recovery/send-phone-code", authMiddleware, sendPhoneVerificationCode);
router.post("/recovery/verify-phone-code", authMiddleware, verifyPhoneCode);

// Frase de recuperación
router.post("/recovery/generate-phrase", authMiddleware, generateRecoveryPhrase);

// Recuperación desde dispositivo
router.post("/recovery/setup-device", authMiddleware, setupDeviceRecovery);

export default router;


