import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import validator from "validator";

/**
 * Rate limiting para prevenir ataques de fuerza bruta
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP
  message: "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 requests por minuto
  message: "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 emails por minuto
  message: "Demasiados emails enviados. Intenta de nuevo en un minuto.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sanitiza strings para prevenir XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return validator.escape(input.trim());
}

/**
 * Sanitiza email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";
  const trimmed = email.trim().toLowerCase();
  return validator.isEmail(trimmed) ? trimmed : "";
}

/**
 * Valida y sanitiza número entero
 */
export function sanitizeInt(input: any): number | null {
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
export function sanitizeFloat(input: any): number | null {
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
export function sanitizeHTML(html: string): string {
  if (typeof html !== "string") return "";
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
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string") {
        // No sanitizar campos que deben contener HTML (como mensajes de email)
        if (key === "message" || key === "htmlBody" || key === "body" || key === "description") {
          sanitized[key] = sanitizeHTML(value);
        } else if (key === "email" || key.includes("email")) {
          sanitized[key] = sanitizeEmail(value);
        } else {
          sanitized[key] = sanitizeString(value);
        }
      } else if (typeof value === "number") {
        sanitized[key] = value;
      } else {
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
export function sanitizeQuery(req: Request, res: Response, next: NextFunction) {
  if (req.query && typeof req.query === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        sanitized[key] = sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }
    req.query = sanitized;
  }
  next();
}

