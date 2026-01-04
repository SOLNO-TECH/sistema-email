/**
 * Servicio para enviar correos desde cuentas específicas
 * Soporta múltiples proveedores: SendGrid, Mailgun, SMTP personalizado
 */

import nodemailer from "nodemailer";
import prisma from "../lib/prisma";

interface SendEmailOptions {
  from: string; // Dirección de correo del remitente (ej: admin@midominio.com)
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SmtpConfig {
  provider: "sendgrid" | "mailgun" | "smtp" | "gmail" | "default";
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  apiKey?: string;
}

class EmailSenderService {
  /**
   * Obtiene la configuración SMTP para una cuenta de correo
   */
  private static async getSmtpConfig(emailAccountId: number): Promise<SmtpConfig> {
    const account = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: {
        domain: true,
      },
    });

    if (!account) {
      throw new Error("Cuenta de correo no encontrada");
    }

    // Prioridad: 1. Configuración de la cuenta (usuario SMTP propio), 2. Configuración del dominio, 3. Configuración global

    // Si la cuenta tiene configuración SMTP propia (usuario SMTP creado automáticamente)
    if (account.smtpHost && account.smtpUser && account.smtpPassword) {
      console.log(`📧 Usando configuración SMTP propia de la cuenta: ${account.address}`);
      return {
        provider: "smtp",
        host: account.smtpHost,
        port: account.smtpPort || 587,
        user: account.smtpUser, // Email de la cuenta como usuario SMTP
        password: account.smtpPassword, // Contraseña de la cuenta
      };
    }

    // Si el dominio tiene configuración SMTP
    if (account.domain.smtpProvider) {
      if (account.domain.smtpProvider === "sendgrid" && account.domain.smtpApiKey) {
        return {
          provider: "sendgrid",
          apiKey: account.domain.smtpApiKey,
        };
      }

      if (account.domain.smtpProvider === "mailgun" && account.domain.smtpApiKey) {
        return {
          provider: "mailgun",
          apiKey: account.domain.smtpApiKey,
        };
      }

      if (account.domain.smtpHost && account.domain.smtpUser && account.domain.smtpPassword) {
        return {
          provider: "smtp",
          host: account.domain.smtpHost,
          port: account.domain.smtpPort || 587,
          user: account.domain.smtpUser,
          password: account.domain.smtpPassword,
        };
      }
    }

    // Configuración global (fallback) - PRIORIDAD: SMTP propio sobre SendGrid
    // El SMTP propio permite enviar desde cualquier dirección sin verificación
    if (process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASSWORD) {
      console.log(`📧 Usando SMTP propio global para cuenta ${account.address} (permite cualquier email)`);
      return {
        provider: "smtp",
        host: process.env.EMAIL_SMTP_HOST,
        port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
        user: process.env.EMAIL_SMTP_USER,
        password: process.env.EMAIL_SMTP_PASSWORD,
      };
    }
    
    // Fallback a SendGrid solo si no hay SMTP propio configurado
    if (process.env.SENDGRID_API_KEY) {
      console.log(`⚠️ Usando SendGrid global para cuenta ${account.address} (requiere verificación)`);
      return {
        provider: "sendgrid",
        apiKey: process.env.SENDGRID_API_KEY,
      };
    }
    
    // Si no hay nada configurado, lanzar error
    throw new Error(
      "SMTP no configurado. Configura EMAIL_SMTP_HOST, EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD en .env para envío automático desde cualquier email."
    );
  }

  /**
   * Crea un transporter según el proveedor
   */
  private static createTransporter(config: SmtpConfig): nodemailer.Transporter {
    switch (config.provider) {
      case "sendgrid":
        // SendGrid usa SMTP con API key como password
        return nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: config.apiKey,
          },
          // Permitir enviar desde cualquier dirección si el dominio está verificado en SendGrid
          tls: {
            rejectUnauthorized: false,
          },
        });

      case "mailgun":
        // Mailgun también usa SMTP
        const mailgunDomain = config.user || process.env.MAILGUN_DOMAIN || "mg.midominio.com";
        return nodemailer.createTransport({
          host: "smtp.mailgun.org",
          port: 587,
          secure: false,
          auth: {
            user: `postmaster@${mailgunDomain}`,
            pass: config.apiKey,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

      case "smtp":
        return nodemailer.createTransport({
          host: config.host!,
          port: config.port || 587,
          secure: config.port === 465,
          auth: {
            user: config.user!,
            pass: config.password!,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

      case "gmail":
        return nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: config.user,
            pass: config.password,
          },
        });

      case "default":
      default:
        // Usar configuración global
        if (!config.user || !config.password) {
          throw new Error(
            "SMTP no configurado. Configura EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD en .env o configura SMTP para el dominio/cuenta"
          );
        }

        return nodemailer.createTransport({
          host: config.host || "smtp.gmail.com",
          port: config.port || 587,
          secure: config.port === 465,
          auth: {
            user: config.user,
            pass: config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
    }
  }

  /**
   * Envía un correo desde una cuenta específica
   */
  static async sendFromAccount(
    emailAccountId: number,
    to: string,
    subject: string,
    message: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const account = await prisma.emailAccount.findUnique({
        where: { id: emailAccountId },
      });

      if (!account) {
        return {
          success: false,
          error: "Cuenta de correo no encontrada",
        };
      }

      // Obtener configuración SMTP
      const smtpConfig = await this.getSmtpConfig(emailAccountId);

      // Crear transporter
      const transporter = this.createTransporter(smtpConfig);

      // Enviar correo desde la dirección de la cuenta
      // Si usas SMTP propio, puedes enviar desde cualquier dirección sin verificación
      // Si usas SendGrid/Mailgun, el dominio/email debe estar verificado
      
      // Detectar si el mensaje es HTML o texto plano
      const isHTML = message.includes("<") && (message.includes("<p>") || message.includes("<div>") || message.includes("<br>"));
      const htmlContent = isHTML ? message : `<p>${message.replace(/\n/g, "<br>")}</p>`;
      const textContent = isHTML ? message.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n") : message;
      
      const info = await transporter.sendMail({
        from: account.address, // Envía desde la dirección de la cuenta creada
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ Correo enviado desde ${account.address} a ${to}:`, info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error("❌ Error enviando correo:", error);
      return {
        success: false,
        error: error.message || "Error desconocido al enviar correo",
      };
    }
  }

  /**
   * Verifica la configuración SMTP de una cuenta
   */
  static async verifyAccountSmtp(emailAccountId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const smtpConfig = await this.getSmtpConfig(emailAccountId);
      const transporter = this.createTransporter(smtpConfig);
      await transporter.verify();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default EmailSenderService;

