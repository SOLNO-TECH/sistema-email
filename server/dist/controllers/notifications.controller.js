"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.deleteNotification = deleteNotification;
exports.createNotification = createNotification;
exports.createNotificationForUser = createNotificationForUser;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Obtener notificaciones del usuario
async function getUserNotifications(req, res) {
    try {
        const user = req.user;
        const { unreadOnly } = req.query;
        const where = {
            userId: user.id,
        };
        if (unreadOnly === "true") {
            where.isRead = false;
        }
        const notifications = await prisma_1.default.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50, // Limitar a las últimas 50
        });
        const unreadCount = await prisma_1.default.notification.count({
            where: {
                userId: user.id,
                isRead: false,
            },
        });
        res.json({
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        console.error("Error getting notifications:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Marcar notificación como leída
async function markNotificationAsRead(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const notification = await prisma_1.default.notification.findFirst({
            where: {
                id: parseInt(id),
                userId: user.id,
            },
        });
        if (!notification) {
            return res.status(404).json({ error: "Notificación no encontrada" });
        }
        await prisma_1.default.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true },
        });
        res.json({ success: true, message: "Notificación marcada como leída" });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Marcar todas las notificaciones como leídas
async function markAllNotificationsAsRead(req, res) {
    try {
        const user = req.user;
        await prisma_1.default.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        });
        res.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Eliminar notificación
async function deleteNotification(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const notification = await prisma_1.default.notification.findFirst({
            where: {
                id: parseInt(id),
                userId: user.id,
            },
        });
        if (!notification) {
            return res.status(404).json({ error: "Notificación no encontrada" });
        }
        await prisma_1.default.notification.delete({
            where: { id: parseInt(id) },
        });
        res.json({ success: true, message: "Notificación eliminada" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Crear notificación (para uso interno del sistema o admin)
async function createNotification(req, res) {
    try {
        const currentUser = req.user;
        const { userId, type, category, title, message, link } = req.body;
        if (!userId || !type || !title || !message) {
            return res.status(400).json({ error: "userId, type, title y message son requeridos" });
        }
        // Solo admin puede crear notificaciones para otros usuarios
        if (currentUser.role !== "admin" && currentUser.id !== userId) {
            return res.status(403).json({ error: "No tienes permiso para crear notificaciones para otros usuarios" });
        }
        // Verificar que el usuario existe
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, preferences: true },
        });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        // Verificar preferencias de notificaciones del usuario
        let shouldNotify = true;
        if (user.preferences) {
            try {
                const preferences = JSON.parse(user.preferences);
                if (type === "email" && category) {
                    if (category === "important_announcements") {
                        shouldNotify = preferences.emailSubscriptions?.importantAnnouncements !== false;
                    }
                    else if (category === "business_newsletter") {
                        shouldNotify = preferences.emailSubscriptions?.businessNewsletter !== false;
                    }
                    else if (category === "offers_promotions") {
                        shouldNotify = preferences.emailSubscriptions?.offersPromotions !== false;
                    }
                    else if (category === "welcome_emails") {
                        shouldNotify = preferences.emailSubscriptions?.welcomeEmails !== false;
                    }
                    else if (category === "user_surveys") {
                        shouldNotify = preferences.emailSubscriptions?.userSurveys !== false;
                    }
                }
                else if (type === "product_update" && category) {
                    const productUpdates = preferences.productUpdates;
                    if (productUpdates && productUpdates[category] === false) {
                        shouldNotify = false;
                    }
                }
                else if (type === "app" && category === "in_app") {
                    const appNotifications = preferences.appNotifications;
                    if (appNotifications && appNotifications.inApp === false) {
                        shouldNotify = false;
                    }
                }
                else if (type === "system") {
                    shouldNotify = true; // Las notificaciones del sistema siempre se muestran
                }
            }
            catch (e) {
                console.error("Error parsing preferences:", e);
            }
        }
        if (!shouldNotify) {
            return res.json({
                success: true,
                message: "Notificación no creada debido a preferencias del usuario",
                skipped: true
            });
        }
        const notification = await prisma_1.default.notification.create({
            data: {
                userId,
                type,
                category: category || null,
                title,
                message,
                link: link || null,
            },
        });
        res.json({ success: true, notification });
    }
    catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Función helper para crear notificaciones desde otros controladores
async function createNotificationForUser(userId, type, category, title, message, link) {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, preferences: true },
        });
        if (!user) {
            console.error(`Usuario ${userId} no encontrado para crear notificación`);
            return;
        }
        let shouldNotify = true;
        if (user.preferences) {
            try {
                const preferences = JSON.parse(user.preferences);
                if (type === "email" && category) {
                    if (category === "important_announcements") {
                        shouldNotify = preferences.emailSubscriptions?.importantAnnouncements !== false;
                    }
                    else if (category === "business_newsletter") {
                        shouldNotify = preferences.emailSubscriptions?.businessNewsletter !== false;
                    }
                    else if (category === "offers_promotions") {
                        shouldNotify = preferences.emailSubscriptions?.offersPromotions !== false;
                    }
                    else if (category === "welcome_emails") {
                        shouldNotify = preferences.emailSubscriptions?.welcomeEmails !== false;
                    }
                    else if (category === "user_surveys") {
                        shouldNotify = preferences.emailSubscriptions?.userSurveys !== false;
                    }
                }
                else if (type === "product_update" && category) {
                    const productUpdates = preferences.productUpdates;
                    if (productUpdates && productUpdates[category] === false) {
                        shouldNotify = false;
                    }
                }
                else if (type === "app" && category === "in_app") {
                    const appNotifications = preferences.appNotifications;
                    if (appNotifications && appNotifications.inApp === false) {
                        shouldNotify = false;
                    }
                }
            }
            catch (e) {
                console.error("Error parsing preferences:", e);
            }
        }
        if (shouldNotify) {
            await prisma_1.default.notification.create({
                data: {
                    userId,
                    type,
                    category,
                    title,
                    message,
                    link: link || null,
                },
            });
        }
    }
    catch (error) {
        console.error("Error creating notification for user:", error);
    }
}
