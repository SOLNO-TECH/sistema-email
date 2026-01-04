import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Listar todos los planes disponibles
export async function listPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });

    res.json(plans);
  } catch (err) {
    console.error("List plans error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener un plan específico
export async function getPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(plan);
  } catch (err) {
    console.error("Get plan error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener el plan actual del usuario
export async function getCurrentPlan(req: any, res: Response) {
  try {
    const user = req.user;
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        Plan: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!subscription || !subscription.Plan) {
      return res.json({ plan: null, subscription: null });
    }

    res.json({
      plan: subscription.Plan,
      subscription: {
        id: subscription.id,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (err) {
    console.error("Get current plan error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener límites del usuario
export async function getUserLimits(req: any, res: Response) {
  try {
    const user = req.user;
    const { SubscriptionService } = await import("../services/subscription.service");
    const limits = await SubscriptionService.getUserLimits(user.id);
    res.json(limits);
  } catch (err) {
    console.error("Get user limits error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

