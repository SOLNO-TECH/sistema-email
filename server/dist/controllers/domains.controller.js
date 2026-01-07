"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDomain = addDomain;
exports.verifyDomain = verifyDomain;
exports.updateDomainSmtp = updateDomainSmtp;
exports.listDomains = listDomains;
exports.deleteDomain = deleteDomain;
const prisma_1 = __importDefault(require("../lib/prisma"));
const dns_verification_service_1 = __importDefault(require("../services/dns-verification.service"));
async function addDomain(req, res) {
    try {
        const user = req.user;
        const { domainName } = req.body;
        if (!domainName)
            return res.status(400).json({ error: "domainName required" });
        // Verificar límites del plan
        const { SubscriptionService } = await Promise.resolve().then(() => __importStar(require("../services/subscription.service")));
        const canCreate = await SubscriptionService.canCreateDomain(user.id);
        if (!canCreate.allowed) {
            return res.status(403).json({
                error: canCreate.reason || "Límite de dominios alcanzado",
                code: "LIMIT_REACHED"
            });
        }
        // sanitize basic
        const name = domainName.trim().toLowerCase();
        const exists = await prisma_1.default.domain.findUnique({ where: { domainName: name } });
        if (exists)
            return res.status(409).json({ error: "Domain exists" });
        // Verificar DNS real
        console.log(`🔍 Verificando DNS para: ${name}`);
        const dnsResult = await dns_verification_service_1.default.verifyDomain(name);
        // Configurar SMTP automáticamente desde variables de entorno globales
        // NUEVA PRIORIDAD: 1) SMTP Propio (permite cualquier email sin verificación), 2) SendGrid, 3) Mailgun
        // El SMTP propio es la mejor opción porque permite enviar desde cualquier dirección automáticamente
        let smtpConfig = {};
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
        }
        else if (process.env.SENDGRID_API_KEY) {
            // PRIORIDAD 2: SendGrid (requiere verificación de dominio/email)
            smtpConfig = {
                smtpProvider: "sendgrid",
                smtpApiKey: process.env.SENDGRID_API_KEY,
            };
            console.log(`⚠️ Auto-configurando SendGrid para dominio ${name} (requiere verificación en SendGrid)`);
        }
        else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
            // PRIORIDAD 3: Mailgun (requiere verificación)
            smtpConfig = {
                smtpProvider: "mailgun",
                smtpApiKey: process.env.MAILGUN_API_KEY,
                smtpHost: `smtp.mailgun.org`,
            };
            console.log(`⚠️ Auto-configurando Mailgun para dominio ${name} (requiere verificación)`);
        }
        else {
            console.warn("⚠️ No se encontró ninguna configuración SMTP global en .env.");
            console.warn("⚠️ El dominio se creará sin SMTP automático.");
            console.warn("💡 Configura EMAIL_SMTP_HOST, EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD para habilitar envío automático.");
        }
        const domain = await prisma_1.default.domain.create({
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
            dnsInstructions: dns_verification_service_1.default.getDnsInstructions(name),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
async function verifyDomain(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const domain = await prisma_1.default.domain.findFirst({
            where: { id: parseInt(id), userId: user.id },
        });
        if (!domain) {
            return res.status(404).json({ error: "Domain not found" });
        }
        // Verificar DNS real
        console.log(`🔍 Verificando DNS para: ${domain.domainName}`);
        const dnsResult = await dns_verification_service_1.default.verifyDomain(domain.domainName);
        // Actualizar dominio
        const updated = await prisma_1.default.domain.update({
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
            dnsInstructions: dns_verification_service_1.default.getDnsInstructions(domain.domainName),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
async function updateDomainSmtp(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const { smtpProvider, smtpHost, smtpPort, smtpUser, smtpPassword, smtpApiKey, } = req.body;
        const domain = await prisma_1.default.domain.findFirst({
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
        }
        else if (smtpProvider === "smtp") {
            if (!smtpHost || !smtpUser || !smtpPassword) {
                return res.status(400).json({ error: "Host, usuario y contraseña requeridos para SMTP" });
            }
        }
        const updated = await prisma_1.default.domain.update({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
async function listDomains(req, res) {
    try {
        const user = req.user;
        const domains = await prisma_1.default.domain.findMany({ where: { userId: user.id } });
        res.json(domains);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
async function deleteDomain(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const domain = await prisma_1.default.domain.findFirst({
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
        await prisma_1.default.domain.delete({
            where: { id: domain.id },
        });
        res.json({ message: "Dominio eliminado exitosamente" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
