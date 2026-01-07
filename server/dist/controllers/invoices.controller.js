"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInvoices = getUserInvoices;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Obtener facturas del usuario
async function getUserInvoices(req, res) {
    try {
        const user = req.user;
        const invoices = await prisma_1.default.invoice.findMany({
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
    }
    catch (err) {
        console.error("Get user invoices error:", err);
        res.status(500).json({ error: "Server error" });
    }
}
