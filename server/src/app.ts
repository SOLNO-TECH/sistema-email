import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import prisma from "../lib/prisma";
import { hashPassword } from "./utils/hash";
import { apiRateLimiter, sanitizeBody, sanitizeQuery } from "./middleware/security.middleware";
import authRoutes from "../routes/auth.routes";
import domainsRoutes from "../routes/domains.routes";
import emailsRoutes from "../routes/emails.routes";
import emailAccountsRoutes from "../routes/email-accounts.routes";
import mailboxRoutes from "../routes/mailbox.routes";
import plansRoutes from "../routes/plans.routes";
import subscriptionsRoutes from "../routes/subscriptions.routes";
import paymentsRoutes from "../routes/payments.routes";
import adminRoutes from "../routes/admin.routes";
import ticketsRoutes from "../routes/tickets.routes";
import invoicesRoutes from "../routes/invoices.routes";
import userSettingsRoutes from "../routes/user-settings.routes";
import oauthRoutes from "../routes/oauth.routes";
import notificationsRoutes from "../routes/notifications.routes";

// Credenciales del admin por defecto
const DEFAULT_ADMIN_EMAIL = "admin@fylomail.es";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_NAME = "Administrador";

// Función para asegurar que el admin por defecto existe
async function ensureDefaultAdmin() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN_EMAIL },
    });

    if (existingAdmin) {
      // Si existe pero no es admin, actualizarlo
      if (existingAdmin.role !== "admin") {
        await prisma.user.update({
          where: { email: DEFAULT_ADMIN_EMAIL },
          data: { role: "admin" },
        });
        console.log(`✅ Admin por defecto actualizado: ${DEFAULT_ADMIN_EMAIL}`);
      }
    } else {
      // Crear el admin por defecto si no existe
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      
      await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          name: DEFAULT_ADMIN_NAME,
          password: hashedPassword,
          role: "admin",
        },
      });

      console.log(`✅ Admin por defecto creado: ${DEFAULT_ADMIN_EMAIL}`);
    }
  } catch (error: any) {
    console.error("⚠️  Error verificando admin por defecto:", error.message);
    // No bloqueamos el inicio del servidor si falla
  }
}

const app = express();

// Headers de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configurado con restricciones
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3002",
      "http://127.0.0.1:3002",
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, mobile apps, etc.) solo en desarrollo
    if (!origin && process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    // En desarrollo, permitir localhost en cualquier puerto
    if (process.env.NODE_ENV === "development" && origin && (
      origin.includes("localhost") || 
      origin.includes("127.0.0.1") ||
      origin.includes("192.168.")
    )) {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiting global
app.use("/api", apiRateLimiter);

// Webhook de Stripe necesita raw body (debe estar antes de express.json())
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitización de inputs
app.use(sanitizeQuery);
app.use(sanitizeBody);

// Servir archivos estáticos de uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando ✔️");
});

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/domains", domainsRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/email-accounts", emailAccountsRoutes);
app.use("/api/mailbox", mailboxRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/user-settings", userSettingsRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/notifications", notificationsRoutes);

// Log para verificar que las rutas están registradas
console.log("✅ Rutas registradas:");
console.log("  - /api/tickets");
console.log("  - /api/admin (usuarios, planes, dominios, tickets, facturas, cuentas de email)");
console.log("  - /api/user-settings (preferencias, recuperación, créditos, seguridad)");
console.log("  - /api/notifications (sistema de notificaciones)");

// Servidor escuchando
const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
  
  // Asegurar que el admin por defecto existe al iniciar
  await ensureDefaultAdmin();
  
  // Iniciar sincronización automática de correos (cada 5 minutos)
  // Solo en producción o si está explícitamente habilitado
  const isDevelopment = process.env.NODE_ENV !== "production";
  const enableSync = process.env.ENABLE_EMAIL_SYNC === "true";
  
  if (enableSync && !isDevelopment) {
    const EmailSyncService = require("../services/email-sync.service").default;
    const intervalMinutes = parseInt(process.env.EMAIL_SYNC_INTERVAL || "5");
    EmailSyncService.start(intervalMinutes);
    console.log(`✅ Sincronización automática de correos activada (cada ${intervalMinutes} minutos)`);
  } else if (enableSync && isDevelopment) {
    console.log("ℹ️  Sincronización automática desactivada en desarrollo (solo funciona en producción con servidor de correo)");
  } else {
    console.log("ℹ️  Sincronización automática desactivada (configura ENABLE_EMAIL_SYNC=true para activar)");
  }
});
