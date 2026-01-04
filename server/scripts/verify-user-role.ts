import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function verifyUserRole() {
  try {
    const userId = 1; // ID del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      console.log("\n🔍 Role en BD:", user.role);
      console.log("🔍 Tipo:", typeof user.role);
      console.log("🔍 Es 'admin'?:", user.role === "admin");
      console.log("🔍 Es 'ADMIN'?:", user.role === "ADMIN");
      
      // Actualizar a admin si no lo es
      if (user.role !== "admin") {
        console.log("\n🔄 Actualizando role a 'admin'...");
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { role: "admin" },
          select: { id: true, email: true, role: true },
        });
        console.log("✅ Usuario actualizado:");
        console.log(JSON.stringify(updated, null, 2));
      } else {
        console.log("\n✅ El usuario ya tiene role 'admin'");
      }
    } else {
      console.log(`❌ Usuario con ID ${userId} no encontrado`);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserRole();

