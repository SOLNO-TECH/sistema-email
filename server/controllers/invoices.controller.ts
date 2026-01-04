import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Obtener facturas del usuario
export async function getUserInvoices(req: any, res: Response) {
  try {
    const user = req.user;
    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        subscription: {
          include: {
            Plan: {
              select: {
                name: true,
                priceMonthly: true,
                priceYearly: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(invoices);
  } catch (err) {
    console.error("Get user invoices error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

