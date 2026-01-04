/**
 * Script para probar el envío de correos
 * Uso: node scripts/test-email-send.js
 */

require("dotenv").config();
const nodemailer = require("nodemailer");

async function testSendGrid() {
  console.log("🧪 Probando envío de correo con SendGrid...\n");

  // Verificar que SendGrid está configurado
  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ Error: SENDGRID_API_KEY no está configurado en .env");
    console.error("Agrega: SENDGRID_API_KEY=SG.xxxxx");
    process.exit(1);
  }

  console.log("✅ SendGrid API Key encontrada");
  console.log(`   Key: ${process.env.SENDGRID_API_KEY.substring(0, 10)}...\n`);

  try {
    // Crear transporter de SendGrid
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log("🔍 Verificando conexión con SendGrid...");

    // Verificar conexión
    await transporter.verify();
    console.log("✅ Conexión con SendGrid exitosa!\n");

    // Obtener email de prueba
    const testEmail = process.env.TEST_EMAIL_TO || "tu-email@gmail.com";
    const fromEmail = process.env.TEST_EMAIL_FROM || "test@test.com";

    console.log("📧 Enviando correo de prueba...");
    console.log(`   Desde: ${fromEmail}`);
    console.log(`   Para: ${testEmail}\n`);

    // Enviar correo
    const info = await transporter.sendMail({
      from: fromEmail,
      to: testEmail,
      subject: "Prueba de Envío - Xstar Mail",
      text: `
Hola,

Este es un correo de prueba desde Xstar Mail usando SendGrid.

Si recibes este correo, significa que SendGrid está funcionando correctamente.

Fecha: ${new Date().toLocaleString()}
      `,
      html: `
<h2>Prueba de Envío - Xstar Mail</h2>
<p>Hola,</p>
<p>Este es un correo de prueba desde Xstar Mail usando SendGrid.</p>
<p>Si recibes este correo, significa que SendGrid está funcionando correctamente.</p>
<p><em>Fecha: ${new Date().toLocaleString()}</em></p>
      `,
    });

    console.log("✅ Correo enviado exitosamente!");
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📬 Respuesta: ${info.response}\n`);
    console.log(`📬 Revisa el correo en: ${testEmail}`);
    console.log("\n💡 Si no recibes el correo:");
    console.log("   - Revisa la carpeta de spam");
    console.log("   - Verifica que el email de destino es correcto");
    console.log("   - Espera unos minutos (puede tardar)");

  } catch (error) {
    console.error("\n❌ Error al enviar correo:");
    console.error(error.message);
    
    if (error.code === "EAUTH") {
      console.error("\n💡 Posibles causas:");
      console.error("  - API Key de SendGrid incorrecta");
      console.error("  - API Key no tiene permisos de 'Mail Send'");
      console.error("  - Verifica la API Key en SendGrid");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Posibles causas:");
      console.error("  - Problemas de conexión a internet");
      console.error("  - Firewall bloqueando conexión");
    } else if (error.responseCode === 403) {
      console.error("\n💡 Error 403 - Posibles causas:");
      console.error("  - API Key no tiene permisos");
      console.error("  - Dominio no verificado en SendGrid");
      console.error("  - Límite de correos alcanzado");
    }

    process.exit(1);
  }
}

testSendGrid();

