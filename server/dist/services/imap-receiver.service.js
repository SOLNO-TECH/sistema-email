"use strict";
/**
 * Servicio para recibir correos usando IMAP
 *
 * Configuración requerida en .env:
 * - IMAP_HOST (ej: imap.gmail.com)
 * - IMAP_PORT (ej: 993)
 * - IMAP_SECURE (true/false)
 *
 * Para cada cuenta, se usa:
 * - address: dirección de correo
 * - password: contraseña de la cuenta
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const imap_simple_1 = __importDefault(require("imap-simple"));
const mailparser_1 = require("mailparser");
const prisma_1 = __importDefault(require("../lib/prisma"));
class ImapReceiverService {
    /**
     * Obtiene configuración IMAP para una cuenta
     */
    static getImapConfig(emailAddress, password, customHost) {
        return {
            imap: {
                user: emailAddress,
                password: password,
                host: customHost || this.defaultConfig.host,
                port: this.defaultConfig.port,
                tls: this.defaultConfig.secure,
                tlsOptions: this.defaultConfig.tlsOptions,
            },
        };
    }
    /**
     * Recibe correos de una cuenta y los guarda en la BD
     */
    static async fetchAndStoreEmails(emailAccountId, emailAddress, password, customHost) {
        try {
            const config = this.getImapConfig(emailAddress, password, customHost);
            // Log de debug (sin mostrar contraseña completa)
            const passwordPreview = password ? `${password.substring(0, 2)}***` : "no password";
            console.log(`🔐 Conectando IMAP: ${emailAddress}@${config.imap.host}:${config.imap.port} (pass: ${passwordPreview})`);
            const connection = await imap_simple_1.default.connect(config);
            // Abrir buzón INBOX
            await connection.openBox("INBOX");
            // Buscar correos no leídos (o todos los recientes)
            const searchCriteria = ["UNSEEN"]; // Correos no leídos
            // search devuelve UIDs (números)
            const uids = await connection.search(searchCriteria, {});
            if (!uids || uids.length === 0) {
                await connection.end();
                return { success: true, count: 0 };
            }
            // Fetch para obtener los mensajes completos
            const fetchOptions = {
                bodies: "",
                struct: true,
            };
            const messages = await connection.fetch(uids, fetchOptions);
            let storedCount = 0;
            // Procesar cada mensaje
            for (const message of messages) {
                try {
                    const all = imap_simple_1.default.getParts(message.attributes.struct);
                    const part = all.find((part) => {
                        return part.which === "TEXT" || part.which === "";
                    });
                    if (!part)
                        continue;
                    const partData = await connection.getPartData(message, part);
                    const parsed = await (0, mailparser_1.simpleParser)(partData);
                    // Verificar si el correo ya existe (por Message-ID)
                    const existingEmail = parsed.messageId
                        ? await prisma_1.default.email.findUnique({
                            where: { messageId: parsed.messageId },
                        })
                        : null;
                    if (existingEmail) {
                        console.log(`Correo ya existe: ${parsed.messageId}`);
                        continue;
                    }
                    // Guardar en BD
                    // Verificar si el correo es realmente recibido (no enviado por nosotros)
                    const isReceived = !parsed.from?.value?.[0]?.address?.toLowerCase().includes(emailAddress.toLowerCase());
                    await prisma_1.default.email.create({
                        data: {
                            emailAccountId,
                            from: parsed.from?.text || parsed.from?.value[0]?.address || "unknown",
                            to: parsed.to?.text || parsed.to?.value[0]?.address || emailAddress,
                            subject: parsed.subject || "(Sin asunto)",
                            body: parsed.text || parsed.html?.replace(/<[^>]*>/g, "") || "",
                            htmlBody: parsed.html || null,
                            isRead: false,
                            isSent: !isReceived, // false si es recibido, true si es enviado por nosotros
                            messageId: parsed.messageId || null,
                            inReplyTo: parsed.inReplyTo || null,
                            references: Array.isArray(parsed.references) ? parsed.references.join(" ") : (parsed.references || null),
                            priority: parsed.priority || "normal",
                            receivedAt: parsed.date || new Date(),
                            sentAt: !isReceived ? (parsed.date || new Date()) : null, // Si es enviado, usar fecha como sentAt
                        },
                    });
                    storedCount++;
                    // Marcar como leído en el servidor IMAP (opcional)
                    // await connection.addFlags(message.attributes.uid, '\\Seen');
                }
                catch (error) {
                    console.error(`Error procesando mensaje:`, error);
                    continue;
                }
            }
            await connection.end();
            return { success: true, count: storedCount };
        }
        catch (error) {
            // En desarrollo local, no mostrar errores si no hay servidor de correo
            const isDevelopment = process.env.NODE_ENV !== "production";
            const isLocalhost = customHost === "localhost" || customHost === "127.0.0.1" || !customHost;
            if (isDevelopment && isLocalhost && (error.message?.includes("ECONNREFUSED") || error.message?.includes("connect"))) {
                // En desarrollo local sin servidor de correo, solo log silencioso
                console.log(`ℹ️  Sincronización IMAP omitida (desarrollo local sin servidor de correo): ${emailAddress}`);
                return { success: true, count: 0, error: "Development mode - no mail server" };
            }
            console.error("❌ Error recibiendo correos:", error.message);
            // Mensajes de error más descriptivos
            let errorMessage = error.message || "Error desconocido";
            if (error.textCode === "AUTHENTICATIONFAILED" || error.message?.includes("Invalid credentials")) {
                errorMessage = "Credenciales inválidas. Verifica que la contraseña SMTP sea correcta y que el usuario exista en Dovecot.";
                console.error("   💡 Solución:");
                console.error("      - Verifica que la contraseña en smtpPassword sea la correcta");
                console.error("      - Verifica que el usuario exista en Dovecot");
                console.error("      - Configura EMAIL_SYNC_PASSWORD en .env");
                console.error("      - Ejecuta: sudo doveadm auth test " + emailAddress);
            }
            else if (error.message?.includes("ECONNREFUSED") || error.message?.includes("connect")) {
                errorMessage = "No se puede conectar al servidor IMAP. Verifica que Dovecot esté corriendo.";
                console.error("   💡 Solución:");
                console.error("      - Verifica que Dovecot esté corriendo: sudo systemctl status dovecot");
                console.error("      - Verifica que el puerto 993 esté abierto");
                console.error("      - Verifica IMAP_HOST en .env (actual: " + (customHost || this.defaultConfig.host) + ")");
            }
            return {
                success: false,
                count: 0,
                error: errorMessage,
            };
        }
    }
    /**
     * Obtiene correos de una cuenta (sin guardar, solo lectura)
     */
    static async fetchEmails(emailAddress, password, customHost, limit = 50) {
        try {
            const config = this.getImapConfig(emailAddress, password, customHost);
            const connection = await imap_simple_1.default.connect(config);
            await connection.openBox("INBOX");
            // Buscar correos recientes
            const searchCriteria = ["ALL"];
            // search devuelve UIDs (números)
            const uids = await connection.search(searchCriteria, {});
            // Limitar cantidad de UIDs
            const limitedUids = uids.slice(0, limit);
            // Fetch para obtener los mensajes completos
            const fetchOptions = {
                bodies: "",
                struct: true,
            };
            const messages = await connection.fetch(limitedUids, fetchOptions);
            const emails = [];
            for (const message of messages) {
                try {
                    const all = imap_simple_1.default.getParts(message.attributes.struct);
                    const part = all.find((part) => {
                        return part.which === "TEXT" || part.which === "";
                    });
                    if (!part)
                        continue;
                    const partData = await connection.getPartData(message, part);
                    const parsed = await (0, mailparser_1.simpleParser)(partData);
                    emails.push({
                        id: message.attributes.uid,
                        from: parsed.from?.text || parsed.from?.value[0]?.address,
                        to: parsed.to?.text || parsed.to?.value[0]?.address,
                        subject: parsed.subject || "(Sin asunto)",
                        body: parsed.text || "",
                        html: parsed.html || null,
                        date: parsed.date || new Date(),
                        messageId: parsed.messageId,
                    });
                }
                catch (error) {
                    console.error("Error parseando mensaje:", error);
                    continue;
                }
            }
            await connection.end();
            return emails;
        }
        catch (error) {
            console.error("Error obteniendo correos:", error);
            throw error;
        }
    }
}
ImapReceiverService.defaultConfig = {
    host: process.env.IMAP_HOST || "localhost",
    port: parseInt(process.env.IMAP_PORT || "993"),
    secure: process.env.IMAP_SECURE !== "false", // true por defecto, excepto si se especifica false
    tlsOptions: {
        rejectUnauthorized: false,
    },
};
exports.default = ImapReceiverService;
