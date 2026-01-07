"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoices_controller_1 = require("../controllers/invoices.controller");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.authMiddleware, invoices_controller_1.getUserInvoices);
exports.default = router;
