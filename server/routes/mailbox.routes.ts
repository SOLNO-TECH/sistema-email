import { Router } from "express";
import {
  getInbox,
  sendFromAccount,
  markEmailAsRead,
  toggleStar,
  toggleArchive,
  toggleSpam,
  toggleImportant,
  deleteEmail,
  restoreEmail,
  permanentDelete,
  saveDraft,
  getDrafts,
  deleteDraft,
  toggleLabel,
  bulkOperation,
} from "../controllers/mailbox.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";
import { emailRateLimiter } from "../src/middleware/security.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Crear directorio de uploads para emails si no existe
const emailUploadsDir = path.join(process.cwd(), "uploads", "emails");
if (!fs.existsSync(emailUploadsDir)) {
  fs.mkdirSync(emailUploadsDir, { recursive: true });
}

// Configuración de almacenamiento para emails
const emailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, emailUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  },
});

// Filtro de tipos MIME permitidos para emails
const emailFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes, documentos y archivos de texto.`));
  }
};

// Configuración de multer para emails
const emailUpload = multer({
  storage: emailStorage,
  fileFilter: emailFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB máximo
    files: 10, // Máximo 10 archivos
  },
});

const router = Router();

// Obtener correos
router.get("/inbox", authMiddleware, getInbox);
router.get("/drafts", authMiddleware, getDrafts);

// Enviar y guardar (con soporte para archivos adjuntos)
router.post("/send", authMiddleware, emailRateLimiter, emailUpload.array("attachments", 10), sendFromAccount);
router.post("/draft", authMiddleware, saveDraft);

// Operaciones individuales
router.post("/mark-read", authMiddleware, markEmailAsRead);
router.post("/star", authMiddleware, toggleStar);
router.post("/archive", authMiddleware, toggleArchive);
router.post("/spam", authMiddleware, toggleSpam);
router.post("/important", authMiddleware, toggleImportant);
router.post("/delete", authMiddleware, deleteEmail);
router.post("/restore", authMiddleware, restoreEmail);
router.post("/permanent-delete", authMiddleware, permanentDelete);
router.post("/label", authMiddleware, toggleLabel);
router.delete("/draft", authMiddleware, deleteDraft);

// Operaciones en lote
router.post("/bulk", authMiddleware, bulkOperation);

console.log("✅ Rutas de mailbox registradas");

export default router;

