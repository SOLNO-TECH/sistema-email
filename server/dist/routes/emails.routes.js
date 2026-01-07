"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emails_controller_1 = require("../controllers/emails.controller");
const router = (0, express_1.Router)();
router.get("/", emails_controller_1.getEmails);
router.post("/send", emails_controller_1.sendEmail);
exports.default = router;
