import { Router } from "express";
import { authMiddleware } from "../src/middleware/auth.middleware";
import { adminMiddleware } from "../src/middleware/admin.middleware";
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  deleteUser,
  getSystemStats,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getAllDomains,
  getAllInvoices,
  getAllEmailAccounts,
  getAllSubscriptions,
  cancelSubscriptionAdmin,
  deleteTicket,
  deleteDomainAdmin,
  deleteEmailAccountAdmin,
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "../controllers/admin.controller";

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Estadísticas del sistema
router.get("/stats", getSystemStats);

// Usuarios
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.put("/users/:id/password", updateUserPassword);
router.delete("/users/:id", deleteUser);

// Planes
router.get("/plans", getAllPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// Dominios
router.get("/domains", getAllDomains);
router.delete("/domains/:id", deleteDomainAdmin);

// Tickets
router.delete("/tickets/:id", deleteTicket);

// Facturas
router.get("/invoices", getAllInvoices);

// Suscripciones
router.get("/subscriptions", getAllSubscriptions);
router.delete("/subscriptions/:id", cancelSubscriptionAdmin);

// Cuentas de email
router.get("/email-accounts", getAllEmailAccounts);
router.delete("/email-accounts/:id", deleteEmailAccountAdmin);

// Códigos promocionales
router.get("/promo-codes", getAllPromoCodes);
router.post("/promo-codes", createPromoCode);
router.put("/promo-codes/:id", updatePromoCode);
router.delete("/promo-codes/:id", deletePromoCode);

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

export default router;

