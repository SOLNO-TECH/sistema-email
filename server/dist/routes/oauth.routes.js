"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const router = (0, express_1.Router)();
// Rutas que requieren autenticación (para desarrolladores)
router.post("/register", auth_middleware_1.authMiddleware, oauth_controller_1.registerApplication);
router.get("/applications", auth_middleware_1.authMiddleware, oauth_controller_1.listApplications);
// Rutas públicas OAuth 2.0
router.get("/authorize", oauth_controller_1.authorize);
router.post("/token", oauth_controller_1.token);
router.get("/userinfo", oauth_controller_1.userInfo);
exports.default = router;
