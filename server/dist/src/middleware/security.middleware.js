"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRateLimiter = exports.apiRateLimiter = exports.authRateLimiter = void 0;
exports.sanitizeString = sanitizeString;
exports.sanitizeEmail = sanitizeEmail;
exports.sanitizeInt = sanitizeInt;
exports.sanitizeFloat = sanitizeFloat;
exports.sanitizeHTML = sanitizeHTML;
exports.sanitizeBody = sanitizeBody;
exports.sanitizeQuery = sanitizeQuery;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const validator_1 = __importDefault(require("validator"));
/**
 * Rate limiting para prevenir ataques de fuerza bruta
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 intentos por IP
    message: "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.",
    standardHeaders: true,
    legacyHeaders: false,
});
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // Máximo 100 requests por minuto
    message: "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
    standardHeaders: true,
    legacyHeaders: false,
});
exports.emailRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // Máximo 10 emails por minuto
    message: "Demasiados emails enviados. Intenta de nuevo en un minuto.",
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Sanitiza strings para prevenir XSS
 */
function sanitizeString(input) {
    if (typeof input !== "string")
        return "";
    return validator_1.default.escape(input.trim());
}
/**
 * Sanitiza email
 */
function sanitizeEmail(email) {
    if (typeof email !== "string")
        return "";
    const trimmed = email.trim().toLowerCase();
    return validator_1.default.isEmail(trimmed) ? trimmed : "";
}
/**
 * Valida y sanitiza número entero
 */
function sanitizeInt(input) {
    if (typeof input === "number") {
        return Number.isInteger(input) ? input : null;
    }
    if (typeof input === "string") {
        const parsed = parseInt(input, 10);
        return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
    }
    return null;
}
/**
 * Valida y sanitiza número flotante
 */
function sanitizeFloat(input) {
    if (typeof input === "number") {
        return isFinite(input) ? input : null;
    }
    if (typeof input === "string") {
        const parsed = parseFloat(input);
        return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
    }
    return null;
}
/**
 * Sanitiza HTML (remueve scripts y tags peligrosos)
 */
function sanitizeHTML(html) {
    if (typeof html !== "string")
        return "";
    // Remover scripts y eventos peligrosos
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/data:text\/html/gi, "");
}
/**
 * Middleware para sanitizar body
 */
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === "object") {
        const sanitized = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === "string") {
                // No sanitizar campos que deben contener HTML (como mensajes de email)
                if (key === "message" || key === "htmlBody" || key === "body" || key === "description") {
                    sanitized[key] = sanitizeHTML(value);
                }
                else if (key === "email" || key.includes("email")) {
                    sanitized[key] = sanitizeEmail(value);
                }
                else {
                    sanitized[key] = sanitizeString(value);
                }
            }
            else if (typeof value === "number") {
                sanitized[key] = value;
            }
            else {
                sanitized[key] = value;
            }
        }
        req.body = sanitized;
    }
    next();
}
/**
 * Middleware para sanitizar query params
 */
function sanitizeQuery(req, res, next) {
    if (req.query && typeof req.query === "object") {
        const sanitized = {};
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === "string") {
                sanitized[key] = sanitizeString(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        req.query = sanitized;
    }
    next();
}
