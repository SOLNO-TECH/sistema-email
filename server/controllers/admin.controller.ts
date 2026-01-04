import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashPassword } from "../src/utils/hash";

// Obtener todos los usuarios con información completa
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      include: {
        Domain: {
          select: {
            id: true,
            domainName: true,
            dnsVerified: true,
            createdAt: true,
          },
        },
        EmailAccounts: {
          select: {
            id: true,
            address: true,
            storageUsed: true,
            createdAt: true,
          },
        },
        subscriptions: {
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
        invoices: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            Domain: true,
            EmailAccounts: true,
            subscriptions: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ users });
  } catch (error: any) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener un usuario específico por ID
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Domain: {
          include: {
            emailAccounts: {
              select: {
                id: true,
                address: true,
                storageUsed: true,
                createdAt: true,
              },
            },
          },
        },
        EmailAccounts: {
          select: {
            id: true,
            address: true,
            storageUsed: true,
            createdAt: true,
            domain: {
              select: {
                domainName: true,
              },
            },
          },
        },
        subscriptions: {
          include: {
            Plan: {
              select: {
                name: true,
                description: true,
                priceMonthly: true,
                priceYearly: true,
                maxEmails: true,
                maxStorageGB: true,
                maxDomains: true,
              },
            },
          },
          orderBy: {
            startDate: "desc",
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            Domain: true,
            EmailAccounts: true,
            subscriptions: true,
            invoices: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Actualizar usuario (cambiar rol, nombre, etc.)
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const userId = parseInt(id);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      if (role !== "user" && role !== "admin") {
        return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
      }
      updateData.role = role;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Cambiar contraseña de un usuario
export async function updateUserPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = parseInt(id);

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Eliminar usuario
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // No permitir eliminar al propio admin
    const currentUser = (req as any).user;
    if (currentUser.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error.code === "P2003") {
      return res.status(400).json({ error: "Cannot delete user with associated data" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener estadísticas generales del sistema
export async function getSystemStats(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalDomains,
      totalEmailAccounts,
      totalSubscriptions,
      totalInvoices,
      totalTickets,
      totalPlans,
      activeSubscriptions,
      totalEmails,
      totalStorageUsed,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.domain.count(),
      prisma.emailAccount.count(),
      prisma.subscription.count(),
      prisma.invoice.count(),
      prisma.ticket.count(),
      prisma.plan.count(),
      prisma.subscription.count({
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      }),
      prisma.email.count(),
      prisma.emailAccount.aggregate({
        _sum: { storageUsed: true },
      }),
    ]);

    // Obtener tickets por estado
    const ticketsByStatus = await Promise.all([
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.ticket.count({ where: { status: "in_progress" } }),
      prisma.ticket.count({ where: { status: "resolved" } }),
      prisma.ticket.count({ where: { status: "closed" } }),
    ]);

    // Obtener usuarios nuevos en los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLastMonth = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalRegularUsers: totalUsers - totalAdmins,
        totalDomains,
        totalEmailAccounts,
        totalSubscriptions,
        activeSubscriptions,
        totalInvoices,
        totalTickets,
        totalPlans,
        totalEmails,
        totalStorageUsed: totalStorageUsed._sum.storageUsed || 0,
        newUsersLastMonth,
        ticketsByStatus: {
          open: ticketsByStatus[0],
          inProgress: ticketsByStatus[1],
          resolved: ticketsByStatus[2],
          closed: ticketsByStatus[3],
        },
      },
    });
  } catch (error: any) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener todos los planes (para admin)
