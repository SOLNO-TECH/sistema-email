"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const hash_1 = require("./utils/hash");
const security_middleware_1 = require("./middleware/security.middleware");
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const domains_routes_1 = __importDefault(require("../routes/domains.routes"));
const emails_routes_1 = __importDefault(require("../routes/emails.routes"));
const email_accounts_routes_1 = __importDefault(require("../routes/email-accounts.routes"));
const mailbox_routes_1 = __importDefault(require("../routes/mailbox.routes"));
const plans_routes_1 = __importDefault(require("../routes/plans.routes"));
const subscriptions_routes_1 = __importDefault(require("../routes/subscriptions.routes"));
const payments_routes_1 = __importDefault(require("../routes/payments.routes"));
const admin_routes_1 = __importDefault(require("../routes/admin.routes"));
const tickets_routes_1 = __importDefault(require("../routes/tickets.routes"));
const invoices_routes_1 = __importDefault(require("../routes/invoices.routes"));
const user_settings_routes_1 = __importDefault(require("../routes/user-settings.routes"));
const oauth_routes_1 = __importDefault(require("../routes/oauth.routes"));
const notifications_routes_1 = __importDefault(require("../routes/notifications.routes"));
// Credenciales del admin por defecto
const DEFAULT_ADMIN_EMAIL = "admin@fylomail.es";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_NAME = "Administrador";
// Función para asegurar que el admin por defecto existe
async function ensureDefaultAdmin() {
    try {
        const existingAdmin = await prisma_1.default.user.findUnique({
            where: { email: DEFAULT_ADMIN_EMAIL },
        });
        if (existingAdmin) {
            // Si existe pero no es admin, actualizarlo
            if (existingAdmin.role !== "admin") {
                await prisma_1.default.user.update({
                    where: { email: DEFAULT_ADMIN_EMAIL },
                    data: { role: "admin" },
                });
                console.log(`✅ Admin por defecto actualizado: ${DEFAULT_ADMIN_EMAIL}`);
            }
        }
        else {
            // Crear el admin por defecto si no existe
            const hashedPassword = await (0, hash_1.hashPassword)(DEFAULT_ADMIN_PASSWORD);
            await prisma_1.default.user.create({
                data: {
                    email: DEFAULT_ADMIN_EMAIL,
                    name: DEFAULT_ADMIN_NAME,
                    password: hashedPassword,
                    role: "admin",
                },
            });
            console.log(`✅ Admin por defecto creado: ${DEFAULT_ADMIN_EMAIL}`);
        }
    }
    catch (error) {
        console.error("⚠️  Error verificando admin por defecto:", error.message);
        // No bloqueamos el inicio del servidor si falla
    }
}
const app = (0, express_1.default)();
// Headers de seguridad con Helmet
app.use((0, helmet_1.default)({
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
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir requests sin origin (Postman, mobile apps, etc.) solo en desarrollo
        if (!origin && process.env.NODE_ENV === "development") {
            return callback(null, true);
        }
        // En desarrollo, permitir localhost en cualquier puerto
        if (process.env.NODE_ENV === "development" && origin && (origin.includes("localhost") ||
            origin.includes("127.0.0.1") ||
            origin.includes("192.168."))) {
            return callback(null, true);
        }
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`⚠️ CORS bloqueado para origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Rate limiting global
app.use("/api", security_middleware_1.apiRateLimiter);
// Webhook de Stripe necesita raw body (debe estar antes de express.json())
app.use("/api/payments/webhook", express_1.default.raw({ type: "application/json" }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Sanitización de inputs
app.use(security_middleware_1.sanitizeQuery);
app.use(security_middleware_1.sanitizeBody);
// Servir archivos estáticos de uploads
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Backend funcionando ✔️");
});
// Rutas API
app.use("/api/auth", auth_routes_1.default);
app.use("/api/domains", domains_routes_1.default);
app.use("/api/emails", emails_routes_1.default);
app.use("/api/email-accounts", email_accounts_routes_1.default);
app.use("/api/mailbox", mailbox_routes_1.default);
app.use("/api/plans", plans_routes_1.default);
app.use("/api/subscriptions", subscriptions_routes_1.default);
app.use("/api/payments", payments_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/tickets", tickets_routes_1.default);
app.use("/api/invoices", invoices_routes_1.default);
app.use("/api/user-settings", user_settings_routes_1.default);
app.use("/api/oauth", oauth_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
// Log para verificar que las rutas están registradas
console.log("✅ Rutas registradas:");
console.log("  - /api/tickets");
console.log("  - /api/admin (usuarios, planes, dominios, tickets, facturas, cuentas de email)");
console.log("  - /api/user-settings (preferencias, recuperación, créditos, seguridad)");
console.log("  - /api/notifications (sistema de notificaciones)");
// Servidor escuchando
const PORT = process.env.PORT || 3001;
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
    }
    else if (enableSync && isDevelopment) {
        console.log("ℹ️  Sincronización automática desactivada en desarrollo (solo funciona en producción con servidor de correo)");
    }
    else {
        console.log("ℹ️  Sincronización automática desactivada (configura ENABLE_EMAIL_SYNC=true para activar)");
    }
});
