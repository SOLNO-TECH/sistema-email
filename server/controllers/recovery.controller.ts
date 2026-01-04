import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Enviar código de verificación por SMS
export async function sendPhoneVerificationCode(req: any, res: Response) {
  try {
    const user = req.user;
    const { phone, countryCode } = req.body;

    if (!phone || !countryCode) {
      return res.status(400).json({ error: "Teléfono y código de país son requeridos" });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar código en las preferencias del usuario (temporal, expira en 10 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true },
    });

    const preferences = userData?.preferences ? JSON.parse(userData.preferences) : {};
    preferences.phoneVerificationCode = code;
    preferences.phoneVerificationCodeExpiresAt = expiresAt.toISOString();
    preferences.verificationPhone = `${countryCode}${phone}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: JSON.stringify(preferences),
      },
    });

    // TODO: En producción, integrar con un servicio de SMS real (Twilio, AWS SNS, etc.)
    // Por ahora, simulamos el envío
    console.log(`📱 [SMS] Código de verificación para ${countryCode}${phone}: ${code}`);
    console.log(`⏰ Expira en: ${expiresAt.toISOString()}`);

    res.json({
      message: "Código de verificación enviado",
      // En desarrollo, devolvemos el código para facilitar pruebas
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (error: any) {
    console.error("Error sending phone verification code:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
}

// Verificar código de teléfono
export async function verifyPhoneCode(req: any, res: Response) {
  try {
    const user = req.user;
    const { phone, countryCode, code } = req.body;

    if (!phone || !countryCode || !code) {
      return res.status(400).json({ error: "Teléfono, código de país y código de verificación son requeridos" });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true },
    });

    if (!userData || !userData.preferences) {
      return res.status(400).json({ error: "No hay código de verificación pendiente" });
    }

    const preferences = JSON.parse(userData.preferences);
    const storedCode = preferences.phoneVerificationCode;
    const expiresAt = preferences.phoneVerificationCodeExpiresAt;

    if (!storedCode || !expiresAt) {
      return res.status(400).json({ error: "No hay código de verificación pendiente" });
    }

    if (new Date(expiresAt) < new Date()) {
      return res.status(400).json({ error: "El código de verificación ha expirado" });
    }

    if (storedCode !== code) {
      return res.status(400).json({ error: "Código de verificación incorrecto" });
    }

    // Código válido, limpiar de las preferencias
    delete preferences.phoneVerificationCode;
    delete preferences.phoneVerificationCodeExpiresAt;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: JSON.stringify(preferences),
      },
    });

    res.json({
      message: "Teléfono verificado exitosamente",
      verified: true,
    });
  } catch (error: any) {
    console.error("Error verifying phone code:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
}

