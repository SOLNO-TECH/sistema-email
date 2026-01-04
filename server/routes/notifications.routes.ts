import { Router } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} from "../controllers/notifications.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";
import { adminMiddleware } from "../src/middleware/admin.middleware";

const router = Router();

// Rutas para usuarios
router.get("/", authMiddleware, getUserNotifications);
router.put("/:id/read", authMiddleware, markNotificationAsRead);
router.put("/read-all", authMiddleware, markAllNotificationsAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

// Ruta para crear notificaciones (admin o sistema interno - sin middleware de admin para permitir uso interno)
router.post("/", authMiddleware, createNotification);

export default router;

