"use strict";
/**
 * Servicio para sincronizar correos automáticamente
 * Se ejecuta periódicamente para recibir nuevos correos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
const imap_receiver_service_1 = __importDefault(require("./imap-receiver.service"));
class EmailSyncService {
    /**
     * Inicia la sincronización automática
     * @param intervalMinutes Intervalo en minutos (default: 5)
     */
    static start(intervalMinutes = 5) {
        if (this.syncInterval) {
            console.log("⚠️ Sincronización ya está corriendo");
            return;
        }
        console.log(`🔄 Iniciando sincronización automática cada ${intervalMinutes} minutos`);
        // Sincronizar inmediatamente
        this.syncAllAccounts();
        // Luego cada X minutos
        this.syncInterval = setInterval(() => {
            this.syncAllAccounts();
        }, intervalMinutes * 60 * 1000);
    }
    /**
     * Detiene la sincronización automática
     */
    static stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log("⏹️ Sincronización automática detenida");
        }
    }
    /**
     * Sincroniza todas las cuentas de correo
     */
    static async syncAllAccounts() {
        if (this.isRunning) {
            console.log("⏳ Sincronización ya en progreso, saltando...");
            return;
        }
        this.isRunning = true;
        console.log("📧 Iniciando sincronización de todas las cuentas...");
        try {
            const accounts = await prisma_1.default.emailAccount.findMany({
                include: {
                    domain: true,
                },
            });
            let totalSynced = 0;
            for (const account of accounts) {
                try {
                    // Prioridad: 1. Contraseña SMTP de la cuenta, 2. Contraseña SMTP del dominio, 3. Contraseña global
                    let syncPassword = account.smtpPassword ||
                        account.domain?.smtpPassword ||
                        process.env.EMAIL_SYNC_PASSWORD;
                    // Si no hay contraseña disponible, saltar esta cuenta
                    if (!syncPassword) {
                        console.log(`⚠️ Saltando ${account.address}: No hay contraseña SMTP configurada`);
                        continue;
                    }
                    // Obtener host IMAP (usar el mismo servidor SMTP pero con imap)
                    const imapHost = process.env.IMAP_HOST ||
                        account.smtpHost?.replace("smtp", "imap")?.replace("mail", "imap") ||
                        account.domain?.smtpHost?.replace("smtp", "imap")?.replace("mail", "imap") ||
                        process.env.EMAIL_SMTP_HOST?.replace("smtp", "imap")?.replace("mail", "imap") ||
                        "localhost";
                    const result = await imap_receiver_service_1.default.fetchAndStoreEmails(account.id, account.address, syncPassword, imapHost);
                    if (result.success && result.count > 0) {
                        totalSynced += result.count;
                        console.log(`✅ ${account.address}: ${result.count} correos sincronizados`);
                    }
                }
                catch (error) {
                    // En desarrollo local, no mostrar errores si no hay servidor de correo
                    const isDevelopment = process.env.NODE_ENV !== "production";
                    const imapHost = process.env.IMAP_HOST || "localhost";
                    const isLocalhost = imapHost === "localhost" || imapHost === "127.0.0.1";
                    if (isDevelopment && isLocalhost && error.message?.includes("ECONNREFUSED")) {
                        // Silenciar errores de conexión en desarrollo local
                        continue;
                    }
                    console.error(`❌ Error sincronizando ${account.address}:`, error.message);
                }
            }
            console.log(`✅ Sincronización completada: ${totalSynced} correos nuevos`);
        }
        catch (error) {
            console.error("❌ Error en sincronización:", error);
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Sincroniza una cuenta específica
     */
    static async syncAccount(accountId, password) {
        try {
            const account = await prisma_1.default.emailAccount.findUnique({
                where: { id: accountId },
                include: {
                    domain: true,
                },
            });
            if (!account) {
                throw new Error("Cuenta no encontrada");
            }
            // Prioridad: contraseña proporcionada, SMTP de cuenta, SMTP de dominio, global
            const syncPassword = password ||
                account.smtpPassword ||
                (account.domain?.smtpPassword) ||
                process.env.EMAIL_SYNC_PASSWORD;
            if (!syncPassword) {
                throw new Error("Contraseña de sincronización requerida");
            }
            // Obtener host IMAP
            const imapHost = process.env.IMAP_HOST ||
                account.smtpHost?.replace("smtp", "imap")?.replace("mail", "imap") ||
                account.domain?.smtpHost?.replace("smtp", "imap")?.replace("mail", "imap") ||
                process.env.EMAIL_SMTP_HOST?.replace("smtp", "imap")?.replace("mail", "imap") ||
                "localhost";
            const result = await imap_receiver_service_1.default.fetchAndStoreEmails(account.id, account.address, syncPassword, imapHost);
            return result;
        }
        catch (error) {
            console.error(`Error sincronizando cuenta ${accountId}:`, error);
            throw error;
        }
    }
}
EmailSyncService.syncInterval = null;
EmailSyncService.isRunning = false;
exports.default = EmailSyncService;
