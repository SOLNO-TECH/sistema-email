import { Request, Response } from "express";
import EmailService from "../services/email.service";

export const getEmails = (req: Request, res: Response) => {
  const emails = EmailService.getAll();
  res.json(emails);
};

export const sendEmail = (req: Request, res: Response) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      });
    }

    const result = EmailService.send(to, subject, message);

    res.json({
      success: true,
      message: "Correo enviado exitosamente",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al enviar el correo",
    });
  }
};
