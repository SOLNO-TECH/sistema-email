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
exports.listPlans = listPlans;
exports.getPlan = getPlan;
exports.getCurrentPlan = getCurrentPlan;
exports.getUserLimits = getUserLimits;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Listar todos los planes disponibles
async function listPlans(req, res) {
    try {
        const plans = await prisma_1.default.plan.findMany({
            where: { isActive: true },
            orderBy: { priceMonthly: "asc" },
        });
        res.json(plans);
    }
    catch (err) {
        console.error("List plans error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener un plan específico
async function getPlan(req, res) {
    try {
        const { id } = req.params;
        const plan = await prisma_1.default.plan.findUnique({
            where: { id: parseInt(id) },
        });
        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }
        res.json(plan);
    }
    catch (err) {
        console.error("Get plan error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener el plan actual del usuario
async function getCurrentPlan(req, res) {
    try {
        const user = req.user;
        const subscription = await prisma_1.default.subscription.findFirst({
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
    }
    catch (err) {
        console.error("Get current plan error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
// Obtener límites del usuario
async function getUserLimits(req, res) {
    try {
        const user = req.user;
        const { SubscriptionService } = await Promise.resolve().then(() => __importStar(require("../services/subscription.service")));
        const limits = await SubscriptionService.getUserLimits(user.id);
        res.json(limits);
    }
    catch (err) {
        console.error("Get user limits error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
