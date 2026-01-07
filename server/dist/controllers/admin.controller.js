"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.updateUserPassword = updateUserPassword;
exports.deleteUser = deleteUser;
exports.getSystemStats = getSystemStats;
exports.getAllPlans = getAllPlans;
exports.createPlan = createPlan;
exports.updatePlan = updatePlan;
exports.deletePlan = deletePlan;
exports.getAllDomains = getAllDomains;
exports.getAllInvoices = getAllInvoices;
exports.getAllEmailAccounts = getAllEmailAccounts;
exports.deleteTicket = deleteTicket;
exports.deleteDomainAdmin = deleteDomainAdmin;
exports.deleteEmailAccountAdmin = deleteEmailAccountAdmin;
exports.getAllSubscriptions = getAllSubscriptions;
exports.cancelSubscriptionAdmin = cancelSubscriptionAdmin;
exports.getAllPromoCodes = getAllPromoCodes;
exports.createPromoCode = createPromoCode;
exports.updatePromoCode = updatePromoCode;
exports.deletePromoCode = deletePromoCode;
const prisma_1 = __importDefault(require("../lib/prisma"));
const hash_1 = require("../src/utils/hash");
// Obtener todos los usuarios con información completa
async function getAllUsers(req, res) {
    try {
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener un usuario específico por ID
async function getUserById(req, res) {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        const user = await prisma_1.default.user.findUnique({
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
    }
    catch (error) {
        console.error("Error getting user:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Actualizar usuario (cambiar rol, nombre, etc.)
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;
        const userId = parseInt(id);
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (role !== undefined) {
            if (role !== "user" && role !== "admin") {
                return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
            }
            updateData.role = role;
        }
        const user = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error("Error updating user:", error);
        if (error.code === "P2002") {
            return res.status(409).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
// Cambiar contraseña de un usuario
async function updateUserPassword(req, res) {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const userId = parseInt(id);
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        const hashedPassword = await (0, hash_1.hashPassword)(password);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar usuario
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        // No permitir eliminar al propio admin
        const currentUser = req.user;
        if (currentUser.id === userId) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }
        await prisma_1.default.user.delete({
            where: { id: userId },
        });
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        if (error.code === "P2003") {
            return res.status(400).json({ error: "Cannot delete user with associated data" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener estadísticas generales del sistema
async function getSystemStats(req, res) {
    try {
        const [totalUsers, totalAdmins, totalDomains, totalEmailAccounts, totalSubscriptions, totalInvoices, totalTickets, totalPlans, activeSubscriptions, totalEmails, totalStorageUsed,] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { role: "admin" } }),
            prisma_1.default.domain.count(),
            prisma_1.default.emailAccount.count(),
            prisma_1.default.subscription.count(),
            prisma_1.default.invoice.count(),
            prisma_1.default.ticket.count(),
            prisma_1.default.plan.count(),
            prisma_1.default.subscription.count({
                where: {
                    OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
                },
            }),
            prisma_1.default.email.count(),
            prisma_1.default.emailAccount.aggregate({
                _sum: { storageUsed: true },
            }),
        ]);
        // Obtener tickets por estado
        const ticketsByStatus = await Promise.all([
            prisma_1.default.ticket.count({ where: { status: "open" } }),
            prisma_1.default.ticket.count({ where: { status: "in_progress" } }),
            prisma_1.default.ticket.count({ where: { status: "resolved" } }),
            prisma_1.default.ticket.count({ where: { status: "closed" } }),
        ]);
        // Obtener usuarios nuevos en los últimos 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsersLastMonth = await prisma_1.default.user.count({
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
    }
    catch (error) {
        console.error("Error getting stats:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener todos los planes (para admin)
async function getAllPlans(req, res) {
    try {
        const plans = await prisma_1.default.plan.findMany({
            include: {
                _count: {
                    select: { subscriptions: true },
                },
            },
            orderBy: { priceMonthly: "asc" },
        });
        res.json({ plans });
    }
    catch (error) {
        console.error("Error getting plans:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Crear plan
async function createPlan(req, res) {
    try {
        const { name, description, priceMonthly, priceYearly, maxEmails, maxStorageGB, maxDomains, category, features, isActive } = req.body;
        if (!name || !priceMonthly || !priceYearly) {
            return res.status(400).json({ error: "Name, monthly price, and yearly price are required" });
        }
        const plan = await prisma_1.default.plan.create({
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
    }
    catch (error) {
        console.error("Error creating plan:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Actualizar plan
async function updatePlan(req, res) {
    try {
        const { id } = req.params;
        const { name, description, priceMonthly, priceYearly, maxEmails, maxStorageGB, maxDomains, category, features, isActive } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (priceMonthly !== undefined)
            updateData.priceMonthly = parseFloat(priceMonthly);
        if (priceYearly !== undefined)
            updateData.priceYearly = parseFloat(priceYearly);
        if (maxEmails !== undefined)
            updateData.maxEmails = parseInt(maxEmails);
        if (maxStorageGB !== undefined)
            updateData.maxStorageGB = parseInt(maxStorageGB);
        if (maxDomains !== undefined)
            updateData.maxDomains = parseInt(maxDomains);
        if (category !== undefined)
            updateData.category = category;
        if (features !== undefined)
            updateData.features = features ? JSON.stringify(features) : null;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const plan = await prisma_1.default.plan.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
        res.json({ plan });
    }
    catch (error) {
        console.error("Error updating plan:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Plan not found" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar plan
async function deletePlan(req, res) {
    try {
        const { id } = req.params;
        // Verificar si tiene suscripciones
        const subscriptionsCount = await prisma_1.default.subscription.count({
            where: { planId: parseInt(id) },
        });
        if (subscriptionsCount > 0) {
            return res.status(400).json({
                error: "Cannot delete plan with active subscriptions",
                subscriptionsCount,
            });
        }
        await prisma_1.default.plan.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: "Plan deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting plan:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Plan not found" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener todos los dominios (para admin)
async function getAllDomains(req, res) {
    try {
        const domains = await prisma_1.default.domain.findMany({
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
    }
    catch (error) {
        console.error("Error getting domains:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener todas las facturas (para admin)
async function getAllInvoices(req, res) {
    try {
        const invoices = await prisma_1.default.invoice.findMany({
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
    }
    catch (error) {
        console.error("Error getting invoices:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener todas las cuentas de email (para admin)
async function getAllEmailAccounts(req, res) {
    try {
        const emailAccounts = await prisma_1.default.emailAccount.findMany({
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
    }
    catch (error) {
        console.error("Error getting email accounts:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar ticket (para admin)
async function deleteTicket(req, res) {
    try {
        const { id } = req.params;
        const ticketId = parseInt(id);
        // Verificar que existe
        const ticket = await prisma_1.default.ticket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        // Eliminar ticket (los attachments y messages se eliminan en cascada)
        await prisma_1.default.ticket.delete({
            where: { id: ticketId },
        });
        res.json({ message: "Ticket deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar dominio (para admin - sin verificación de propiedad)
async function deleteDomainAdmin(req, res) {
    try {
        const { id } = req.params;
        const domainId = parseInt(id);
        // Verificar que existe
        const domain = await prisma_1.default.domain.findUnique({
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
        await prisma_1.default.domain.delete({
            where: { id: domainId },
        });
        res.json({ message: "Domain deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting domain:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar cuenta de email (para admin - sin verificación de propiedad)
async function deleteEmailAccountAdmin(req, res) {
    try {
        const { id } = req.params;
        const accountId = parseInt(id);
        // Verificar que existe
        const account = await prisma_1.default.emailAccount.findUnique({
            where: { id: accountId },
            include: {
                domain: true,
            },
        });
        if (!account) {
            return res.status(404).json({ error: "Email account not found" });
        }
        // Importar el servicio SMTP para eliminar el usuario SMTP
        const SmtpUserService = (await Promise.resolve().then(() => __importStar(require("../services/smtp-user.service")))).default;
        // Eliminar usuario SMTP automáticamente
        console.log(`🗑️ Eliminando usuario SMTP para: ${account.address}`);
        await SmtpUserService.deleteSmtpUser(account.address, account.domain.domainName);
        // Eliminar cuenta
        await prisma_1.default.emailAccount.delete({
            where: { id: accountId },
        });
        res.json({ message: "Email account deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting email account:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener todas las suscripciones (para admin)
async function getAllSubscriptions(req, res) {
    try {
        const subscriptions = await prisma_1.default.subscription.findMany({
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
    }
    catch (error) {
        console.error("Error getting subscriptions:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Cancelar/Eliminar suscripción (para admin)
async function cancelSubscriptionAdmin(req, res) {
    try {
        const { id } = req.params;
        const subscriptionId = parseInt(id);
        // Verificar que existe
        const subscription = await prisma_1.default.subscription.findUnique({
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
        await prisma_1.default.subscription.update({
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
    }
    catch (error) {
        console.error("Error canceling subscription:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
}
// Obtener todos los códigos promocionales
async function getAllPromoCodes(req, res) {
    try {
        const promoCodes = await prisma_1.default.promoCode.findMany({
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
    }
    catch (error) {
        console.error("Error getting promo codes:", error);
        res.status(500).json({ error: "Server error" });
    }
}
// Crear código promocional
async function createPromoCode(req, res) {
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
        const existingCode = await prisma_1.default.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (existingCode) {
            return res.status(400).json({ error: "Este código promocional ya existe" });
        }
        const promoCode = await prisma_1.default.promoCode.create({
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
    }
    catch (error) {
        console.error("Error creating promo code:", error);
        if (error.code === "P2002") {
            return res.status(400).json({ error: "Este código promocional ya existe" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
// Actualizar código promocional
async function updatePromoCode(req, res) {
    try {
        const { id } = req.params;
        const { description, discountType, discountValue, maxUses, validFrom, validUntil, isActive } = req.body;
        const promoCode = await prisma_1.default.promoCode.findUnique({
            where: { id: parseInt(id) },
        });
        if (!promoCode) {
            return res.status(404).json({ error: "Código promocional no encontrado" });
        }
        const updateData = {};
        if (description !== undefined)
            updateData.description = description;
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
        if (maxUses !== undefined)
            updateData.maxUses = maxUses;
        if (validFrom !== undefined)
            updateData.validFrom = new Date(validFrom);
        if (validUntil !== undefined)
            updateData.validUntil = validUntil ? new Date(validUntil) : null;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const updated = await prisma_1.default.promoCode.update({
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
    }
    catch (error) {
        console.error("Error updating promo code:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Código promocional no encontrado" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
// Eliminar código promocional
async function deletePromoCode(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.promoCode.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: "Código promocional eliminado exitosamente" });
    }
    catch (error) {
        console.error("Error deleting promo code:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Código promocional no encontrado" });
        }
        res.status(500).json({ error: "Server error" });
    }
}
