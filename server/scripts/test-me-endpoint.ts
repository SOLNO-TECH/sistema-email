import "dotenv/config";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

async function testMeEndpoint() {
  try {
    // Obtener el usuario de la BD
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error("❌ Usuario no encontrado");
      return;
    }

    console.log("🔍 Usuario desde BD:");
    console.log(JSON.stringify(user, null, 2));
    console.log("\n🔍 Role en BD:", user.role);
    console.log("🔍 Role type:", typeof user.role);

    // Crear un token JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    console.log("\n🔍 Token generado:", token.substring(0, 50) + "...");

    // Simular la consulta que hace el controller
    console.log("\n🔍 Simulando consulta del controller...");
    const userFromQuery = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (userFromQuery) {
      console.log("🔍 Usuario desde query Prisma:");
      console.log(JSON.stringify(userFromQuery, null, 2));
      console.log("\n🔍 Role desde query:", userFromQuery.role);
      console.log("🔍 Role === 'admin':", userFromQuery.role === "admin");
      
      const userRole = (userFromQuery.role || "user").toLowerCase();
      console.log("\n🔍 Role normalizado:", userRole);
      console.log("🔍 Role normalizado === 'admin':", userRole === "admin");
    }

    // Consulta raw
    console.log("\n🔍 Consulta raw SQL...");
    const rawUser = await prisma.$queryRaw`
      SELECT id, email, name, role FROM \`User\` WHERE id = ${user.id}
    ` as any[];

    if (rawUser && rawUser.length > 0) {
      console.log("🔍 Usuario desde raw query:");
      console.log(JSON.stringify(rawUser[0], null, 2));
      console.log("\n🔍 Role desde raw:", rawUser[0].role);
      console.log("🔍 Role type desde raw:", typeof rawUser[0].role);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testMeEndpoint();

