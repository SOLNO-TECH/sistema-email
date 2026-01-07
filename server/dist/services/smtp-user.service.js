"use strict";
/**
 * Servicio para gestionar usuarios SMTP automáticamente
 * Crea usuarios en el servidor SMTP cuando se crean dominios/correos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const prisma_1 = __importDefault(require("../lib/prisma"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SmtpUserService {
    /**
     * Crea un usuario SMTP en el servidor Postfix
     * Esto permite que el correo pueda enviar desde esa dirección
     */
    static async createSmtpUser(email, password, domain) {
        try {
            // Verificar si el servidor SMTP está configurado
            const smtpHost = process.env.EMAIL_SMTP_HOST;
            const smtpPort = parseInt(process.env.EMAIL_SMTP_PORT || "587");
            const smtpAdminUser = process.env.EMAIL_SMTP_ADMIN_USER;
            const smtpAdminPassword = process.env.EMAIL_SMTP_ADMIN_PASSWORD;
            if (!smtpHost || !smtpAdminUser || !smtpAdminPassword) {
                console.warn("⚠️ Servidor SMTP no configurado para creación automática de usuarios");
                return {
                    success: false,
                    error: "Servidor SMTP no configurado. Configura EMAIL_SMTP_HOST, EMAIL_SMTP_ADMIN_USER y EMAIL_SMTP_ADMIN_PASSWORD",
                };
            }
            // Si estamos en el mismo servidor (localhost), crear usuario directamente
            if (smtpHost === "localhost" || smtpHost === "127.0.0.1" || smtpHost.includes("localhost")) {
                return await this.createLocalSmtpUser(email, password, domain);
            }
            // Si es servidor remoto, usar API o SSH
            return await this.createRemoteSmtpUser(email, password, domain, smtpHost);
        }
        catch (error) {
            console.error("❌ Error creando usuario SMTP:", error);
            return {
                success: false,
                error: error.message || "Error desconocido al crear usuario SMTP",
            };
        }
    }
    /**
     * Crea usuario SMTP en servidor local (Postfix con virtual mailboxes)
     */
    static async createLocalSmtpUser(email, password, domain) {
        try {
            const virtualMailDir = process.env.VIRTUAL_MAIL_DIR || "/var/mail/virtual";
            const postfixVirtualFile = process.env.POSTFIX_VIRTUAL_FILE || "/etc/postfix/virtual";
            const postfixVirtualMailboxFile = process.env.POSTFIX_VIRTUAL_MAILBOX_FILE || "/etc/postfix/virtual_mailbox";
            // Crear directorio para el dominio si no existe
            const domainDir = `${virtualMailDir}/${domain}`;
            await execAsync(`sudo mkdir -p ${domainDir}`);
            // Crear directorio para el usuario
            const userDir = `${domainDir}/${email.split("@")[0]}`;
            await execAsync(`sudo mkdir -p ${userDir}`);
            // Agregar entrada en virtual (alias)
            await execAsync(`echo "${email} ${email}" | sudo tee -a ${postfixVirtualFile}`);
            // Agregar entrada en virtual_mailbox (ruta de almacenamiento)
            await execAsync(`echo "${email} ${domain}/${email.split("@")[0]}/" | sudo tee -a ${postfixVirtualMailboxFile}`);
            // Recompilar mapas de Postfix
            await execAsync("sudo postmap /etc/postfix/virtual");
            await execAsync("sudo postmap /etc/postfix/virtual_mailbox");
            // Reiniciar Postfix
            await execAsync("sudo systemctl reload postfix");
            // 🔐 CONFIGURAR DOVECOT PARA AUTENTICACIÓN IMAP/POP3
            try {
                const username = email.split("@")[0];
                const dovecotPasswdFile = process.env.DOVECOT_PASSWD_FILE || "/etc/dovecot/passwd";
                // Generar hash de contraseña usando doveadm
                const passwordHashResult = await execAsync(`echo "${password}" | sudo doveadm pw -s SHA512-CRYPT`);
                const passwordHash = passwordHashResult.stdout.trim().split(":")[1] || passwordHashResult.stdout.trim();
                // Crear archivo si no existe
                await execAsync(`sudo touch ${dovecotPasswdFile}`);
                // Agregar entrada en formato passwd (email:hash:uid:gid:gecos:home:shell)
                const passwdEntry = `${email}:${passwordHash}:5000:5000::/var/mail/virtual/${domain}/${username}::`;
                // Verificar si ya existe
                const checkResult = await execAsync(`sudo grep -q "^${email}:" ${dovecotPasswdFile} || echo "notfound"`);
                if (checkResult.stdout.includes("notfound")) {
                    await execAsync(`echo "${passwdEntry}" | sudo tee -a ${dovecotPasswdFile}`);
                    console.log(`✅ Usuario Dovecot agregado: ${email}`);
                }
                else {
                    // Actualizar entrada existente
                    await execAsync(`sudo sed -i "s|^${email}:.*|${passwdEntry}|" ${dovecotPasswdFile}`);
                    console.log(`✅ Usuario Dovecot actualizado: ${email}`);
                }
                // Reiniciar Dovecot
                await execAsync("sudo systemctl reload dovecot || sudo systemctl restart dovecot");
                console.log(`✅ Dovecot reiniciado`);
            }
            catch (dovecotError) {
                console.warn(`⚠️ No se pudo configurar Dovecot automáticamente: ${dovecotError.message}`);
                console.warn(`⚠️ El usuario puede enviar correos pero puede necesitar configuración manual para recibir`);
                // No fallar el proceso completo si Dovecot falla
            }
            console.log(`✅ Usuario SMTP creado: ${email}`);
            return {
                success: true,
                smtpHost: process.env.EMAIL_SMTP_HOST || "localhost",
                smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
                smtpUser: email,
            };
        }
        catch (error) {
            console.error("❌ Error creando usuario SMTP local:", error);
            return {
                success: false,
                error: error.message || "Error al crear usuario SMTP local",
            };
        }
    }
    /**
     * Crea usuario SMTP en servidor remoto (usando API o SSH)
     */
    static async createRemoteSmtpUser(email, password, domain, smtpHost) {
        try {
            // Si hay una API para crear usuarios, usarla aquí
            const smtpApiUrl = process.env.EMAIL_SMTP_API_URL;
            if (smtpApiUrl) {
                // Llamar a API para crear usuario usando http/https nativo
                const https = require("https");
                const http = require("http");
                const url = require("url");
                const apiUrl = new url.URL(`${smtpApiUrl}/users`);
                const postData = JSON.stringify({ email, password, domain });
                const options = {
                    hostname: apiUrl.hostname,
                    port: apiUrl.port || (apiUrl.protocol === "https:" ? 443 : 80),
                    path: apiUrl.pathname,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(postData),
                        "Authorization": `Bearer ${process.env.EMAIL_SMTP_API_KEY || ""}`,
                    },
                };
                return new Promise((resolve, reject) => {
                    const req = (apiUrl.protocol === "https:" ? https : http).request(options, (res) => {
                        let data = "";
                        res.on("data", (chunk) => { data += chunk; });
                        res.on("end", () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve({
                                    success: true,
                                    smtpHost,
                                    smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
                                    smtpUser: email,
                                });
                            }
                            else {
                                reject(new Error(`API error: ${res.statusCode} ${res.statusMessage}`));
                            }
                        });
                    });
                    req.on("error", reject);
                    req.write(postData);
                    req.end();
                });
            }
            // Si no hay API, usar SSH (requiere configuración SSH)
            const sshHost = process.env.EMAIL_SMTP_SSH_HOST;
            const sshUser = process.env.EMAIL_SMTP_SSH_USER;
            const sshKey = process.env.EMAIL_SMTP_SSH_KEY;
            if (sshHost && sshUser) {
                // Ejecutar script remoto vía SSH
                const sshCommand = `ssh -i ${sshKey} ${sshUser}@${sshHost} "sudo /usr/local/bin/create-smtp-user.sh ${email} ${domain}"`;
                await execAsync(sshCommand);
                return {
                    success: true,
                    smtpHost,
                    smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
                    smtpUser: email,
                };
            }
            // Si no hay forma de crear usuario remoto, retornar configuración básica
            console.warn("⚠️ No se puede crear usuario SMTP remoto automáticamente");
            console.warn("⚠️ Configura EMAIL_SMTP_API_URL o EMAIL_SMTP_SSH_HOST para creación automática");
            return {
                success: true,
                smtpHost,
                smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
                smtpUser: email,
            };
        }
        catch (error) {
            console.error("❌ Error creando usuario SMTP remoto:", error);
            return {
                success: false,
                error: error.message || "Error al crear usuario SMTP remoto",
            };
        }
    }
    /**
     * Obtiene la configuración SMTP para una cuenta de correo
     */
    static async getSmtpConfigForAccount(emailAccountId) {
        try {
            const account = await prisma_1.default.emailAccount.findUnique({
                where: { id: emailAccountId },
                include: { domain: true },
            });
            if (!account) {
                return null;
            }
            // Si la cuenta tiene configuración SMTP propia, usarla
            if (account.smtpHost && account.smtpUser && account.smtpPassword) {
                return {
                    smtpHost: account.smtpHost,
                    smtpPort: account.smtpPort || 587,
                    smtpUser: account.smtpUser,
                    smtpPassword: account.smtpPassword,
                };
            }
            // Si el dominio tiene configuración SMTP, usarla
            if (account.domain.smtpHost && account.domain.smtpUser && account.domain.smtpPassword) {
                return {
                    smtpHost: account.domain.smtpHost,
                    smtpPort: account.domain.smtpPort || 587,
                    smtpUser: account.domain.smtpUser,
                    smtpPassword: account.domain.smtpPassword,
                };
            }
            // Usar configuración global con el email de la cuenta como usuario
            const globalHost = process.env.EMAIL_SMTP_HOST;
            const globalPort = parseInt(process.env.EMAIL_SMTP_PORT || "587");
            const globalUser = account.address; // Usar el email de la cuenta como usuario
            const globalPassword = process.env.EMAIL_SMTP_PASSWORD; // Contraseña global o específica
            if (!globalHost || !globalPassword) {
                return null;
            }
            return {
                smtpHost: globalHost,
                smtpPort: globalPort,
                smtpUser: globalUser,
                smtpPassword: globalPassword,
            };
        }
        catch (error) {
            console.error("❌ Error obteniendo configuración SMTP:", error);
            return null;
        }
    }
    /**
     * Elimina un usuario SMTP del servidor
     */
    static async deleteSmtpUser(email, domain) {
        try {
            const smtpHost = process.env.EMAIL_SMTP_HOST;
            if (!smtpHost || smtpHost === "localhost" || smtpHost.includes("localhost")) {
                return await this.deleteLocalSmtpUser(email, domain);
            }
            return await this.deleteRemoteSmtpUser(email, domain, smtpHost);
        }
        catch (error) {
            console.error("❌ Error eliminando usuario SMTP:", error);
            return false;
        }
    }
    static async deleteLocalSmtpUser(email, domain) {
        try {
            const postfixVirtualFile = process.env.POSTFIX_VIRTUAL_FILE || "/etc/postfix/virtual";
            const postfixVirtualMailboxFile = process.env.POSTFIX_VIRTUAL_MAILBOX_FILE || "/etc/postfix/virtual_mailbox";
            // Eliminar de virtual
            await execAsync(`sudo sed -i '/^${email}/d' ${postfixVirtualFile}`);
            // Eliminar de virtual_mailbox
            await execAsync(`sudo sed -i '/^${email}/d' ${postfixVirtualMailboxFile}`);
            // Recompilar mapas
            await execAsync("sudo postmap /etc/postfix/virtual");
            await execAsync("sudo postmap /etc/postfix/virtual_mailbox");
            // Reiniciar Postfix
            await execAsync("sudo systemctl reload postfix");
            console.log(`✅ Usuario SMTP eliminado: ${email}`);
            return true;
        }
        catch (error) {
            console.error("❌ Error eliminando usuario SMTP local:", error);
            return false;
        }
    }
    static async deleteRemoteSmtpUser(email, domain, smtpHost) {
        try {
            const smtpApiUrl = process.env.EMAIL_SMTP_API_URL;
            if (smtpApiUrl) {
                const https = require("https");
                const http = require("http");
                const url = require("url");
                const apiUrl = new url.URL(`${smtpApiUrl}/users/${encodeURIComponent(email)}`);
                const options = {
                    hostname: apiUrl.hostname,
                    port: apiUrl.port || (apiUrl.protocol === "https:" ? 443 : 80),
                    path: apiUrl.pathname,
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${process.env.EMAIL_SMTP_API_KEY || ""}`,
                    },
                };
                return new Promise((resolve) => {
                    const req = (apiUrl.protocol === "https:" ? https : http).request(options, (res) => {
                        res.on("data", () => { });
                        res.on("end", () => {
                            resolve(res.statusCode >= 200 && res.statusCode < 300);
                        });
                    });
                    req.on("error", () => resolve(false));
                    req.end();
                });
            }
            return false;
        }
        catch (error) {
            console.error("❌ Error eliminando usuario SMTP remoto:", error);
            return false;
        }
    }
}
exports.default = SmtpUserService;
