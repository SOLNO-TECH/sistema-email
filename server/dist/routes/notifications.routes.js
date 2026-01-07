"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("../controllers/notifications.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const router = (0, express_1.Router)();
// Rutas para usuarios
router.get("/", auth_middleware_1.authMiddleware, notifications_controller_1.getUserNotifications);
router.put("/:id/read", auth_middleware_1.authMiddleware, notifications_controller_1.markNotificationAsRead);
router.put("/read-all", auth_middleware_1.authMiddleware, notifications_controller_1.markAllNotificationsAsRead);
router.delete("/:id", auth_middleware_1.authMiddleware, notifications_controller_1.deleteNotification);
// Ruta para crear notificaciones (admin o sistema interno - sin middleware de admin para permitir uso interno)
router.post("/", auth_middleware_1.authMiddleware, notifications_controller_1.createNotification);
exports.default = router;
