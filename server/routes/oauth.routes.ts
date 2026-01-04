import { Router } from "express";
import {
  registerApplication,
  listApplications,
  authorize,
  token,
  userInfo,
} from "../controllers/oauth.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

// Rutas que requieren autenticación (para desarrolladores)
router.post("/register", authMiddleware, registerApplication);
router.get("/applications", authMiddleware, listApplications);

// Rutas públicas OAuth 2.0
router.get("/authorize", authorize);
router.post("/token", token);
router.get("/userinfo", userInfo);

export default router;

