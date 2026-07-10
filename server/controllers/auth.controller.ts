import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../src/utils/hash";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "dev_secret") {
  console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurado o usa el valor por defecto inseguro.");
  console.error("   Por favor, configura JWT_SECRET en tu archivo .env con un valor seguro y aleatorio.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }
}
const JWT_EXPIRES = "7d";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    
    // Agregar automáticamente @xstarmail.es si el email no tiene dominio
    let finalEmail = email.trim().toLowerCase();
    if (!finalEmail.includes("@")) {
      finalEmail = `${finalEmail}@xstarmail.es`;
    } else if (!finalEmail.endsWith("@xstarmail.es")) {
      // Si tiene otro dominio, también agregar @xstarmail.es
      const username = finalEmail.split("@")[0];
      finalEmail = `${username}@xstarmail.es`;
    }
    
    // Solo verificar si existe el email, sin obtener todos los campos
    const exists = await prisma.user.findUnique({ 
      where: { email: finalEmail },
      select: { id: true }
    });
    
    if (exists) return res.status(409).json({ error: "Email taken" });
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name: name || finalEmail.split("@")[0], email: finalEmail, password: hashed },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    // Asignar automáticamente el plan gratuito al usuario
    try {
      let freePlan = await prisma.plan.findFirst({
        where: { 
          priceMonthly: 0,
          isActive: true 
        },
        orderBy: { createdAt: "asc" }, // Tomar el primer plan gratuito
      });

      // Si no existe un plan gratuito, crearlo automáticamente
      if (!freePlan) {
        console.log(`📦 [REGISTRO] No se encontró plan gratuito. Creando uno automáticamente...`);
        freePlan = await prisma.plan.create({
          data: {
            name: "Gratis",
            description: "Plan básico gratuito",
            priceMonthly: 0,
            priceYearly: 0,
            maxEmails: 1,
            maxStorageGB: 1,
            maxDomains: 1,
            category: "personas",
            isActive: true,
          },
        });
        console.log(`✅ [REGISTRO] Plan gratuito creado automáticamente (ID: ${freePlan.id})`);
      }

      if (freePlan) {
        // Verificar si el usuario ya tiene una suscripción activa
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            OR: [
              { endDate: null }, // Suscripción permanente
              { endDate: { gte: new Date() } }, // Suscripción activa (no expirada)
            ],
          },
        });

        if (!existingSubscription) {
          console.log(`📦 [REGISTRO] Asignando plan gratuito "${freePlan.name}" (ID: ${freePlan.id}) al usuario ${user.id}`);
          await prisma.subscription.create({
            data: {
              userId: user.id,
              planId: freePlan.id,
              plan: freePlan.name,
              startDate: new Date(),
              // Sin endDate = suscripción permanente
            },
          });
          console.log(`✅ [REGISTRO] Plan gratuito asignado correctamente al usuario ${user.id}`);
        } else {
          console.log(`⚠️ [REGISTRO] Usuario ${user.id} ya tiene una suscripción activa (ID: ${existingSubscription.id}), no se creará una nueva`);
        }
      }
    } catch (planError: any) {
      console.error(`❌ [REGISTRO] Error al asignar plan gratuito:`, planError);
      // No fallar el registro si no se puede asignar el plan, pero registrar el error
    }

    // Crear automáticamente dominio y cuenta de correo para el usuario
    // ESTO ES CRÍTICO: Debe ejecutarse ANTES de retornar la respuesta
    try {
      const domainName = "fylomail.es";
      
      console.log(`🔍 [REGISTRO] Iniciando creación automática de dominio y cuenta para usuario ${user.id} (${finalEmail})`);
      
      // Buscar o crear el dominio fylomail.es (compartido para todos los usuarios)
      let domain = await prisma.domain.findFirst({
        where: { domainName },
      });

      if (!domain) {
        // Crear dominio fylomail.es (compartido)
        console.log(`📝 [REGISTRO] Creando dominio ${domainName} para usuario ${user.id}...`);
        try {
          domain = await prisma.domain.create({
            data: {
              domainName,
              userId: user.id,
              dnsVerified: true,
              smtpProvider: process.env.EMAIL_SMTP_HOST ? "smtp" : null,
              smtpHost: process.env.EMAIL_SMTP_HOST || null,
              smtpPort: process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT) : null,
              smtpUser: process.env.EMAIL_SMTP_USER || null,
              smtpPassword: process.env.EMAIL_SMTP_PASSWORD || null,
            },
          });
          console.log(`✅ [REGISTRO] Dominio ${domainName} (ID: ${domain.id}) creado para usuario ${user.id}`);
        } catch (createError: any) {
          // Si falla por duplicado, significa que se creó en otro proceso
          if (createError.code === "P2002" || createError.message?.includes("Unique constraint")) {
            console.log(`⚠️ [REGISTRO] Dominio ya existe (se creó en otro proceso). Buscándolo...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            domain = await prisma.domain.findFirst({
              where: { domainName },
            });
            if (domain) {
              console.log(`✅ [REGISTRO] Dominio encontrado: ${domainName} (ID: ${domain.id}) - pertenece al usuario ${domain.userId}`);
            }
          } else {
            throw createError;
          }
        }
      } else {
        console.log(`✅ [REGISTRO] Dominio ${domainName} (ID: ${domain.id}) ya existe - pertenece al usuario ${domain.userId}`);
        console.log(`ℹ️ [REGISTRO] Usando dominio compartido para crear cuenta del usuario ${user.id}`);
      }

      // Verificar si la cuenta de correo ya existe
      const existingAccount = await prisma.emailAccount.findUnique({
        where: { address: finalEmail },
        select: { id: true, ownerId: true },
      });

      if (existingAccount) {
        // Si existe pero no tiene ownerId o es incorrecto, actualizarlo
        if (!existingAccount.ownerId || existingAccount.ownerId !== user.id) {
          console.log(`⚠️ [REGISTRO] Cuenta ${finalEmail} existe pero sin ownerId correcto. Actualizando...`);
          await prisma.emailAccount.update({
            where: { id: existingAccount.id },
            data: { ownerId: user.id },
          });
          console.log(`✅ [REGISTRO] Cuenta ${finalEmail} (ID: ${existingAccount.id}) actualizada con ownerId: ${user.id}`);
        } else {
          console.log(`ℹ️ [REGISTRO] Cuenta ${finalEmail} (ID: ${existingAccount.id}) ya existe con ownerId correcto`);
        }
      } else {
        // Crear cuenta de correo automáticamente con el email del usuario
        console.log(`📝 [REGISTRO] Creando cuenta de correo ${finalEmail} para usuario ${user.id}...`);
        const emailAccount = await prisma.emailAccount.create({
          data: {
            address: finalEmail,
            password: hashed,
            domainId: domain.id,
            ownerId: user.id, // CRÍTICO: Asignar el ownerId
            smtpHost: domain.smtpHost || null,
            smtpPort: domain.smtpPort || null,
            smtpUser: domain.smtpUser || finalEmail,
            smtpPassword: domain.smtpPassword || null,
          },
        });
        console.log(`✅ [REGISTRO] Cuenta de correo ${finalEmail} (ID: ${emailAccount.id}) creada con ownerId: ${user.id}`);
        
        // 🚀 CREAR USUARIO SMTP REAL EN EL SERVIDOR (Postfix + Dovecot)
        console.log(`📧 [REGISTRO] Creando usuario SMTP real para: ${finalEmail}`);
        const { default: SmtpUserService } = await import("../services/smtp-user.service");
        const smtpResult = await SmtpUserService.createSmtpUser(
          finalEmail,
          password, // Contraseña sin hashear para el servidor SMTP
          domain.domainName
        );

        if (smtpResult.success) {
          // Actualizar la cuenta con la configuración SMTP
          await prisma.emailAccount.update({
            where: { id: emailAccount.id },
            data: {
              smtpHost: smtpResult.smtpHost || process.env.EMAIL_SMTP_HOST || null,
              smtpPort: smtpResult.smtpPort || parseInt(process.env.EMAIL_SMTP_PORT || "587"),
              smtpUser: smtpResult.smtpUser || finalEmail,
              smtpPassword: password, // Guardar contraseña para SMTP
            },
          });
          console.log(`✅ [REGISTRO] Usuario SMTP creado exitosamente en el servidor para: ${finalEmail}`);
        } else {
          console.warn(`⚠️ [REGISTRO] No se pudo crear usuario SMTP automáticamente: ${smtpResult.error}`);
          console.warn(`⚠️ [REGISTRO] La cuenta se creó en la BD pero puede requerir configuración SMTP manual`);
        }
        
        // Verificar inmediatamente que se creó correctamente
        const verifyAccount = await prisma.emailAccount.findUnique({
          where: { id: emailAccount.id },
          select: { id: true, address: true, ownerId: true, domainId: true },
        });
        
        if (verifyAccount && verifyAccount.ownerId === user.id) {
          console.log(`✅ [REGISTRO] Verificación exitosa: Cuenta ${verifyAccount.address} tiene ownerId ${verifyAccount.ownerId}`);
        } else {
          console.error(`❌ [REGISTRO] ERROR: Cuenta creada pero ownerId incorrecto. Esperado: ${user.id}, Obtenido: ${verifyAccount?.ownerId}`);
          // Intentar corregir
          await prisma.emailAccount.update({
            where: { id: emailAccount.id },
            data: { ownerId: user.id },
          });
          console.log(`🔧 [REGISTRO] Intento de corrección: ownerId actualizado a ${user.id}`);
        }
      }
      
      // Verificación final: buscar todas las cuentas del usuario
      const allUserAccounts = await prisma.emailAccount.findMany({
        where: { ownerId: user.id },
        select: { id: true, address: true, ownerId: true },
      });
      console.log(`📧 [REGISTRO] Verificación final: Usuario ${user.id} tiene ${allUserAccounts.length} cuenta(s):`, allUserAccounts);
      
      // Crear correo de bienvenida automáticamente
      if (allUserAccounts.length > 0) {
        const welcomeAccount = allUserAccounts[0];
        try {
          const welcomeEmail = await prisma.email.create({
            data: {
              emailAccountId: welcomeAccount.id,
              from: "noreply@fylomail.es",
              to: welcomeAccount.address,
              subject: "¡Bienvenido a Fylo Mail! 🎉",
              body: `¡Hola ${user.name || "Usuario"}!

Te damos la bienvenida a Fylo Mail, tu plataforma de correo electrónico segura y privada.

Con Fylo Mail disfrutarás de:
🔒 Encriptación avanzada para proteger tus comunicaciones
🛡️ Protección líder contra spam y rastreadores
📧 Interfaz intuitiva y moderna
⚡ Rendimiento rápido y confiable

Tu cuenta ${welcomeAccount.address} está lista para usar. Ya puedes empezar a enviar y recibir correos de forma segura.

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

¡Gracias por elegir Fylo Mail!

El equipo de Fylo Mail`,
              htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: linear-gradient(135deg, #13282b 0%, #0a1a1c 100%);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #ffffff 0%, #14b4a1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
    }
    .title {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0;
    }
    .content {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 30px;
      margin: 20px 0;
      border: 1px solid rgba(20, 180, 161, 0.2);
    }
    .greeting {
      color: #ffffff;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .features {
      color: #ffffff;
      margin: 25px 0;
    }
    .features ul {
      list-style: none;
      padding: 0;
    }
    .features li {
      padding: 10px 0;
      color: #14b4a1;
      font-size: 16px;
    }
    .features li::before {
      content: "✓ ";
      color: #14b4a1;
      font-weight: bold;
      margin-right: 10px;
    }
    .account-info {
      background: rgba(20, 180, 161, 0.1);
      border-left: 4px solid #14b4a1;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .account-info p {
      color: #ffffff;
      margin: 5px 0;
    }
    .account-address {
      color: #14b4a1;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #14b4a1 0%, #0f9d8a 100%);
      color: #ffffff;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(20, 180, 161, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Fylo Mail</div>
      <h1 class="title">¡Bienvenido! 🎉</h1>
    </div>
    
    <div class="content">
      <p class="greeting">¡Hola ${user.name || "Usuario"}!</p>
      
      <p style="color: #ffffff; margin: 20px 0;">
        Te damos la bienvenida a <strong style="color: #14b4a1;">Fylo Mail</strong>, tu plataforma de correo electrónico segura y privada.
      </p>
      
      <div class="features">
        <p style="color: #ffffff; font-weight: bold; margin-bottom: 15px;">Con Fylo Mail disfrutarás de:</p>
        <ul>
          <li>Encriptación avanzada para proteger tus comunicaciones</li>
          <li>Protección líder contra spam y rastreadores</li>
          <li>Interfaz intuitiva y moderna</li>
          <li>Rendimiento rápido y confiable</li>
        </ul>
      </div>
      
      <div class="account-info">
        <p style="margin: 0 0 10px 0;">Tu cuenta está lista para usar:</p>
        <p class="account-address">${welcomeAccount.address}</p>
      </div>
      
      <p style="color: #ffffff; margin: 20px 0;">
        Ya puedes empezar a enviar y recibir correos de forma segura. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
      </p>
      
      <div class="cta">
        <a href="#" class="button" style="color: #ffffff;">Comenzar a usar Fylo Mail</a>
      </div>
    </div>
    
    <div class="footer">
      <p>¡Gracias por elegir Fylo Mail!</p>
      <p style="margin-top: 10px;">El equipo de Fylo Mail</p>
    </div>
  </div>
</body>
</html>`,
              isRead: false,
              isSent: false,
              receivedAt: new Date(),
              priority: "high",
            }
          });
          console.log(`✅ [REGISTRO] Correo de bienvenida creado (ID: ${welcomeEmail.id}) para ${welcomeAccount.address}`);
        } catch (welcomeError: any) {
          console.error(`⚠️ [REGISTRO] Error al crear correo de bienvenida:`, welcomeError);
          // No lanzar error, solo registrar el problema
        }
      }
      
    } catch (domainError: any) {
      // ERROR: No podemos crear la cuenta durante el registro, pero no fallamos el registro
      // El frontend puede usar ensure-email-account como fallback
      console.error("❌ [REGISTRO] ERROR creando dominio/cuenta:", domainError);
      console.error("❌ [REGISTRO] Stack:", domainError.stack);
      console.error("❌ [REGISTRO] Code:", domainError.code);
      console.error("❌ [REGISTRO] Message:", domainError.message);
      // NO lanzar el error - permitir que el registro continúe
      // El frontend puede usar ensure-email-account para crear la cuenta después
      console.warn("⚠️ [REGISTRO] El registro continuará, pero la cuenta de correo deberá crearse después usando ensure-email-account");
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role || "user" }, token });
  } catch (err: any) {
    console.error("Register error:", err);
    console.error("Error details:", JSON.stringify(err, null, 2));
    
    // Mejor manejo de errores
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    if (err.code === "P1001" || err.message?.includes("Can't reach database") || err.message?.includes("connect ECONNREFUSED")) {
      return res.status(500).json({ 
        error: "Database connection error",
        message: "Please check your DATABASE_URL in .env file and ensure the database is accessible"
      });
    }
    if (err.message?.includes("Unknown database")) {
      return res.status(500).json({ 
        error: "Database not found",
        message: "Please create the database or check DATABASE_URL"
      });
    }
    res.status(500).json({ 
      error: "Server error",
      message: process.env.NODE_ENV === "development" ? err.message : "An error occurred during registration"
    });
  }
}

