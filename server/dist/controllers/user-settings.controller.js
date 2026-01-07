"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPreferences = updateUserPreferences;
exports.getUserPreferences = getUserPreferences;
exports.updateRecoverySettings = updateRecoverySettings;
exports.updateSecuritySettings = updateSecuritySettings;
exports.generate2FASecret = generate2FASecret;
exports.verify2FACode = verify2FACode;
exports.disable2FA = disable2FA;
exports.getUserCredits = getUserCredits;
exports.addCredits = addCredits;
exports.applyGiftCode = applyGiftCode;
exports.getEmergencyContacts = getEmergencyContacts;
exports.addEmergencyContact = addEmergencyContact;
exports.removeEmergencyContact = removeEmergencyContact;
exports.deleteAccount = deleteAccount;
exports.generateRecoveryPhrase = generateRecoveryPhrase;
exports.setupDeviceRecovery = setupDeviceRecovery;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Actualizar preferencias de usuario
async function updateUserPreferences(req, res) {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                preferences: typeof preferences === "string" ? preferences : JSON.stringify(preferences),
            },
            select: {
                id: true,
                email: true,
                name: true,
                preferences: true,
            },
        });
        let preferencesParsed = null;
        if (updatedUser.preferences) {
            try {
                preferencesParsed = JSON.parse(updatedUser.preferences);
            }
            catch (e) {
                console.error("Error parsing preferences:", e);
            }
        }
        res.json({
            user: {
                ...updatedUser,
                preferences: preferencesParsed,
            },
        });
    }
    catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener preferencias de usuario
