import { Router } from "express";
import { authMiddleware } from "../src/middleware/auth.middleware";
import { uploadMultiple } from "../src/middleware/upload.middleware";
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  updateTicketStatus,
  getTicketMessages,
  sendTicketMessage,
} from "../controllers/tickets.controller";

const router = Router();

router.use(authMiddleware);

// Crear ticket con soporte para archivos adjuntos
router.post("/", uploadMultiple, (req, res, next) => {
  createTicket(req as any, res).catch(next);
});

// Rutas específicas primero (deben ir antes de las genéricas)
router.get("/all", getAllTickets);
router.get("/:ticketId/messages", getTicketMessages);
router.post("/:ticketId/messages", sendTicketMessage);
router.put("/:id/status", updateTicketStatus);
// Rutas genéricas al final
router.get("/", getUserTickets);

console.log("✅ Tickets routes loaded");
console.log("  - GET /api/tickets/all");
console.log("  - GET /api/tickets/:ticketId/messages");
console.log("  - POST /api/tickets/:ticketId/messages");
console.log("  - PUT /api/tickets/:id/status");
console.log("  - GET /api/tickets");

export default router;

