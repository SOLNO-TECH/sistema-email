"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const upload_middleware_1 = require("../src/middleware/upload.middleware");
const tickets_controller_1 = require("../controllers/tickets.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Crear ticket con soporte para archivos adjuntos
router.post("/", upload_middleware_1.uploadMultiple, (req, res, next) => {
    (0, tickets_controller_1.createTicket)(req, res).catch(next);
});
// Rutas específicas primero (deben ir antes de las genéricas)
router.get("/all", tickets_controller_1.getAllTickets);
router.get("/:ticketId/messages", tickets_controller_1.getTicketMessages);
router.post("/:ticketId/messages", tickets_controller_1.sendTicketMessage);
router.put("/:id/status", tickets_controller_1.updateTicketStatus);
// Rutas genéricas al final
router.get("/", tickets_controller_1.getUserTickets);
console.log("✅ Tickets routes loaded");
console.log("  - GET /api/tickets/all");
console.log("  - GET /api/tickets/:ticketId/messages");
console.log("  - POST /api/tickets/:ticketId/messages");
console.log("  - PUT /api/tickets/:id/status");
console.log("  - GET /api/tickets");
exports.default = router;
