"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class SubscriptionService {
    // Obtener el plan activo del usuario
    static async getUserActivePlan(userId) {
        const subscription = await prisma_1.default.subscription.findFirst({
            where: {
                userId,
                endDate: {
                    gte: new Date(), // Suscripción activa
                },
            },
            include: {
                Plan: true,
            },
            orderBy: {
                startDate: "desc",
            },
        });
        return subscription?.Plan || null;
    }
    // Obtener límites del usuario
    static async getUserLimits(userId) {
        const plan = await this.getUserActivePlan(userId);
        // Si no tiene plan activo, intentar buscar el plan gratuito y asignarlo
        if (!plan) {
            const freePlan = await prisma_1.default.plan.findFirst({
                where: {
                    priceMonthly: 0,
                    isActive: true
                },
                orderBy: { createdAt: "asc" },
            });
            if (freePlan) {
                // Asignar automáticamente el plan gratuito
                try {
                    await prisma_1.default.subscription.create({
                        data: {
                            userId: userId,
                            planId: freePlan.id,
                            plan: freePlan.name,
                            startDate: new Date(),
                        },
                    });
                    // Recargar el plan después de asignarlo
                    const updatedPlan = await this.getUserActivePlan(userId);
                    if (updatedPlan) {
                        return this.getUserLimits(userId); // Recursión para obtener límites con el plan asignado
                    }
                }
                catch (err) {
                    console.error("Error auto-asignando plan gratuito:", err);
                }
            }
        }
        // Si no tiene plan activo, usar límites mínimos por defecto (para permitir al menos 1 cuenta durante registro)
        const maxEmails = plan?.maxEmails ?? 1; // Mínimo 1 para permitir la primera cuenta
        const maxStorageGB = plan?.maxStorageGB ?? 1;
        const maxDomains = plan?.maxDomains ?? 1;
        // Contar recursos actuales
        const [currentEmails, currentDomains, emailAccounts] = await Promise.all([
            prisma_1.default.emailAccount.count({ where: { ownerId: userId } }),
            prisma_1.default.domain.count({ where: { userId } }),
            prisma_1.default.emailAccount.findMany({
                where: { ownerId: userId },
                select: { storageUsed: true },
            }),
        ]);
        const currentStorageGB = emailAccounts.reduce((sum, acc) => sum + acc.storageUsed, 0);
        return {
            maxEmails,
            maxStorageGB,
            maxDomains,
            currentEmails,
            currentDomains,
            currentStorageGB,
        };
    }
    // Verificar si el usuario puede crear más cuentas de correo
    static async canCreateEmailAccount(userId) {
        const limits = await this.getUserLimits(userId);
        if (limits.currentEmails >= limits.maxEmails) {
            return {
                allowed: false,
                reason: `Has alcanzado el límite de ${limits.maxEmails} cuenta(s) de correo. Actualiza tu plan para crear más.`,
            };
        }
        return { allowed: true };
    }
    // Verificar si el usuario puede crear más dominios
    static async canCreateDomain(userId) {
        const limits = await this.getUserLimits(userId);
        if (limits.currentDomains >= limits.maxDomains) {
            return {
                allowed: false,
                reason: `Has alcanzado el límite de ${limits.maxDomains} dominio(s). Actualiza tu plan para agregar más.`,
            };
        }
        return { allowed: true };
    }
}
exports.SubscriptionService = SubscriptionService;
