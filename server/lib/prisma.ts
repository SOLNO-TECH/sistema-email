import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Manejo de errores de conexión
prisma.$connect().catch((err) => {
  console.error("❌ Error connecting to database:", err.message);
  if (!process.env.DATABASE_URL) {
    console.error("⚠️  DATABASE_URL is not set in .env file");
  }
});

export default prisma;
