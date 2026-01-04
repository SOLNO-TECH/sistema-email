import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "dev_secret") {
  console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurado o usa el valor por defecto inseguro.");
  console.error("   Por favor, configura JWT_SECRET en tu archivo .env con un valor seguro y aleatorio.");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

export interface AuthRequest extends Request {
  user?: any;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!JWT_SECRET || JWT_SECRET === "dev_secret") {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token" });
    const token = header.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Attach user minimal data - asegurarse de incluir el campo role
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        createdAt: true,
      }
    });
    if (!user) return res.status(401).json({ error: "User not found" });
    // No loguear información sensible en producción
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Middleware - User authenticated:", user.id, user.email);
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
