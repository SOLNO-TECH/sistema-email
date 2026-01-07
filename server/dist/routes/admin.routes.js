"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const admin_middleware_1 = require("../src/middleware/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación y rol de admin
router.use(auth_middleware_1.authMiddleware);
router.use(admin_middleware_1.adminMiddleware);
// Estadísticas del sistema
router.get("/stats", admin_controller_1.getSystemStats);
// Usuarios
router.get("/users", admin_controller_1.getAllUsers);
router.get("/users/:id", admin_controller_1.getUserById);
router.put("/users/:id", admin_controller_1.updateUser);
router.put("/users/:id/password", admin_controller_1.updateUserPassword);
router.delete("/users/:id", admin_controller_1.deleteUser);
// Planes
router.get("/plans", admin_controller_1.getAllPlans);
router.post("/plans", admin_controller_1.createPlan);
router.put("/plans/:id", admin_controller_1.updatePlan);
router.delete("/plans/:id", admin_controller_1.deletePlan);
// Dominios
router.get("/domains", admin_controller_1.getAllDomains);
router.delete("/domains/:id", admin_controller_1.deleteDomainAdmin);
// Tickets
router.delete("/tickets/:id", admin_controller_1.deleteTicket);
// Facturas
router.get("/invoices", admin_controller_1.getAllInvoices);
// Suscripciones
router.get("/subscriptions", admin_controller_1.getAllSubscriptions);
router.delete("/subscriptions/:id", admin_controller_1.cancelSubscriptionAdmin);
// Cuentas de email
router.get("/email-accounts", admin_controller_1.getAllEmailAccounts);
router.delete("/email-accounts/:id", admin_controller_1.deleteEmailAccountAdmin);
// Códigos promocionales
router.get("/promo-codes", admin_controller_1.getAllPromoCodes);
router.post("/promo-codes", admin_controller_1.createPromoCode);
router.put("/promo-codes/:id", admin_controller_1.updatePromoCode);
router.delete("/promo-codes/:id", admin_controller_1.deletePromoCode);
// Log para verificar las rutas de admin
console.log("✅ Rutas de admin registradas:");
console.log("  - GET /api/admin/subscriptions");
console.log("  - DELETE /api/admin/subscriptions/:id");
console.log("  - DELETE /api/admin/tickets/:id");
console.log("  - DELETE /api/admin/domains/:id");
console.log("  - DELETE /api/admin/email-accounts/:id");
console.log("  - GET /api/admin/promo-codes");
console.log("  - POST /api/admin/promo-codes");
console.log("  - PUT /api/admin/promo-codes/:id");
console.log("  - DELETE /api/admin/promo-codes/:id");
exports.default = router;
