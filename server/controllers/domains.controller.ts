import { Request, Response } from "express";
import prisma from "../lib/prisma";
import DnsVerificationService from "../services/dns-verification.service";

export async function addDomain(req: any, res: Response) {
  try {
    const user = req.user;
    const { domainName } = req.body;
    if (!domainName) return res.status(400).json({ error: "domainName required" });
    
    // Verificar límites del plan
    const { SubscriptionService } = await import("../services/subscription.service");
    const canCreate = await SubscriptionService.canCreateDomain(user.id);
    
    if (!canCreate.allowed) {
      return res.status(403).json({ 
        error: canCreate.reason || "Límite de dominios alcanzado",
        code: "LIMIT_REACHED"
      });
    }
    
    // sanitize basic
    const name = domainName.trim().toLowerCase();
    const exists = await prisma.domain.findUnique({ where: { domainName: name } });
    if (exists) return res.status(409).json({ error: "Domain exists" });
    
    // Verificar DNS real
    console.log(`🔍 Verificando DNS para: ${name}`);
    const dnsResult = await DnsVerificationService.verifyDomain(name);
    
    // Configurar SMTP automáticamente desde variables de entorno globales
    // NUEVA PRIORIDAD: 1) SMTP Propio (permite cualquier email sin verificación), 2) SendGrid, 3) Mailgun
    // El SMTP propio es la mejor opción porque permite enviar desde cualquier dirección automáticamente
    let smtpConfig: any = {};
    
    if (process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASSWORD) {
      // PRIORIDAD 1: SMTP propio - Permite enviar desde cualquier email sin verificación
      smtpConfig = {
        smtpProvider: "smtp",
        smtpHost: process.env.EMAIL_SMTP_HOST,
        smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
        smtpUser: process.env.EMAIL_SMTP_USER,
        smtpPassword: process.env.EMAIL_SMTP_PASSWORD,
      };
      console.log(`✅ Auto-configurando SMTP propio para dominio ${name} (permite cualquier email automáticamente)`);
    } else if (process.env.SENDGRID_API_KEY) {
      // PRIORIDAD 2: SendGrid (requiere verificación de dominio/email)
      smtpConfig = {
        smtpProvider: "sendgrid",
        smtpApiKey: process.env.SENDGRID_API_KEY,
      };
      console.log(`⚠️ Auto-configurando SendGrid para dominio ${name} (requiere verificación en SendGrid)`);
    } else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      // PRIORIDAD 3: Mailgun (requiere verificación)
      smtpConfig = {
        smtpProvider: "mailgun",
        smtpApiKey: process.env.MAILGUN_API_KEY,
        smtpHost: `smtp.mailgun.org`,
      };
      console.log(`⚠️ Auto-configurando Mailgun para dominio ${name} (requiere verificación)`);
    } else {
      console.warn("⚠️ No se encontró ninguna configuración SMTP global en .env.");
      console.warn("⚠️ El dominio se creará sin SMTP automático.");
      console.warn("💡 Configura EMAIL_SMTP_HOST, EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD para habilitar envío automático.");
    }
    
    const domain = await prisma.domain.create({
      data: {
        domainName: name,
        userId: user.id,
        dnsVerified: dnsResult.allVerified,
        mxRecord: dnsResult.mxRecord || null,
        spfRecord: dnsResult.spfRecord || null,
        dkimRecord: dnsResult.dkimRecord || null,
        dmarcRecord: dnsResult.dmarcRecord || null,
        lastDnsCheck: new Date(),
        ...smtpConfig, // Incluir configuración SMTP automática
      },
    });
    
    res.json({
      ...domain,
      dnsInstructions: DnsVerificationService.getDnsInstructions(name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function verifyDomain(req: any, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;
    
    const domain = await prisma.domain.findFirst({
      where: { id: parseInt(id), userId: user.id },
    });
    
    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }
    
    // Verificar DNS real
    console.log(`🔍 Verificando DNS para: ${domain.domainName}`);
    const dnsResult = await DnsVerificationService.verifyDomain(domain.domainName);
    
    // Actualizar dominio
    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: {
        dnsVerified: dnsResult.allVerified,
        mxRecord: dnsResult.mxRecord || null,
        spfRecord: dnsResult.spfRecord || null,
        dkimRecord: dnsResult.dkimRecord || null,
        dmarcRecord: dnsResult.dmarcRecord || null,
        lastDnsCheck: new Date(),
      },
    });
    
    res.json({
      ...updated,
      dnsResult,
      dnsInstructions: DnsVerificationService.getDnsInstructions(domain.domainName),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateDomainSmtp(req: any, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      smtpProvider,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpApiKey,
    } = req.body;

    const domain = await prisma.domain.findFirst({
      where: { id: parseInt(id), userId: user.id },
    });

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }

    // Validar según proveedor
    if (smtpProvider === "sendgrid" || smtpProvider === "mailgun") {
      if (!smtpApiKey) {
        return res.status(400).json({ error: "API Key requerida para este proveedor" });
      }
    } else if (smtpProvider === "smtp") {
      if (!smtpHost || !smtpUser || !smtpPassword) {
        return res.status(400).json({ error: "Host, usuario y contraseña requeridos para SMTP" });
      }
    }

    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: {
        smtpProvider: smtpProvider || null,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort || null,
        smtpUser: smtpUser || null,
        smtpPassword: smtpPassword || null,
        smtpApiKey: smtpApiKey || null,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function listDomains(req: any, res: Response) {
  try {
    const user = req.user;
    const domains = await prisma.domain.findMany({ where: { userId: user.id } });
    res.json(domains);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteDomain(req: any, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;
    
    const domain = await prisma.domain.findFirst({
      where: { id: parseInt(id), userId: user.id },
      include: {
        emailAccounts: true,
      },
    });

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }

    // Verificar si tiene cuentas de correo asociadas
    if (domain.emailAccounts.length > 0) {
      return res.status(400).json({ 
        error: "No se puede eliminar el dominio porque tiene cuentas de correo asociadas",
        emailAccountsCount: domain.emailAccounts.length,
      });
    }

    // Eliminar dominio
    await prisma.domain.delete({
      where: { id: domain.id },
    });

    res.json({ message: "Dominio eliminado exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
