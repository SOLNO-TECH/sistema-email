import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashPassword } from "../src/utils/hash";
import SmtpUserService from "../services/smtp-user.service";

export async function createEmailAccount(req: any, res: Response) {
  try {
    const user = req.user;
    const { domainId, address, password } = req.body;

    if (!domainId || !address || !password) {
      return res.status(400).json({ error: "domainId, address, and password are required" });
    }

    // Verificar límites del plan
    const { SubscriptionService } = await import("../services/subscription.service");
    const canCreate = await SubscriptionService.canCreateEmailAccount(user.id);
    
    if (!canCreate.allowed) {
      return res.status(403).json({ 
        error: canCreate.reason || "Límite de cuentas alcanzado",
        code: "LIMIT_REACHED"
      });
    }

    // Verificar que el dominio pertenece al usuario
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: user.id },
    });

    if (!domain) {
      return res.status(404).json({ error: "Domain not found or not owned by user" });
    }

    // Validar que la dirección de correo pertenece al dominio
    const emailAddress = address.includes("@") ? address : `${address}@${domain.domainName}`;
    if (!emailAddress.endsWith(`@${domain.domainName}`)) {
      return res.status(400).json({ error: "Email address must belong to the domain" });
    }

    // Verificar si ya existe
    const exists = await prisma.emailAccount.findUnique({
      where: { address: emailAddress },
    });

    if (exists) {
      return res.status(409).json({ error: "Email account already exists" });
    }

    const hashed = await hashPassword(password);

    // Crear cuenta en la base de datos
    const emailAccount = await prisma.emailAccount.create({
      data: {
        address: emailAddress,
        password: hashed,
        domainId: domain.id,
        ownerId: user.id,
      },
    });

    // 🚀 CREAR USUARIO SMTP AUTOMÁTICAMENTE
    console.log(`📧 Creando usuario SMTP para: ${emailAddress}`);
    const smtpResult = await SmtpUserService.createSmtpUser(
      emailAddress,
      password, // Contraseña sin hashear para el servidor SMTP
      domain.domainName
    );

    if (smtpResult.success) {
      // Guardar configuración SMTP en la cuenta
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          smtpHost: smtpResult.smtpHost || process.env.EMAIL_SMTP_HOST || null,
          smtpPort: smtpResult.smtpPort || parseInt(process.env.EMAIL_SMTP_PORT || "587"),
          smtpUser: smtpResult.smtpUser || emailAddress,
          smtpPassword: password, // Guardar contraseña para SMTP (en producción, usar contraseña de aplicación)
        },
      });
      console.log(`✅ Usuario SMTP creado exitosamente para: ${emailAddress}`);
    } else {
      console.warn(`⚠️ No se pudo crear usuario SMTP automáticamente: ${smtpResult.error}`);
      console.warn(`⚠️ La cuenta se creó pero puede requerir configuración SMTP manual`);
    }

    res.json({
      id: emailAccount.id,
      address: emailAccount.address,
      domainId: emailAccount.domainId,
      smtpConfigured: smtpResult.success,
      smtpError: smtpResult.error,
    });
  } catch (err: any) {
    console.error("Create email account error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email account already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

export async function listEmailAccounts(req: any, res: Response) {
  try {
    const user = req.user;
    const { domainId } = req.query;

    if (!user || !user.id) {
      console.error("❌ listEmailAccounts - Usuario no autenticado");
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    console.log(`🔍 [EMAIL-ACCOUNTS] Usuario: ${user.id} (${user.email})`);
    console.log(`🔍 [EMAIL-ACCOUNTS] domainId query:`, domainId);

    const where: any = { ownerId: user.id };
    if (domainId) {
      where.domainId = parseInt(domainId as string);
    }

    console.log(`🔍 [EMAIL-ACCOUNTS] Query where:`, JSON.stringify(where, null, 2));

    // Buscar cuentas con ownerId
    const accounts = await prisma.emailAccount.findMany({
      where,
      include: {
        domain: {
          select: {
            domainName: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    console.log(`📧 [EMAIL-ACCOUNTS] Cuentas encontradas (${accounts.length}):`, accounts.map(acc => ({
      id: acc.id,
      address: acc.address,
      ownerId: acc.ownerId,
      domainId: acc.domainId,
    })));

    // Si no se encontraron cuentas, buscar también por email del usuario (fallback)
    if (accounts.length === 0 && user.email) {
      console.log(`⚠️ [EMAIL-ACCOUNTS] No se encontraron cuentas con ownerId. Buscando por email: ${user.email}`);
      const accountByEmail = await prisma.emailAccount.findUnique({
        where: { address: user.email },
        include: {
          domain: {
            select: {
              domainName: true,
            },
          },
        },
      });
      
      if (accountByEmail) {
        console.log(`📧 [EMAIL-ACCOUNTS] Cuenta encontrada por email:`, {
          id: accountByEmail.id,
          address: accountByEmail.address,
          ownerId: accountByEmail.ownerId,
        });
        
        // Si la cuenta existe pero no tiene ownerId, asignarlo
        if (!accountByEmail.ownerId || accountByEmail.ownerId !== user.id) {
          console.log(`🔧 [EMAIL-ACCOUNTS] Asignando ownerId ${user.id} a cuenta ${accountByEmail.id}`);
          await prisma.emailAccount.update({
            where: { id: accountByEmail.id },
            data: { ownerId: user.id },
          });
        }
        
        return res.json([{
          id: accountByEmail.id,
          address: accountByEmail.address,
          domainId: accountByEmail.domainId,
          domainName: accountByEmail.domain.domainName,
          storageUsed: accountByEmail.storageUsed || 0,
        }]);
      }
    }

    res.json(
      accounts.map((acc) => ({
        id: acc.id,
        address: acc.address,
        domainId: acc.domainId,
        domainName: acc.domain.domainName,
        storageUsed: acc.storageUsed || 0,
      }))
    );
  } catch (err) {
    console.error("❌ [EMAIL-ACCOUNTS] Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteEmailAccount(req: any, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;

    const account = await prisma.emailAccount.findFirst({
      where: { id: parseInt(id), ownerId: user.id },
      include: { domain: true },
    });

    if (!account) {
      return res.status(404).json({ error: "Email account not found" });
    }

    // 🗑️ ELIMINAR USUARIO SMTP AUTOMÁTICAMENTE
    console.log(`🗑️ Eliminando usuario SMTP para: ${account.address}`);
    await SmtpUserService.deleteSmtpUser(account.address, account.domain.domainName);

    await prisma.emailAccount.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Email account deleted successfully" });
  } catch (err) {
    console.error("Delete email account error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

