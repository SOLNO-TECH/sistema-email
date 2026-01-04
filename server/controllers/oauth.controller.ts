import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../src/utils/hash";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "dev_secret") {
  console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurado o usa el valor por defecto inseguro.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }
}

// Generar client_id y client_secret
function generateClientId(): string {
  return `xstar_${crypto.randomBytes(16).toString("hex")}`;
}

function generateClientSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateAuthCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Registrar una nueva aplicación OAuth
export async function registerApplication(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, description, website, redirectUris } = req.body;

    if (!name || !redirectUris) {
      return res.status(400).json({ error: "Name and redirectUris are required" });
    }

    // Validar que redirectUris sea un array
    let redirectUrisArray: string[];
    try {
      redirectUrisArray = Array.isArray(redirectUris) ? redirectUris : JSON.parse(redirectUris);
    } catch {
      return res.status(400).json({ error: "redirectUris must be a valid JSON array" });
    }

    if (redirectUrisArray.length === 0) {
      return res.status(400).json({ error: "At least one redirect URI is required" });
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const hashedSecret = await hashPassword(clientSecret);

    const application = await prisma.oAuthApplication.create({
      data: {
        name,
        description: description || null,
        website: website || null,
        clientId,
        clientSecret: hashedSecret,
        redirectUris: JSON.stringify(redirectUrisArray),
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        clientId: true,
        clientSecret: false, // No devolver el secret hasheado
        redirectUris: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Devolver el clientSecret solo una vez (en la creación)
    res.json({
      ...application,
      clientSecret, // Devolver el secret en texto plano solo en la creación
      redirectUris: redirectUrisArray,
    });
  } catch (error: any) {
    console.error("Error registering OAuth application:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}

// Listar aplicaciones del usuario
export async function listApplications(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const applications = await prisma.oAuthApplication.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        clientId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(applications);
  } catch (error: any) {
    console.error("Error listing OAuth applications:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}

// Endpoint de autorización (inicia el flujo OAuth)
export async function authorize(req: Request, res: Response) {
  try {
    const { client_id, redirect_uri, response_type, state, scope } = req.query;

    if (!client_id || !redirect_uri || !response_type) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    if (response_type !== "code") {
      return res.status(400).json({ error: "Only 'code' response_type is supported" });
    }

    // Verificar que la aplicación existe y está activa
    const application = await prisma.oAuthApplication.findUnique({
      where: { clientId: client_id as string },
    });

    if (!application || !application.isActive) {
      return res.status(400).json({ error: "Invalid client_id" });
    }

    // Verificar que el redirect_uri está permitido
    const allowedUris: string[] = JSON.parse(application.redirectUris);
    if (!allowedUris.includes(redirect_uri as string)) {
      return res.status(400).json({ error: "Invalid redirect_uri" });
    }

    // Si el usuario no está autenticado, redirigir al login
    // En producción, esto debería ser una página de login dedicada
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Redirigir a la página de login con los parámetros OAuth
      const loginUrl = `/auth?oauth=true&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri as string)}&state=${state || ""}`;
      return res.redirect(loginUrl);
    }

    // Si está autenticado, generar código de autorización
    const token = authHeader.replace("Bearer ", "");
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Generar código de autorización
      const code = generateAuthCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expira en 10 minutos

      await prisma.oAuthAuthCode.create({
        data: {
          code,
          applicationId: application.id,
          userId: user.id,
          redirectUri: redirect_uri as string,
          expiresAt,
        },
      });

      // Redirigir con el código
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set("code", code);
      if (state) redirectUrl.searchParams.set("state", state as string);

      return res.redirect(redirectUrl.toString());
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error: any) {
    console.error("Error in authorize:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}

// Intercambiar código por token
export async function token(req: Request, res: Response) {
  try {
    const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "Only 'authorization_code' grant_type is supported" });
    }

    if (!code || !client_id || !client_secret || !redirect_uri) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Verificar aplicación
    const application = await prisma.oAuthApplication.findUnique({
      where: { clientId: client_id },
    });

    if (!application || !application.isActive) {
      return res.status(400).json({ error: "Invalid client_id" });
    }

    // Verificar client_secret
    const secretValid = await comparePassword(client_secret, application.clientSecret);
    if (!secretValid) {
      return res.status(401).json({ error: "Invalid client_secret" });
    }

    // Verificar código de autorización
    const authCode = await prisma.oAuthAuthCode.findUnique({
      where: { code },
      include: { user: true, application: true },
    });

    if (!authCode) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (authCode.used) {
      return res.status(400).json({ error: "Code already used" });
    }

    if (authCode.expiresAt < new Date()) {
      return res.status(400).json({ error: "Code expired" });
    }

    if (authCode.applicationId !== application.id) {
      return res.status(400).json({ error: "Code does not belong to this application" });
    }

    if (authCode.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: "Invalid redirect_uri" });
    }

    // Marcar código como usado
    await prisma.oAuthAuthCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    // Generar tokens
    const accessToken = generateAccessToken();
    const refreshToken = generateAccessToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expira en 1 hora

    await prisma.oAuthAccessToken.create({
      data: {
        token: accessToken,
        refreshToken,
        applicationId: application.id,
        userId: authCode.userId,
        expiresAt,
      },
    });

    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600, // 1 hora en segundos
      refresh_token: refreshToken,
    });
  } catch (error: any) {
    console.error("Error in token exchange:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}

// Obtener información del usuario autenticado
export async function userInfo(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Buscar token en la base de datos
    const accessToken = await prisma.oAuthAccessToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!accessToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (accessToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Token expired" });
    }

    // Devolver información del usuario (solo campos públicos)
    res.json({
      id: accessToken.user.id,
      email: accessToken.user.email,
      name: accessToken.user.name,
    });
  } catch (error: any) {
    console.error("Error in userInfo:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}

