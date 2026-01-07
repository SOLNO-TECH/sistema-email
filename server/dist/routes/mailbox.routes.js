"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mailbox_controller_1 = require("../controllers/mailbox.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const security_middleware_1 = require("../src/middleware/security.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Crear directorio de uploads para emails si no existe
const emailUploadsDir = path_1.default.join(process.cwd(), "uploads", "emails");
if (!fs_1.default.existsSync(emailUploadsDir)) {
    fs_1.default.mkdirSync(emailUploadsDir, { recursive: true });
}
// Configuración de almacenamiento para emails
const emailStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, emailUploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        const name = path_1.default.basename(file.originalname, ext);
        cb(null, `${uniqueSuffix}-${name}${ext}`);
    },
});
// Filtro de tipos MIME permitidos para emails
const emailFileFilter = (req, file, cb) => {
    const allowedMimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
        "application/x-zip-compressed",
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes, documentos y archivos de texto.`));
    }
};
// Configuración de multer para emails
const emailUpload = (0, multer_1.default)({
    storage: emailStorage,
    fileFilter: emailFileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB máximo
        files: 10, // Máximo 10 archivos
    },
});
const router = (0, express_1.Router)();
// Obtener correos
router.get("/inbox", auth_middleware_1.authMiddleware, mailbox_controller_1.getInbox);
router.get("/drafts", auth_middleware_1.authMiddleware, mailbox_controller_1.getDrafts);
// Enviar y guardar (con soporte para archivos adjuntos)
router.post("/send", auth_middleware_1.authMiddleware, security_middleware_1.emailRateLimiter, emailUpload.array("attachments", 10), mailbox_controller_1.sendFromAccount);
router.post("/draft", auth_middleware_1.authMiddleware, mailbox_controller_1.saveDraft);
// Operaciones individuales
router.post("/mark-read", auth_middleware_1.authMiddleware, mailbox_controller_1.markEmailAsRead);
router.post("/star", auth_middleware_1.authMiddleware, mailbox_controller_1.toggleStar);
router.post("/archive", auth_middleware_1.authMiddleware, mailbox_controller_1.toggleArchive);
router.post("/spam", auth_middleware_1.authMiddleware, mailbox_controller_1.toggleSpam);
router.post("/important", auth_middleware_1.authMiddleware, mailbox_controller_1.toggleImportant);
router.post("/delete", auth_middleware_1.authMiddleware, mailbox_controller_1.deleteEmail);
router.post("/restore", auth_middleware_1.authMiddleware, mailbox_controller_1.restoreEmail);
router.post("/permanent-delete", auth_middleware_1.authMiddleware, mailbox_controller_1.permanentDelete);
router.post("/label", auth_middleware_1.authMiddleware, mailbox_controller_1.toggleLabel);
router.delete("/draft", auth_middleware_1.authMiddleware, mailbox_controller_1.deleteDraft);
// Operaciones en lote
router.post("/bulk", auth_middleware_1.authMiddleware, mailbox_controller_1.bulkOperation);
console.log("✅ Rutas de mailbox registradas");
exports.default = router;