// Endpoint para asegurar que el usuario tenga su cuenta de correo creada
export async function ensureEmailAccount(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id || !user.email) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    console.log(`🔧 [ENSURE-ACCOUNT] Asegurando cuenta de correo para usuario ${user.id} (${user.email})`);

    // Verificar si ya tiene cuenta
    let account = await prisma.emailAccount.findFirst({
      where: { ownerId: user.id },
      select: { id: true, address: true, ownerId: true },
    });

    if (account) {
      console.log(`✅ [ENSURE-ACCOUNT] Usuario ${user.id} ya tiene cuenta: ${account.address} (ID: ${account.id})`);
      return res.json({ 
        success: true, 
        account: { id: account.id, address: account.address },
        message: "Cuenta ya existe"
      });
    }

    // Buscar por email como fallback
    account = await prisma.emailAccount.findUnique({
      where: { address: user.email },
      select: { id: true, address: true, ownerId: true },
    });

    if (account) {
      // Si existe pero sin ownerId, asignarlo
      if (!account.ownerId || account.ownerId !== user.id) {
        console.log(`🔧 [ENSURE-ACCOUNT] Asignando ownerId ${user.id} a cuenta ${account.id}`);
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { ownerId: user.id },
        });
        console.log(`✅ [ENSURE-ACCOUNT] ownerId asignado correctamente`);
        return res.json({ 
          success: true, 
          account: { id: account.id, address: account.address },
          message: "Cuenta encontrada y actualizada"
        });
      }
      console.log(`✅ [ENSURE-ACCOUNT] Usuario ${user.id} ya tiene cuenta: ${account.address} (ID: ${account.id})`);
      return res.json({ 
        success: true, 
        account: { id: account.id, address: account.address },
        message: "Cuenta ya existe"
      });
    }

    // Si no existe, crear dominio y cuenta
    console.log(`📝 [ENSURE-ACCOUNT] Creando dominio y cuenta para usuario ${user.id}...`);
    
    const domainName = "xstarmail.es";
    
    // Buscar dominio xstarmail.es (puede pertenecer a cualquier usuario ya que es compartido)
    let domain = await prisma.domain.findFirst({
      where: { domainName },
    });

    if (!domain) {
      // Si no existe, intentar crearlo
      console.log(`🔧 [ENSURE-ACCOUNT] Dominio ${domainName} no existe. Creándolo...`);
      try {
        domain = await prisma.domain.create({
          data: {
            domainName,
            userId: user.id, // Asignar al usuario actual
            dnsVerified: true,
            smtpProvider: process.env.EMAIL_SMTP_HOST ? "smtp" : null,
            smtpHost: process.env.EMAIL_SMTP_HOST || null,
            smtpPort: process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT) : null,
            smtpUser: process.env.EMAIL_SMTP_USER || null,
            smtpPassword: process.env.EMAIL_SMTP_PASSWORD || null,
          },
        });
        console.log(`✅ [ENSURE-ACCOUNT] Dominio ${domainName} (ID: ${domain.id}) creado para usuario ${user.id}`);
      } catch (createError: any) {
        // Si falla por duplicado (P2002), significa que se creó en otro proceso
        if (createError.code === "P2002" || createError.message?.includes("Unique constraint")) {
          console.log(`⚠️ [ENSURE-ACCOUNT] Dominio ya existe (se creó en otro proceso). Buscándolo...`);
          // Esperar un momento y buscar de nuevo
          await new Promise(resolve => setTimeout(resolve, 500));
          domain = await prisma.domain.findFirst({
            where: { domainName },
          });
          
          if (domain) {
            console.log(`✅ [ENSURE-ACCOUNT] Dominio encontrado: ${domainName} (ID: ${domain.id}) - pertenece al usuario ${domain.userId}`);
          } else {
            throw new Error(`No se pudo crear ni encontrar el dominio ${domainName}`);
          }
        } else {
          throw createError;
        }
      }
    } else {
      // El dominio ya existe (puede pertenecer a otro usuario, pero es compartido)
      console.log(`✅ [ENSURE-ACCOUNT] Dominio ${domainName} ya existe (ID: ${domain.id}) - pertenece al usuario ${domain.userId}`);
      console.log(`ℹ️ [ENSURE-ACCOUNT] Usando dominio compartido para crear cuenta del usuario ${user.id}`);
    }

    // Obtener la contraseña del usuario (hasheada) para la cuenta de correo
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Crear cuenta de correo
    const newAccount = await prisma.emailAccount.create({
      data: {
        address: user.email,
        password: userWithPassword.password, // Misma contraseña hasheada
        domainId: domain.id,
        ownerId: user.id,
        smtpHost: domain.smtpHost || null,
        smtpPort: domain.smtpPort || null,
        smtpUser: domain.smtpUser || user.email,
        smtpPassword: domain.smtpPassword || null,
      },
    });

    console.log(`✅ [ENSURE-ACCOUNT] Cuenta ${user.email} (ID: ${newAccount.id}) creada con ownerId: ${user.id}`);

    // 🚀 CREAR USUARIO SMTP REAL EN EL SERVIDOR
    console.log(`📧 [ENSURE-ACCOUNT] Creando usuario SMTP real para: ${user.email}`);
    const { default: SmtpUserService } = await import("../services/smtp-user.service");
    
    // Necesitamos la contraseña sin hashear - intentar obtenerla del body o usar una temporal
    // En producción, esto debería manejarse de forma más segura
    const tempPassword = req.body.password || "temp_password_change_me";
    
    const smtpResult = await SmtpUserService.createSmtpUser(
      user.email,
      tempPassword, // En producción, esto debería venir del request o generarse
      domain.domainName
    );

    if (smtpResult.success) {
      // Actualizar la cuenta con la configuración SMTP
      await prisma.emailAccount.update({
        where: { id: newAccount.id },
        data: {
          smtpHost: smtpResult.smtpHost || process.env.EMAIL_SMTP_HOST || null,
          smtpPort: smtpResult.smtpPort || parseInt(process.env.EMAIL_SMTP_PORT || "587"),
          smtpUser: smtpResult.smtpUser || user.email,
          smtpPassword: tempPassword, // Guardar contraseña para SMTP
        },
      });
      console.log(`✅ [ENSURE-ACCOUNT] Usuario SMTP creado exitosamente en el servidor para: ${user.email}`);
    } else {
      console.warn(`⚠️ [ENSURE-ACCOUNT] No se pudo crear usuario SMTP automáticamente: ${smtpResult.error}`);
      console.warn(`⚠️ [ENSURE-ACCOUNT] La cuenta se creó en la BD pero puede requerir configuración SMTP manual`);
    }

    res.json({ 
      success: true, 
      account: { id: newAccount.id, address: newAccount.address },
      smtpConfigured: smtpResult.success,
      smtpError: smtpResult.error,
      message: "Cuenta creada exitosamente"
    });
  } catch (err: any) {
    console.error("❌ [ENSURE-ACCOUNT] Error:", err);
    res.status(500).json({ error: "Error al asegurar cuenta de correo", message: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    
    // Agregar automáticamente @xstarmail.es si el email no tiene dominio
    let finalEmail = email.trim().toLowerCase();
    if (!finalEmail.includes("@")) {
      finalEmail = `${finalEmail}@xstarmail.es`;
    } else if (!finalEmail.endsWith("@xstarmail.es")) {
      // Si tiene otro dominio, también agregar @xstarmail.es
      const username = finalEmail.split("@")[0];
      finalEmail = `${username}@xstarmail.es`;
    }
    
    // Solo obtener los campos necesarios para el login
    const user = await prisma.user.findUnique({ 
      where: { email: finalEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      }
    });
    
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role || "user" }, token });
  } catch (err: any) {
    console.error("Login error:", err);
    // Manejo mejorado de errores
    if (err.code === "P2022") {
      return res.status(500).json({ 
        error: "Database schema error",
        message: "Please run 'npx prisma migrate deploy' to sync the database"
      });
    }
    res.status(500).json({ error: "Server error" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    console.log("🔍 Backend - /api/auth/me llamado");
    // authMiddleware already attaches user
    const userFromMiddleware = (req as any).user;
    
    console.log("🔍 Backend - userFromMiddleware:", JSON.stringify(userFromMiddleware, null, 2));
    
    if (!userFromMiddleware || !userFromMiddleware.id) {
      console.error("❌ Backend - No user from middleware");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // SIEMPRE consultar directamente desde la BD para asegurar que tenemos el role
    console.log("🔍 Backend - Consultando usuario desde BD con ID:", userFromMiddleware.id);
    console.log("🔍 Backend - userFromMiddleware.role (del middleware):", userFromMiddleware.role);
    
    // Verificar directamente con una consulta raw primero (MySQL usa backticks para nombres de tabla)
    const rawUser = await prisma.$queryRaw`
      SELECT id, email, name, role FROM \`User\` WHERE id = ${userFromMiddleware.id}
    ` as any[];
    
    if (rawUser && rawUser.length > 0) {
      console.log("🔍 Backend - Raw query result:", JSON.stringify(rawUser[0], null, 2));
      console.log("🔍 Backend - Raw query role:", rawUser[0].role);
      console.log("🔍 Backend - Raw query role type:", typeof rawUser[0].role);
    } else {
      console.log("⚠️ Backend - Raw query no devolvió resultados");
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userFromMiddleware.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        paymentMethod: true,
        paymentDetails: true,
        preferences: true,
      }
    });
    
    if (!user) {
      console.error("❌ Backend - User not found in database");
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log("🔍 Backend - User desde BD (Prisma):", JSON.stringify(user, null, 2));
    console.log("🔍 Backend - User.role (raw):", user.role);
    console.log("🔍 Backend - User.role (typeof):", typeof user.role);
    console.log("🔍 Backend - User.role === 'admin':", user.role === "admin");
    console.log("🔍 Backend - User.role === 'ADMIN':", user.role === "ADMIN");
    
    // Asegurar que el role esté presente y en minúsculas
    const userRole = (user.role || "user").toLowerCase();
    console.log("🔍 Backend - userRole final (normalized):", userRole);
    console.log("🔍 Backend - userRole === 'admin':", userRole === "admin");
    
    // Parsear paymentDetails si existe
    let paymentDetailsParsed = null;
    if (user.paymentDetails) {
      try {
        paymentDetailsParsed = JSON.parse(user.paymentDetails);
      } catch (e) {
        console.error("Error parsing paymentDetails:", e);
      }
    }
    
    // Verificar si el email está verificado
    let emailVerified = false;
    if (user.preferences) {
      try {
        const preferences = JSON.parse(user.preferences);
        emailVerified = preferences.emailVerified === true;
      } catch (e) {
        console.error("Error parsing preferences:", e);
      }
    }
    
    const response = { 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        emailVerified, 
        role: userRole,  // Asegurar que siempre esté presente y en minúsculas
        phone: user.phone,
        paymentMethod: user.paymentMethod,
        paymentDetails: paymentDetailsParsed,
      } 
    };
    
    // Verificar que el role esté en la respuesta
    console.log("🔍 Backend - Response.user.role:", response.user.role);
    console.log("🔍 Backend - Response final (stringified):", JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error: any) {
    console.error("❌ Backend - Error en /api/auth/me:", error);
    console.error("❌ Backend - Error stack:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { name, phone, paymentMethod, paymentDetails, preferences } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (paymentDetails !== undefined) {
      updateData.paymentDetails = typeof paymentDetails === "string" 
        ? paymentDetails 
        : JSON.stringify(paymentDetails);
    }
    if (preferences !== undefined) {
      // Si preferences viene como objeto, stringificarlo
      // Si viene como string, usarlo directamente
      updateData.preferences = typeof preferences === "string" 
        ? preferences 
        : JSON.stringify(preferences);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        paymentMethod: true,
        paymentDetails: true,
      },
    });

    // Parsear paymentDetails si existe
    let paymentDetailsParsed = null;
    if (updatedUser.paymentDetails) {
      try {
        paymentDetailsParsed = JSON.parse(updatedUser.paymentDetails);
      } catch (e) {
        console.error("Error parsing paymentDetails:", e);
      }
    }

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        paymentMethod: updatedUser.paymentMethod,
        paymentDetails: paymentDetailsParsed,
      },
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Solicitar restablecimiento de contraseña
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Normalizar email
    let finalEmail = email.trim().toLowerCase();
    if (!finalEmail.includes("@")) {
      finalEmail = `${finalEmail}@xstarmail.es`;
    } else if (!finalEmail.endsWith("@xstarmail.es")) {
      const username = finalEmail.split("@")[0];
      finalEmail = `${username}@xstarmail.es`;
    }

    const user = await prisma.user.findUnique({
      where: { email: finalEmail },
      select: { id: true, email: true, name: true },
    });

    // Por seguridad, siempre devolvemos éxito aunque el usuario no exista
    if (!user) {
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generar token de restablecimiento
    const resetToken = jwt.sign(
      { userId: user.id, type: "password-reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Guardar token en la base de datos (podríamos usar una tabla separada, pero por simplicidad usamos el campo preferences)
    const resetTokenData = {
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: JSON.stringify({ resetToken: resetTokenData }),
      },
    });

    // Enviar email con el token (usando el servicio de email)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
    
    // Por ahora solo logueamos, en producción deberías enviar el email real
    console.log(`📧 Password reset link for ${user.email}: ${resetUrl}`);

    // TODO: Implementar envío real de email usando EmailRealService
    // await EmailRealService.sendEmail({
    //   from: process.env.EMAIL_SMTP_USER || "noreply@xstarmail.es",
    //   to: user.email,
    //   subject: "Restablecer contraseña - Fylo Mail",
    //   text: `Hola ${user.name},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace:\n${resetUrl}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, ignora este correo.`,
    //   html: `<p>Hola ${user.name},</p><p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este enlace expirará en 1 hora.</p><p>Si no solicitaste este cambio, ignora este correo.</p>`,
    // });

    res.json({ 
      message: "If an account with that email exists, a password reset link has been sent.",
      // En desarrollo, devolvemos el token para facilitar pruebas
      ...(process.env.NODE_ENV === "development" && { resetToken, resetUrl })
    });
  } catch (error: any) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Restablecer contraseña con token