export async function getAllPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { priceMonthly: "asc" },
    });

    res.json({ plans });
  } catch (error: any) {
    console.error("Error getting plans:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Crear plan
export async function createPlan(req: Request, res: Response) {
  try {
    const { name, description, priceMonthly, priceYearly, maxEmails, maxStorageGB, maxDomains, category, features, isActive } =
      req.body;

    if (!name || !priceMonthly || !priceYearly) {
      return res.status(400).json({ error: "Name, monthly price, and yearly price are required" });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        maxEmails: parseInt(maxEmails) || 1,
        maxStorageGB: parseInt(maxStorageGB) || 1,
        maxDomains: parseInt(maxDomains) || 1,
        category: category || "personas",
        features: features ? JSON.stringify(features) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ plan });
  } catch (error: any) {
    console.error("Error creating plan:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Actualizar plan
export async function updatePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, priceMonthly, priceYearly, maxEmails, maxStorageGB, maxDomains, category, features, isActive } =
      req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priceMonthly !== undefined) updateData.priceMonthly = parseFloat(priceMonthly);
    if (priceYearly !== undefined) updateData.priceYearly = parseFloat(priceYearly);
    if (maxEmails !== undefined) updateData.maxEmails = parseInt(maxEmails);
    if (maxStorageGB !== undefined) updateData.maxStorageGB = parseInt(maxStorageGB);
    if (maxDomains !== undefined) updateData.maxDomains = parseInt(maxDomains);
    if (category !== undefined) updateData.category = category;
    if (features !== undefined) updateData.features = features ? JSON.stringify(features) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.plan.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ plan });
  } catch (error: any) {
    console.error("Error updating plan:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Plan not found" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Eliminar plan
export async function deletePlan(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar si tiene suscripciones
    const subscriptionsCount = await prisma.subscription.count({
      where: { planId: parseInt(id) },
    });

    if (subscriptionsCount > 0) {
      return res.status(400).json({
        error: "Cannot delete plan with active subscriptions",
        subscriptionsCount,
      });
    }

    await prisma.plan.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Plan deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting plan:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Plan not found" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener todos los dominios (para admin)
export async function getAllDomains(req: Request, res: Response) {
  try {
    const domains = await prisma.domain.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { emailAccounts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ domains });
  } catch (error: any) {
    console.error("Error getting domains:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener todas las facturas (para admin)
export async function getAllInvoices(req: Request, res: Response) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      orderBy: { createdAt: "desc" },
      take: 100, // Limitar a las últimas 100
    });

    res.json({ invoices });
  } catch (error: any) {
    console.error("Error getting invoices:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener todas las cuentas de email (para admin)
export async function getAllEmailAccounts(req: Request, res: Response) {
  try {
    const emailAccounts = await prisma.emailAccount.findMany({
      include: {
        domain: {
          select: {
            id: true,
            domainName: true,
            dnsVerified: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { emails: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limitar a las últimas 100
    });

    res.json({ emailAccounts });
  } catch (error: any) {
    console.error("Error getting email accounts:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Eliminar ticket (para admin)
export async function deleteTicket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    // Verificar que existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Eliminar ticket (los attachments y messages se eliminan en cascada)
    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    res.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Eliminar dominio (para admin - sin verificación de propiedad)
export async function deleteDomainAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const domainId = parseInt(id);

    // Verificar que existe
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        emailAccounts: true,
      },
    });

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }

    // Verificar si tiene cuentas de correo asociadas
    if (domain.emailAccounts.length > 0) {
      return res.status(400).json({
        error: "No se puede eliminar el dominio porque tiene cuentas de correo asociadas",
        emailAccountsCount: domain.emailAccounts.length,
      });
    }

    // Eliminar dominio
    await prisma.domain.delete({
      where: { id: domainId },
    });

    res.json({ message: "Domain deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting domain:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Eliminar cuenta de email (para admin - sin verificación de propiedad)
export async function deleteEmailAccountAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const accountId = parseInt(id);

    // Verificar que existe
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
      include: {
        domain: true,
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Email account not found" });
    }

    // Importar el servicio SMTP para eliminar el usuario SMTP
    const SmtpUserService = (await import("../services/smtp-user.service")).default;

    // Eliminar usuario SMTP automáticamente
    console.log(`🗑️ Eliminando usuario SMTP para: ${account.address}`);
    await SmtpUserService.deleteSmtpUser(account.address, account.domain.domainName);

    // Eliminar cuenta
    await prisma.emailAccount.delete({
      where: { id: accountId },
    });

    res.json({ message: "Email account deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting email account:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Obtener todas las suscripciones (para admin)
export async function getAllSubscriptions(req: Request, res: Response) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Plan: {
          select: {
            id: true,
            name: true,
            description: true,
            priceMonthly: true,
            priceYearly: true,
            maxEmails: true,
            maxStorageGB: true,
            maxDomains: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    res.json({ subscriptions });
  } catch (error: any) {
    console.error("Error getting subscriptions:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Cancelar/Eliminar suscripción (para admin)
export async function cancelSubscriptionAdmin(req: any, res: Response) {
  try {
    const { id } = req.params;
    const subscriptionId = parseInt(id);

    // Verificar que existe
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    // Cancelar la suscripción estableciendo la fecha de fin a hoy
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: new Date(), // Cancelar inmediatamente
      },
    });

    res.json({ 
      message: "Suscripción cancelada exitosamente",
      subscription: {
        id: subscription.id,
        user: subscription.user,
      }
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
}

// Obtener todos los códigos promocionales
export async function getAllPromoCodes(req: Request, res: Response) {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ promoCodes });
  } catch (error: any) {
    console.error("Error getting promo codes:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// Crear código promocional
export async function createPromoCode(req: any, res: Response) {
  try {
    const adminId = req.user.id;
    const { code, description, discountType, discountValue, maxUses, validFrom, validUntil } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: "code, discountType, and discountValue are required" });
    }

    if (discountType !== "fixed" && discountType !== "percentage") {
      return res.status(400).json({ error: "discountType must be 'fixed' or 'percentage'" });
    }

    if (discountValue <= 0) {
      return res.status(400).json({ error: "discountValue must be greater than 0" });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({ error: "percentage discount cannot exceed 100%" });
    }

    // Verificar que el código no exista
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return res.status(400).json({ error: "Este código promocional ya existe" });
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType,
        discountValue,
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        createdBy: adminId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ promoCode });
  } catch (error: any) {
    console.error("Error creating promo code:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Este código promocional ya existe" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Actualizar código promocional
export async function updatePromoCode(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { description, discountType, discountValue, maxUses, validFrom, validUntil, isActive } = req.body;

    const promoCode = await prisma.promoCode.findUnique({
      where: { id: parseInt(id) },
    });

    if (!promoCode) {
      return res.status(404).json({ error: "Código promocional no encontrado" });
    }

    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) {
      if (discountType !== "fixed" && discountType !== "percentage") {
        return res.status(400).json({ error: "discountType must be 'fixed' or 'percentage'" });
      }
      updateData.discountType = discountType;
    }
    if (discountValue !== undefined) {
      if (discountValue <= 0) {
        return res.status(400).json({ error: "discountValue must be greater than 0" });
      }
      if (updateData.discountType === "percentage" && discountValue > 100) {
        return res.status(400).json({ error: "percentage discount cannot exceed 100%" });
      }
      updateData.discountValue = discountValue;
    }
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.promoCode.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ promoCode: updated });
  } catch (error: any) {
    console.error("Error updating promo code:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Código promocional no encontrado" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Eliminar código promocional
export async function deletePromoCode(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.promoCode.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Código promocional eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error deleting promo code:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Código promocional no encontrado" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

