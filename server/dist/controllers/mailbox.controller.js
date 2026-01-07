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
exports.getInbox = getInbox;
exports.sendFromAccount = sendFromAccount;
exports.markEmailAsRead = markEmailAsRead;
exports.toggleStar = toggleStar;
exports.toggleArchive = toggleArchive;
exports.toggleSpam = toggleSpam;
exports.toggleImportant = toggleImportant;
exports.deleteEmail = deleteEmail;
exports.restoreEmail = restoreEmail;
exports.permanentDelete = permanentDelete;
exports.saveDraft = saveDraft;
exports.getDrafts = getDrafts;
exports.deleteDraft = deleteDraft;
exports.toggleLabel = toggleLabel;
exports.bulkOperation = bulkOperation;
const prisma_1 = __importDefault(require("../lib/prisma"));
const security_middleware_1 = require("../src/middleware/security.middleware");
// Obtener mensajes recibidos en una cuenta de correo
async function getInbox(req, res) {
    try {
        const user = req.user;
        const { emailAccountId, sync } = req.query;
        if (!emailAccountId) {
            return res.status(400).json({ error: "emailAccountId is required" });
        }
        // Verificar que la cuenta pertenece al usuario
        const account = await prisma_1.default.emailAccount.findFirst({
            where: { id: parseInt(emailAccountId), ownerId: user.id },
            include: {
                domain: true,
            },
        });
        if (!account) {
            return res.status(404).json({ error: "Email account not found" });
        }
        // Si sync=true, sincronizar correos desde IMAP antes de mostrar
        if (sync === "true") {
            try {
                const ImapReceiverService = (await Promise.resolve().then(() => __importStar(require("../services/imap-receiver.service")))).default;
                // Intentar usar la contraseña almacenada en smtpPassword si está disponible
                // Si no, usar la contraseña hasheada (no funcionará, pero intentamos)
                // En producción, deberías tener un sistema de almacenamiento seguro de contraseñas
                let syncPassword = account.smtpPassword || process.env.EMAIL_SYNC_PASSWORD;
                // Si no hay contraseña disponible, intentar usar la configuración del dominio
                if (!syncPassword && account.domain) {
                    const domain = await prisma_1.default.domain.findUnique({
                        where: { id: account.domainId },
                        select: { smtpPassword: true },
                    });
                    syncPassword = domain?.smtpPassword || syncPassword;
                }
                // Si aún no hay contraseña, usar una contraseña por defecto o saltar sincronización
                if (!syncPassword) {
                    console.warn(`⚠️ No se puede sincronizar ${account.address}: contraseña no disponible`);
                    console.warn(`   💡 Configura EMAIL_SYNC_PASSWORD en .env o asegúrate de que smtpPassword esté guardada`);
                }
                else {
                    // Obtener configuración IMAP del dominio o usar valores por defecto
                    // Si es servidor propio, usar localhost o el mismo host SMTP
                    let imapHost = process.env.IMAP_HOST;
                    if (!imapHost) {
                        // Intentar derivar del host SMTP
                        if (account.smtpHost) {
                            imapHost = account.smtpHost.replace("smtp", "imap").replace("mail", "imap");
                        }
                        else if (account.domain?.smtpHost) {
                            imapHost = account.domain.smtpHost.replace("smtp", "imap").replace("mail", "imap");
                        }
                        else if (process.env.EMAIL_SMTP_HOST) {
                            imapHost = process.env.EMAIL_SMTP_HOST.replace("smtp", "imap").replace("mail", "imap");
                        }
                    }
                    // Si el host SMTP es localhost o similar, usar localhost para IMAP también
                    if (!imapHost || imapHost.includes("localhost") || imapHost.includes("127.0.0.1") || imapHost === "imap.gmail.com") {
                        imapHost = "localhost";
                    }
                    console.log(`📧 Intentando sincronizar ${account.address} desde ${imapHost}:${process.env.IMAP_PORT || 993}`);
                    const syncResult = await ImapReceiverService.fetchAndStoreEmails(account.id, account.address, syncPassword, imapHost);
                    if (syncResult.success) {
                        console.log(`✅ Sincronizados ${syncResult.count} correos para ${account.address}`);
                    }
                    else {
                        console.warn(`⚠️ Error sincronizando correos para ${account.address}: ${syncResult.error}`);
                        console.warn(`   💡 Verifica que:`);
                        console.warn(`      - Dovecot esté corriendo: sudo systemctl status dovecot`);
                        console.warn(`      - La contraseña SMTP sea correcta`);
                        console.warn(`      - IMAP_HOST esté configurado en .env (actual: ${imapHost})`);
                        console.warn(`      - El usuario exista en Dovecot`);
                    }
                }
            }
            catch (syncError) {
                console.error("Error sincronizando correos:", syncError);
                // Continuar aunque falle la sincronización
            }
        }
        // Obtener correos de la BD (incluye recibidos y enviados, pero excluye borradores y eliminados permanentemente)
        const emails = await prisma_1.default.email.findMany({
            where: {
                emailAccountId: account.id,
                isDeleted: false, // Excluir correos eliminados permanentemente
                isDraft: false, // Excluir borradores (se obtienen por separado)
            },
            orderBy: {
                receivedAt: "desc",
            },
            take: 500, // Aumentar límite para incluir más correos
            include: {
                attachments: true,
            },
        });
        res.json(emails);
    }
    catch (err) {
        console.error("Get inbox error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Enviar correo desde una cuenta específica
async function sendFromAccount(req, res) {
    try {
        const user = req.user;
        const { emailAccountId, to, subject, message } = req.body;
        const files = req.files;
        // Validar campos requeridos
        if (!emailAccountId || !to || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Validar y sanitizar inputs
        const accountId = (0, security_middleware_1.sanitizeInt)(emailAccountId);
        if (!accountId) {
            return res.status(400).json({ error: "Invalid emailAccountId" });
        }
        const sanitizedTo = (0, security_middleware_1.sanitizeEmail)(to);
        if (!sanitizedTo) {
            return res.status(400).json({ error: "Invalid email address" });
        }
        const sanitizedSubject = subject.trim().substring(0, 500); // Limitar longitud
        const sanitizedMessage = (0, security_middleware_1.sanitizeHTML)(message); // Sanitizar HTML
        // Verificar que la cuenta pertenece al usuario
        const account = await prisma_1.default.emailAccount.findFirst({
            where: { id: emailAccountId, ownerId: user.id },
        });
        if (!account) {
            return res.status(404).json({ error: "Email account not found" });
        }
        // No se requiere contraseña ya que el usuario está autenticado con JWT
        // La cuenta pertenece al usuario autenticado, por lo que puede enviar correos
        // Intentar enviar el correo realmente usando la configuración SMTP de la cuenta/dominio
        let emailSent = false;
        let emailError;
        let messageId;
        try {
            const EmailSenderService = (await Promise.resolve().then(() => __importStar(require("../services/email-sender.service")))).default;
            const result = await EmailSenderService.sendFromAccount(account.id, // Pasar el ID de la cuenta para obtener su configuración SMTP
            sanitizedTo, sanitizedSubject, sanitizedMessage);
            if (result.success) {
                emailSent = true;
                messageId = result.messageId;
                console.log(`✅ Correo enviado desde ${account.address} realmente:`, result.messageId);
            }
            else {
                emailError = result.error;
                console.warn("⚠️ No se pudo enviar el correo:", result.error);
            }
        }
        catch (error) {
            console.warn("⚠️ Error al intentar enviar correo real:", error.message);
            emailError = error.message;
        }
        // Guardar correo en BD (tanto si se envió como si no)
        // Extraer texto plano del HTML si es necesario
        const textBody = sanitizedMessage.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        const savedEmail = await prisma_1.default.email.create({
            data: {
                emailAccountId: account.id,
                from: account.address,
                to: sanitizedTo,
                subject: sanitizedSubject,
                body: textBody || "(Sin contenido)", // Texto plano sin HTML
                htmlBody: sanitizedMessage, // Guardar HTML sanitizado
                isRead: true,
                isSent: true,
                messageId: messageId || null,
                sentAt: emailSent ? new Date() : null, // Solo marcar como enviado si realmente se envió
                receivedAt: new Date(),
            },
        });
        // Guardar archivos adjuntos si existen
        if (files && files.length > 0) {
            await Promise.all(files.map((file) => {
                const relativePath = file.path.replace(/\\/g, "/");
                return prisma_1.default.emailAttachment.create({
                    data: {
                        emailId: savedEmail.id,
                        fileName: file.originalname,
                        filePath: relativePath,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                    },
                });
            }));
        }
        res.json({
            success: emailSent || !process.env.EMAIL_SMTP_USER, // Si no hay SMTP configurado, se considera éxito (modo simulación)
            message: emailSent
                ? "Email sent successfully"
                : emailError || "Email saved (SMTP not configured - simulation mode)",
            data: {
                id: savedEmail.id,
                from: savedEmail.from,
                to: savedEmail.to,
                subject: savedEmail.subject,
                message: savedEmail.body,
                date: savedEmail.sentAt,
                sent: emailSent,
                error: emailError,
                messageId: savedEmail.messageId,
            },
        });
    }
    catch (err) {
        console.error("Send from account error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Marcar email como leído
async function markEmailAsRead(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        // Verificar que el email pertenece a una cuenta del usuario
        const email = await prisma_1.default.email.findFirst({
            where: { id: parseInt(emailId) },
            include: {
                account: {
                    select: { ownerId: true },
                },
            },
        });
        if (!email) {
            return res.status(404).json({ error: "Email not found" });
        }
        if (email.account.ownerId !== user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        // Marcar como leído
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isRead: true },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Mark email as read error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Helper para verificar que el email pertenece al usuario
async function verifyEmailOwnership(emailId, userId) {
    // Validar y sanitizar emailId
    const id = (0, security_middleware_1.sanitizeInt)(emailId);
    if (!id) {
        return { error: "Invalid emailId", email: null };
    }
    const email = await prisma_1.default.email.findFirst({
        where: { id },
        include: {
            account: {
                select: { ownerId: true },
            },
        },
    });
    if (!email) {
        return { error: "Email not found", email: null };
    }
    if (email.account.ownerId !== userId) {
        return { error: "Unauthorized", email: null };
    }
    return { error: null, email };
}
// Destacar/desdestacar email
async function toggleStar(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isStarred: !email.isStarred },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Toggle star error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Archivar/desarchivar email
async function toggleArchive(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isArchived: !email.isArchived },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Toggle archive error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Marcar como spam/no spam
async function toggleSpam(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isSpam: !email.isSpam },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Toggle spam error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Marcar como importante/no importante
async function toggleImportant(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isImportant: !email.isImportant },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Toggle important error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Mover a papelera
async function deleteEmail(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isDeleted: true },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Delete email error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Restaurar de papelera
async function restoreEmail(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { isDeleted: false },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Restore email error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar permanentemente
async function permanentDelete(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        await prisma_1.default.email.delete({
            where: { id: email.id },
        });
        res.json({ success: true, message: "Email deleted permanently" });
    }
    catch (err) {
        console.error("Permanent delete error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Guardar borrador
async function saveDraft(req, res) {
    try {
        const user = req.user;
        const { emailAccountId, to, subject, message, draftId } = req.body;
        if (!emailAccountId || !to || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Sanitizar inputs
        const sanitizedTo = (0, security_middleware_1.sanitizeEmail)(to);
        if (!sanitizedTo) {
            return res.status(400).json({ error: "Invalid email address" });
        }
        const sanitizedSubject = subject.trim().substring(0, 500); // Limitar longitud
        const sanitizedMessage = (0, security_middleware_1.sanitizeHTML)(message); // Sanitizar HTML
        // Verificar que la cuenta pertenece al usuario
        const account = await prisma_1.default.emailAccount.findFirst({
            where: { id: emailAccountId, ownerId: user.id },
        });
        if (!account) {
            return res.status(404).json({ error: "Email account not found" });
        }
        let savedEmail;
        if (draftId) {
            // Validar draftId
            const draftIdNum = (0, security_middleware_1.sanitizeInt)(draftId);
            if (!draftIdNum) {
                return res.status(400).json({ error: "Invalid draftId" });
            }
            // Actualizar borrador existente
            savedEmail = await prisma_1.default.email.update({
                where: { id: draftIdNum },
                data: {
                    to: sanitizedTo,
                    subject: sanitizedSubject,
                    body: sanitizedMessage.replace(/<[^>]*>/g, ""),
                    htmlBody: sanitizedMessage,
                    isDraft: true,
                },
            });
        }
        else {
            // Crear nuevo borrador
            savedEmail = await prisma_1.default.email.create({
                data: {
                    emailAccountId: account.id,
                    from: account.address,
                    to: sanitizedTo,
                    subject: sanitizedSubject,
                    body: sanitizedMessage.replace(/<[^>]*>/g, ""),
                    htmlBody: sanitizedMessage,
                    isDraft: true,
                    isSent: false,
                    isRead: true,
                    receivedAt: new Date(),
                },
            });
        }
        res.json({ success: true, email: savedEmail });
    }
    catch (err) {
        console.error("Save draft error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener borradores
async function getDrafts(req, res) {
    try {
        const user = req.user;
        const { emailAccountId } = req.query;
        if (!emailAccountId) {
            return res.status(400).json({ error: "emailAccountId is required" });
        }
        // Verificar que la cuenta pertenece al usuario
        const account = await prisma_1.default.emailAccount.findFirst({
            where: { id: parseInt(emailAccountId), ownerId: user.id },
        });
        if (!account) {
            return res.status(404).json({ error: "Email account not found" });
        }
        const drafts = await prisma_1.default.email.findMany({
            where: {
                emailAccountId: account.id,
                isDraft: true,
            },
            orderBy: {
                receivedAt: "desc",
            },
            include: {
                attachments: true,
            },
        });
        res.json(drafts);
    }
    catch (err) {
        console.error("Get drafts error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar borrador
async function deleteDraft(req, res) {
    try {
        const user = req.user;
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "emailId is required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        if (!email.isDraft) {
            return res.status(400).json({ error: "Email is not a draft" });
        }
        await prisma_1.default.email.delete({
            where: { id: email.id },
        });
        res.json({ success: true, message: "Draft deleted" });
    }
    catch (err) {
        console.error("Delete draft error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Agregar/quitar etiqueta
async function toggleLabel(req, res) {
    try {
        const user = req.user;
        const { emailId, label } = req.body;
        if (!emailId || !label) {
            return res.status(400).json({ error: "emailId and label are required" });
        }
        const { error, email } = await verifyEmailOwnership(parseInt(emailId), user.id);
        if (error) {
            return res.status(error === "Unauthorized" ? 403 : 404).json({ error });
        }
        const currentLabels = email.labels ? JSON.parse(email.labels) : [];
        const labelIndex = currentLabels.indexOf(label);
        let newLabels;
        if (labelIndex > -1) {
            // Quitar etiqueta
            newLabels = currentLabels.filter((l) => l !== label);
        }
        else {
            // Agregar etiqueta
            newLabels = [...currentLabels, label];
        }
        const updatedEmail = await prisma_1.default.email.update({
            where: { id: email.id },
            data: { labels: JSON.stringify(newLabels) },
        });
        res.json({ success: true, email: updatedEmail });
    }
    catch (err) {
        console.error("Toggle label error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Operaciones en lote
async function bulkOperation(req, res) {
    try {
        const user = req.user;
        const { emailIds, operation } = req.body;
        if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
            return res.status(400).json({ error: "emailIds array is required" });
        }
        if (!operation) {
            return res.status(400).json({ error: "operation is required" });
        }
        // Verificar que todos los emails pertenecen al usuario
        const emails = await prisma_1.default.email.findMany({
            where: {
                id: { in: emailIds.map((id) => parseInt(id)) },
            },
            include: {
                account: {
                    select: { ownerId: true },
                },
            },
        });
        const userEmails = emails.filter((e) => e.account.ownerId === user.id);
        if (userEmails.length !== emails.length) {
            return res.status(403).json({ error: "Some emails are not authorized" });
        }
        const emailIdsToUpdate = userEmails.map((e) => e.id);
        let updateData = {};
        switch (operation) {
            case "mark-read":
                updateData = { isRead: true };
                break;
            case "mark-unread":
                updateData = { isRead: false };
                break;
            case "star":
                updateData = { isStarred: true };
                break;
            case "unstar":
                updateData = { isStarred: false };
                break;
            case "archive":
                updateData = { isArchived: true };
                break;
            case "unarchive":
                updateData = { isArchived: false };
                break;
            case "spam":
                updateData = { isSpam: true };
                break;
            case "not-spam":
                updateData = { isSpam: false };
                break;
            case "important":
                updateData = { isImportant: true };
                break;
            case "not-important":
                updateData = { isImportant: false };
                break;
            case "delete":
                updateData = { isDeleted: true };
                break;
            case "restore":
                updateData = { isDeleted: false };
                break;
            default:
                return res.status(400).json({ error: "Invalid operation" });
        }
        await prisma_1.default.email.updateMany({
            where: { id: { in: emailIdsToUpdate } },
            data: updateData,
        });
        res.json({ success: true, count: emailIdsToUpdate.length });
    }
    catch (err) {
        console.error("Bulk operation error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