// Enviar código de verificación de email
export async function sendVerificationCode(req: any, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    // Usar el email tal cual lo ingresa el usuario (puede ser cualquier correo)
    const verificationEmail = email.trim().toLowerCase();
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(verificationEmail)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Obtener el usuario autenticado desde el middleware
    const user = req.user;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Obtener usuario completo de la BD
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, preferences: true },
    });

    if (!userData) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar código y email de verificación en las preferencias del usuario (temporal, expira en 10 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const preferences = userData.preferences ? JSON.parse(userData.preferences) : {};
    preferences.verificationCode = code;
    preferences.verificationCodeExpiresAt = expiresAt.toISOString();
    preferences.verificationEmail = verificationEmail; // Guardar el email al que se envió

    await prisma.user.update({
      where: { id: userData.id },
      data: {
        preferences: JSON.stringify(preferences),
      },
    });

    // Enviar email real usando EmailRealService
    try {
      const EmailRealService = require("../services/email-real.service");
      const fromEmail = process.env.EMAIL_SMTP_USER || "noreply@xstarmail.es";
      
      await EmailRealService.sendEmail({
        from: fromEmail,
        to: verificationEmail, // Enviar al correo que el usuario ingresó
        subject: "Código de verificación - Fylo Mail",
        text: `Tu código de verificación es: ${code}\n\nEste código expira en 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #14b4a1;">Código de verificación</h2>
            <p>Tu código de verificación es:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #14b4a1; border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
            <p style="color: #666; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
          </div>
        `,
      });
      
      console.log(`✅ Código de verificación enviado a ${verificationEmail}`);
    } catch (emailError: any) {
      console.error("❌ Error enviando email:", emailError);
      // En desarrollo, mostrar el código en consola
      console.log(`📧 [DESARROLLO] Código de verificación para ${verificationEmail}: ${code}`);
      console.log(`⏰ Expira en: ${expiresAt.toISOString()}`);
    }

    res.json({
      message: "Código de verificación enviado",
      // En desarrollo, también retornamos el código
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (err: any) {
    console.error("Send verification code error:", err);
    res.status(500).json({ error: "Error al enviar código de verificación" });
  }
}

// Verificar código de email
export async function verifyEmailCode(req: any, res: Response) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email y código requeridos" });
    }

    // Obtener el usuario autenticado desde el middleware
    const userFromMiddleware = req.user;
    
    if (!userFromMiddleware || !userFromMiddleware.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Obtener usuario completo de la BD
    const user = await prisma.user.findUnique({
      where: { id: userFromMiddleware.id },
      select: { id: true, email: true, preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar código
    const preferences = user.preferences ? JSON.parse(user.preferences) : {};
    const storedCode = preferences.verificationCode;
    const expiresAt = preferences.verificationCodeExpiresAt;
    const verificationEmail = preferences.verificationEmail; // Email al que se envió el código

    if (!storedCode || !expiresAt) {
      return res.status(400).json({ error: "Código no encontrado o expirado" });
    }

    if (new Date(expiresAt) < new Date()) {
      return res.status(400).json({ error: "Código expirado" });
    }

    if (storedCode !== code) {
      return res.status(400).json({ error: "Código inválido" });
    }

    // Código válido - marcar email como verificado y limpiar código
    delete preferences.verificationCode;
    delete preferences.verificationCodeExpiresAt;
    preferences.emailVerified = true;
    preferences.emailVerifiedAt = new Date().toISOString();
    // Guardar el email de verificación usado
    if (verificationEmail) {
      preferences.verifiedEmail = verificationEmail;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: JSON.stringify(preferences),
      },
    });

    res.json({
      message: "Email verificado exitosamente",
      verified: true,
    });
  } catch (err: any) {
    console.error("Verify email code error:", err);
    res.status(500).json({ error: "Error al verificar código" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Verificar token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (decoded.type !== "password-reset") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    const userId = decoded.userId;

    // Verificar que el token esté guardado en el usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verificar token en preferences
    let preferences: any = {};
    if (user.preferences) {
      try {
        preferences = JSON.parse(user.preferences);
      } catch (e) {
        // Ignorar error de parsing
      }
    }

    if (!preferences.resetToken || preferences.resetToken.token !== token) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Verificar expiración
    const expiresAt = new Date(preferences.resetToken.expiresAt);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: "Token has expired" });
    }

    // Actualizar contraseña y limpiar token
    const hashedPassword = await hashPassword(newPassword);
    const updatedPreferences = { ...preferences };
    delete updatedPreferences.resetToken;

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        preferences: JSON.stringify(updatedPreferences),
      },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
}