async function getUserPreferences(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                preferences: true,
                recoveryEmail: true,
                recoveryPhone: true,
                recoveryPhoneCountryCode: true,
                allowEmailRecovery: true,
                allowPhoneRecovery: true,
                allowQRLogin: true,
                allowRecoveryPhrase: true,
                allowDeviceRecovery: true,
                recoveryPhrase: true,
                credits: true,
                twoPasswordMode: true,
                twoFactorEnabled: true,
                twoFactorMethod: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        let preferencesParsed = null;
        if (user.preferences) {
            try {
                preferencesParsed = JSON.parse(user.preferences);
            }
            catch (e) {
                console.error("Error parsing preferences:", e);
            }
        }
        res.json({
            preferences: preferencesParsed || {},
            recovery: {
                email: user.recoveryEmail,
                phone: user.recoveryPhone,
                phoneCountryCode: user.recoveryPhoneCountryCode,
                allowEmailRecovery: user.allowEmailRecovery,
                allowPhoneRecovery: user.allowPhoneRecovery,
                allowQRLogin: user.allowQRLogin,
                allowRecoveryPhrase: user.allowRecoveryPhrase,
                allowDeviceRecovery: user.allowDeviceRecovery,
            },
            credits: user.credits,
            security: {
                twoPasswordMode: user.twoPasswordMode,
                twoFactorEnabled: user.twoFactorEnabled,
                twoFactorMethod: user.twoFactorMethod,
            },
        });
    }
    catch (error) {
        console.error("Error getting preferences:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Actualizar configuración de recuperación
async function updateRecoverySettings(req, res) {
    try {
        const userId = req.user.id;
        const { recoveryEmail, recoveryPhone, recoveryPhoneCountryCode, allowEmailRecovery, allowPhoneRecovery, allowQRLogin, allowRecoveryPhrase, allowDeviceRecovery, } = req.body;
        const updateData = {};
        if (recoveryEmail !== undefined)
            updateData.recoveryEmail = recoveryEmail;
        if (recoveryPhone !== undefined)
            updateData.recoveryPhone = recoveryPhone;
        if (recoveryPhoneCountryCode !== undefined)
            updateData.recoveryPhoneCountryCode = recoveryPhoneCountryCode;
        if (allowEmailRecovery !== undefined)
            updateData.allowEmailRecovery = allowEmailRecovery;
        if (allowPhoneRecovery !== undefined)
            updateData.allowPhoneRecovery = allowPhoneRecovery;
        if (allowQRLogin !== undefined)
            updateData.allowQRLogin = allowQRLogin;
        if (allowRecoveryPhrase !== undefined)
            updateData.allowRecoveryPhrase = allowRecoveryPhrase;
        if (allowDeviceRecovery !== undefined)
            updateData.allowDeviceRecovery = allowDeviceRecovery;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                recoveryEmail: true,
                recoveryPhone: true,
                recoveryPhoneCountryCode: true,
                allowEmailRecovery: true,
                allowPhoneRecovery: true,
                allowQRLogin: true,
                allowRecoveryPhrase: true,
                allowDeviceRecovery: true,
            },
        });
        res.json({ recovery: updatedUser });
    }
    catch (error) {
        console.error("Error updating recovery settings:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Actualizar configuración de seguridad
async function updateSecuritySettings(req, res) {
    try {
        const userId = req.user.id;
        const { twoPasswordMode, twoFactorEnabled, twoFactorMethod } = req.body;
        const updateData = {};
        if (twoPasswordMode !== undefined)
            updateData.twoPasswordMode = twoPasswordMode;
        if (twoFactorEnabled !== undefined)
            updateData.twoFactorEnabled = twoFactorEnabled;
        if (twoFactorMethod !== undefined)
            updateData.twoFactorMethod = twoFactorMethod;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                twoPasswordMode: true,
                twoFactorEnabled: true,
                twoFactorMethod: true,
            },
        });
        res.json({ security: updatedUser });
    }
    catch (error) {
        console.error("Error updating security settings:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Generar secret para 2FA
async function generate2FASecret(req, res) {
    try {
        const userId = req.user.id;
        const speakeasy = require("speakeasy");
        const QRCode = require("qrcode");
        // Obtener información del usuario
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        // Generar secret
        const secret = speakeasy.generateSecret({
            name: `Xstar Mail (${user.email})`,
            issuer: "Xstar Mail",
            length: 32,
        });
        // Generar QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        // Guardar secret temporalmente (no habilitar 2FA hasta que se verifique)
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret.base32, // Guardar el secret base32
                // No habilitar twoFactorEnabled todavía, solo cuando se verifique el código
            },
        });
        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32,
        });
    }
    catch (error) {
        console.error("Error generating 2FA secret:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Verificar código 2FA y habilitar
async function verify2FACode(req, res) {
    try {
        const userId = req.user.id;
        const { code, method } = req.body; // method: "app" o "security_key"
        if (!code) {
            return res.status(400).json({ error: "Código requerido" });
        }
        // Obtener el secret del usuario
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true },
        });
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ error: "No se encontró un secret de 2FA. Genera uno primero." });
        }
        const speakeasy = require("speakeasy");
        // Verificar el código
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: code,
            window: 2, // Permitir códigos de los últimos 2 períodos (60 segundos cada uno)
        });
        if (!verified) {
            return res.status(400).json({ error: "Código inválido" });
        }
        // Habilitar 2FA
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorMethod: method || "app",
            },
        });
        res.json({ message: "Autenticación de dos factores habilitada exitosamente" });
    }
    catch (error) {
        console.error("Error verifying 2FA code:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Deshabilitar 2FA
async function disable2FA(req, res) {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Contraseña requerida para deshabilitar 2FA" });
        }
        // Verificar contraseña
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const { comparePassword } = await Promise.resolve().then(() => __importStar(require("../src/utils/hash")));
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }
        // Deshabilitar 2FA y limpiar secret
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorMethod: null,
                twoFactorSecret: null,
            },
        });
        res.json({ message: "Autenticación de dos factores deshabilitada" });
    }
    catch (error) {
        console.error("Error disabling 2FA:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Obtener créditos
async function getUserCredits(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                credits: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ credits: user.credits || 0 });
    }
    catch (error) {
        console.error("Error getting credits:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Agregar créditos
async function addCredits(req, res) {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        });
        const newCredits = (user?.credits || 0) + parseFloat(amount);
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                credits: newCredits,
            },
            select: {
                credits: true,
            },
        });
        res.json({ credits: updatedUser.credits });
    }
    catch (error) {
        console.error("Error adding credits:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Aplicar código de regalo
async function applyGiftCode(req, res) {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        if (!code || typeof code !== "string") {
            return res.status(400).json({ error: "Código promocional inválido" });
        }
        const codeUpper = code.toUpperCase();
        // Buscar el código promocional en la base de datos
        const promoCode = await prisma_1.default.promoCode.findUnique({
            where: { code: codeUpper },
        });
        if (!promoCode) {
            return res.status(400).json({ error: "Código promocional no encontrado" });
        }
        // Verificar que el código esté activo
        if (!promoCode.isActive) {
            return res.status(400).json({ error: "Este código promocional no está activo" });
        }
        // Verificar fecha de validez
        const now = new Date();
        if (promoCode.validFrom > now) {
            return res.status(400).json({ error: "Este código promocional aún no es válido" });
        }
        if (promoCode.validUntil && promoCode.validUntil < now) {
            return res.status(400).json({ error: "Este código promocional ha expirado" });
        }
        // Verificar límite de usos
        if (promoCode.maxUses !== null && promoCode.currentUses >= promoCode.maxUses) {
            return res.status(400).json({ error: "Este código promocional ha alcanzado su límite de usos" });
        }
        // Obtener códigos ya aplicados por el usuario
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                appliedGiftCodes: true,
                credits: true,
            },
        });
        let appliedCodes = [];
        if (user?.appliedGiftCodes) {
            try {
                appliedCodes = JSON.parse(user.appliedGiftCodes);
            }
            catch (e) {
                console.error("Error parsing applied gift codes:", e);
            }
        }
        // Verificar si el código ya fue aplicado por este usuario
        if (appliedCodes.includes(codeUpper)) {
            return res.status(400).json({ error: "Este código promocional ya fue utilizado por ti" });
        }
        // Calcular el valor del descuento
        let creditsToAdd = 0;
        if (promoCode.discountType === "fixed") {
            creditsToAdd = promoCode.discountValue;
        }
        else if (promoCode.discountType === "percentage") {
            // Para porcentajes, necesitaríamos un monto base, pero por ahora lo tratamos como créditos fijos
            // En el futuro se podría aplicar a una compra específica
            creditsToAdd = promoCode.discountValue; // Por ahora, el porcentaje se aplica como créditos fijos
        }
        // Aplicar el código
        appliedCodes.push(codeUpper);
        const newCredits = (user?.credits || 0) + creditsToAdd;
        // Actualizar usuario y código promocional en una transacción
        await prisma_1.default.$transaction([
            prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    credits: newCredits,
                    appliedGiftCodes: JSON.stringify(appliedCodes),
                },
            }),
            prisma_1.default.promoCode.update({
                where: { id: promoCode.id },
                data: {
                    currentUses: {
                        increment: 1,
                    },
                },
            }),
        ]);
        res.json({
            message: "Código promocional aplicado exitosamente",
            creditsAdded: creditsToAdd,
            totalCredits: newCredits,
            promoCode: {
                code: promoCode.code,
                description: promoCode.description,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
            },
        });
    }
    catch (error) {
        console.error("Error applying gift code:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Obtener contactos de emergencia
async function getEmergencyContacts(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                emergencyContacts: true,
            },
        });
        let contacts = [];
        if (user?.emergencyContacts) {
            try {
                contacts = JSON.parse(user.emergencyContacts);
            }
            catch (e) {
                console.error("Error parsing emergency contacts:", e);
            }
        }
        res.json({ contacts });
    }
    catch (error) {
        console.error("Error getting emergency contacts:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Agregar contacto de emergencia
async function addEmergencyContact(req, res) {
    try {
        const userId = req.user.id;
        const { email } = req.body;
        if (!email || typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ error: "Invalid email address" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                emergencyContacts: true,
            },
        });
        let contacts = [];
        if (user?.emergencyContacts) {
            try {
                contacts = JSON.parse(user.emergencyContacts);
            }
            catch (e) {
                console.error("Error parsing emergency contacts:", e);
            }
        }
        // Verificar si ya existe
        if (contacts.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ error: "Este contacto ya está agregado" });
        }
        contacts.push({ email });
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                emergencyContacts: JSON.stringify(contacts),
            },
        });
        res.json({ message: "Contacto de emergencia agregado", contacts });
    }
    catch (error) {
        console.error("Error adding emergency contact:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar contacto de emergencia
async function removeEmergencyContact(req, res) {
    try {
        const userId = req.user.id;
        const { email } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                emergencyContacts: true,
            },
        });
        let contacts = [];
        if (user?.emergencyContacts) {
            try {
                contacts = JSON.parse(user.emergencyContacts);
            }
            catch (e) {
                console.error("Error parsing emergency contacts:", e);
            }
        }
        contacts = contacts.filter((c) => c.email.toLowerCase() !== email.toLowerCase());
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                emergencyContacts: JSON.stringify(contacts),
            },
        });
        res.json({ message: "Contacto de emergencia eliminado", contacts });
    }
    catch (error) {
        console.error("Error removing emergency contact:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar cuenta
async function deleteAccount(req, res) {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Contraseña requerida" });
        }
        // Verificar que no sea el admin por defecto
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                password: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        // Verificar si es el admin por defecto
        // Buscar el primer admin creado (el más antiguo)
        const firstAdmin = await prisma_1.default.user.findFirst({
            where: { role: "admin" },
            orderBy: { id: "asc" },
            select: { id: true, email: true },
        });
        // Es admin por defecto si:
        // 1. Es el primer admin creado (menor ID)
        // 2. O tiene el email específico "admin@xstarmail.es"
        const isDefaultAdmin = user.role === "admin" && ((firstAdmin && firstAdmin.id === user.id) ||
            user.email === "admin@xstarmail.es" ||
            user.email.toLowerCase().includes("admin") && user.id === 1);
        if (isDefaultAdmin) {
            return res.status(403).json({ error: "No se puede eliminar la cuenta de administrador por defecto" });
        }
        // Verificar contraseña
        const { comparePassword } = await Promise.resolve().then(() => __importStar(require("../src/utils/hash")));
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }
        // Eliminar usuario (Prisma eliminará en cascada los registros relacionados)
        await prisma_1.default.user.delete({
            where: { id: userId },
        });
        res.json({ message: "Cuenta eliminada exitosamente" });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Generar frase de recuperación
async function generateRecoveryPhrase(req, res) {
    try {
        const userId = req.user.id;
        // Generar frase de recuperación (12 palabras aleatorias)
        const wordList = [
            "casa", "perro", "gato", "árbol", "sol", "luna", "estrella", "mar", "montaña", "río",
            "libro", "coche", "avión", "barco", "ciudad", "campo", "flor", "hoja", "piedra", "agua",
            "fuego", "tierra", "aire", "nube", "viento", "lluvia", "nieve", "hielo", "arena", "roca",
            "oro", "plata", "hierro", "madera", "papel", "tela", "lana", "seda", "cuero", "plástico",
            "cristal", "vidrio", "cerámica", "barro", "arcilla", "cemento", "ladrillo", "teja", "pizarra", "mármol"
        ];
        const phrase = [];
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * wordList.length);
            phrase.push(wordList[randomIndex]);
        }
        const recoveryPhrase = phrase.join(" ");
        // Hashear la frase antes de guardarla (en producción, usar encriptación más fuerte)
        const { hashPassword } = await Promise.resolve().then(() => __importStar(require("../src/utils/hash")));
        const hashedPhrase = await hashPassword(recoveryPhrase);
        // Guardar frase hasheada en la base de datos
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                recoveryPhrase: hashedPhrase,
                allowRecoveryPhrase: true,
            },
        });
        res.json({
            phrase: recoveryPhrase, // Devolver la frase sin hashear solo una vez
            message: "Frase de recuperación generada exitosamente. Guárdala en un lugar seguro.",
        });
    }
    catch (error) {
        console.error("Error generating recovery phrase:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Configurar recuperación desde dispositivo
async function setupDeviceRecovery(req, res) {
    try {
        const userId = req.user.id;
        const { deviceInfo } = req.body; // Información del dispositivo (navegador, OS, etc.)
        // Generar un hash único para este dispositivo
        const deviceHash = require("crypto")
            .createHash("sha256")
            .update(`${userId}-${deviceInfo || "default"}-${Date.now()}`)
            .digest("hex");
        // Guardar información del dispositivo en las preferencias
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { preferences: true },
        });
        const preferences = user?.preferences ? JSON.parse(user.preferences) : {};
        if (!preferences.trustedDevices) {
            preferences.trustedDevices = [];
        }
        preferences.trustedDevices.push({
            hash: deviceHash,
            deviceInfo: deviceInfo || "Dispositivo desconocido",
            createdAt: new Date().toISOString(),
        });
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                preferences: JSON.stringify(preferences),
                allowDeviceRecovery: true,
            },
        });
        res.json({
            deviceHash,
            message: "Dispositivo de confianza configurado exitosamente",
        });
    }
    catch (error) {
        console.error("Error setting up device recovery:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
