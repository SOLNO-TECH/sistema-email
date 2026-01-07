"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
// Manejo de errores de conexión
prisma.$connect().catch((err) => {
    console.error("❌ Error connecting to database:", err.message);
    if (!process.env.DATABASE_URL) {
        console.error("⚠️  DATABASE_URL is not set in .env file");
    }
});
exports.default = prisma;
