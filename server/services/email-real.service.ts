/**
 * Servicio de correo real usando SMTP
 * 
 * Para usar este servicio, configura las variables de entorno:
 * - EMAIL_SMTP_HOST (ej: smtp.gmail.com)
 * - EMAIL_SMTP_PORT (ej: 587)
 * - EMAIL_SMTP_USER (ej: tu-email@gmail.com)
 * - EMAIL_SMTP_PASSWORD (ej: tu-app-password)
 * - EMAIL_FROM_NAME (ej: "Xstar Mail")
 * 
 * Para Gmail:
 * 1. Activa verificación en 2 pasos
 * 2. Genera una "Contraseña de aplicación" en: https://myaccount.google.com/apppasswords
 * 3. Usa esa contraseña en EMAIL_SMTP_PASSWORD
 */

import nodemailer from "nodemailer";

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailRealService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Inicializa el transporter SMTP
   */
  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.EMAIL_SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.EMAIL_SMTP_PORT || "587");
    const user = process.env.EMAIL_SMTP_USER;
    const password = process.env.EMAIL_SMTP_PASSWORD;

    if (!user || !password) {
      throw new Error(
        "EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD deben estar configurados en .env"
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para 465, false para otros puertos
      auth: {
        user,
        pass: password,
      },
      // Para Gmail, puede ser necesario
      tls: {
        rejectUnauthorized: false,
      },
    });

    return this.transporter;
  }

  /**
   * Verifica la conexión SMTP
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("Error verificando conexión SMTP:", error);
      return false;
    }
  }

  /**
   * Envía un correo electrónico
   */
  static async sendEmail(options: EmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Verificar si está configurado
      if (!process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASSWORD) {
        console.warn(
          "⚠️ SMTP no configurado. El correo no se enviará realmente."
        );
        console.warn(
          "💡 Para configurar email gratis, consulta: EMAIL_SETUP_GUIDE.md"
        );
        console.warn(
          "💡 Opciones gratuitas: Gmail (500/día), SendGrid (100/día), Mailgun (5,000/mes)"
        );
        return {
          success: false,
          error: "SMTP no configurado. Configura EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD en .env. Consulta EMAIL_SETUP_GUIDE.md para opciones gratuitas.",
        };
      }

      const transporter = this.getTransporter();
      const fromName = process.env.EMAIL_FROM_NAME || "Xstar Mail";

      const mailOptions = {
        from: `"${fromName}" <${options.from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || `<p>${options.text.replace(/\n/g, "<br>")}</p>`,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log("✅ Correo enviado:", info.messageId);
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
   * Envía un correo desde una cuenta específica
   * Nota: En producción, esto debería usar las credenciales de la cuenta específica
   */
  static async sendFromAccount(
    accountAddress: string,
    to: string,
    subject: string,
    message: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Por ahora usamos el SMTP configurado, pero el "from" será la cuenta del usuario
    // En producción, necesitarías credenciales específicas por cuenta
    return this.sendEmail({
      from: accountAddress,
      to,
      subject,
      text: message,
    });
  }
}

export default EmailRealService;

