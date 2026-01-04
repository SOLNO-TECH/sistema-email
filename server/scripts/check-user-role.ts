import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function checkUserRole(email: string) {
  try {
    console.log("🔍 Verificando el role en la base de datos...");
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (user) {
      console.log("✅ Usuario encontrado:");
      console.log(JSON.stringify(user, null, 2));
      console.log("\n🔍 Role:", user.role);
      console.log("🔍 Tipo de role:", typeof user.role);
      console.log("🔍 Es admin?", user.role === "admin");
      console.log("🔍 Es 'admin'?", user.role === "admin");
      console.log("🔍 Es 'ADMIN'?", user.role === "ADMIN");
    } else {
      console.log(`❌ Usuario con email ${email} no encontrado.`);
    }
  } catch (error: any) {
    console.error("❌ Error al verificar el role del usuario:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

const userEmail = process.argv[2] || "captainrex072@gmail.com";
checkUserRole(userEmail);
