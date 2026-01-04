import { Router } from "express";
import { addDomain, listDomains, verifyDomain, updateDomainSmtp, deleteDomain } from "../controllers/domains.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const r = Router();
r.post("/", authMiddleware, addDomain);
r.get("/", authMiddleware, listDomains);
r.post("/:id/verify", authMiddleware, verifyDomain);
r.put("/:id/smtp", authMiddleware, updateDomainSmtp);
r.delete("/:id", authMiddleware, deleteDomain);

export default r;
