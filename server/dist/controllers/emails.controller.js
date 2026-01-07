"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.getEmails = void 0;
const email_service_1 = __importDefault(require("../services/email.service"));
const getEmails = (req, res) => {
    const emails = email_service_1.default.getAll();
    res.json(emails);
};
exports.getEmails = getEmails;
const sendEmail = (req, res) => {
    try {
        const { to, subject, message } = req.body;
        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son requeridos",
            });
        }
        const result = email_service_1.default.send(to, subject, message);
        res.json({
            success: true,
            message: "Correo enviado exitosamente",
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al enviar el correo",
        });
    }
};
exports.sendEmail = sendEmail;
