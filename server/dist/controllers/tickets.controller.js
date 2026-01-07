"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.getUserTickets = getUserTickets;
exports.getAllTickets = getAllTickets;
exports.updateTicketStatus = updateTicketStatus;
exports.getTicketMessages = getTicketMessages;
exports.sendTicketMessage = sendTicketMessage;
const prisma_1 = __importDefault(require("../lib/prisma"));
const path_1 = __importDefault(require("path"));
async function createTicket(req, res) {
    try {
        const { subject, description, priority } = req.body;
        const userId = req.user.id;
        const files = req.files;
        if (!subject || !description) {
            return res.status(400).json({ error: "Subject and description are required" });
        }
        // Crear el ticket
        const ticket = await prisma_1.default.ticket.create({
            data: {
                userId,
                subject,
                description,
                priority: priority || "medium",
                status: "open",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        // Si hay archivos, crear los registros de attachments
        let attachments = [];
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        if (files && files.length > 0) {
            attachments = await Promise.all(files.map((file) => {
                // Guardar la ruta relativa para acceso público
                // file.path es la ruta completa del archivo guardado
                // Necesitamos la ruta relativa desde la raíz del proyecto
                const relativePath = path_1.default.relative(process.cwd(), file.path).replace(/\\/g, "/");
                return prisma_1.default.ticketAttachment.create({
                    data: {
                        ticketId: ticket.id,
                        fileName: file.originalname,
                        filePath: relativePath,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                    },
                });
            }));
        }
        // Agregar URLs completas a los attachments
        const ticketWithAttachments = {
            ...ticket,
            attachments: attachments.map((att) => ({
                ...att,
                url: `${baseUrl}/${att.filePath}`,
            })),
        };
        res.status(201).json(ticketWithAttachments);
    }
    catch (error) {
        console.error("Error creating ticket:", error);
        // Enviar mensaje de error más descriptivo
        if (error.code === "P2002") {
            return res.status(409).json({ error: "Ticket already exists" });
        }
        if (error.message) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: "Server error" });
    }
}
async function getUserTickets(req, res) {
    try {
        const userId = req.user.id;
        const tickets = await prisma_1.default.ticket.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                attachments: true,
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const ticketsWithUrls = tickets.map((ticket) => ({
            ...ticket,
            attachments: ticket.attachments.map((att) => ({
                ...att,
                url: `${baseUrl}/${att.filePath}`,
            })),
        }));
        res.json(ticketsWithUrls);
    }
    catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ error: "Server error" });
    }
}
async function getAllTickets(req, res) {
    try {
        // Solo admins pueden ver todos los tickets
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const tickets = await prisma_1.default.ticket.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                attachments: true,
            },
        });
        // Agregar URLs completas a los attachments
        const ticketsWithUrls = tickets.map((ticket) => ({
            ...ticket,
            attachments: ticket.attachments.map((att) => ({
                ...att,
                url: `${baseUrl}/${att.filePath}`,
            })),
        }));
        res.json(ticketsWithUrls);
    }
    catch (error) {
        console.error("Error fetching all tickets:", error);
        res.status(500).json({ error: "Server error" });
    }
}
async function updateTicketStatus(req, res) {
    try {
        // Solo admins pueden actualizar tickets
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["open", "in_progress", "resolved", "closed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        const ticket = await prisma_1.default.ticket.update({
            where: { id: parseInt(id) },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.json(ticket);
    }
    catch (error) {
        console.error("Error updating ticket:", error);
        res.status(500).json({ error: "Server error" });
    }
}
async function getTicketMessages(req, res) {
    try {
        console.log("🔍 getTicketMessages called with ticketId:", req.params.ticketId);
        const { ticketId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        // Verificar que el usuario tiene acceso al ticket
        const ticket = await prisma_1.default.ticket.findUnique({
            where: { id: parseInt(ticketId) },
        });
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        // Solo el dueño del ticket o un admin pueden ver los mensajes
        if (ticket.userId !== userId && userRole !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }
        const messages = await prisma_1.default.ticketMessage.findMany({
            where: { ticketId: parseInt(ticketId) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        res.json(messages);
    }
    catch (error) {
        console.error("Error fetching ticket messages:", error);
        res.status(500).json({ error: "Server error" });
    }
}
async function sendTicketMessage(req, res) {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }
        // Verificar que el usuario tiene acceso al ticket
        const ticket = await prisma_1.default.ticket.findUnique({
            where: { id: parseInt(ticketId) },
        });
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        // Solo el dueño del ticket o un admin pueden enviar mensajes
        if (ticket.userId !== userId && userRole !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }
        // Crear el mensaje
        const ticketMessage = await prisma_1.default.ticketMessage.create({
            data: {
                ticketId: parseInt(ticketId),
                userId,
                message: message.trim(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        // Actualizar el timestamp del ticket
        await prisma_1.default.ticket.update({
            where: { id: parseInt(ticketId) },
            data: { updatedAt: new Date() },
        });
        res.status(201).json(ticketMessage);
    }
    catch (error) {
        console.error("Error sending ticket message:", error);
        res.status(500).json({ error: "Server error" });
    }
}
