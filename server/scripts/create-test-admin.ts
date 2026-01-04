import prisma from "../lib/prisma";
import { hashPassword } from "../src/utils/hash";

async function createTestAdmin() {
  try {
    const testEmail = `admin-${Date.now()}@test.com`;
    const testPassword = "admin123";
    const testName = "Admin Test";

    console.log("🔧 Creando usuario admin de prueba...");
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);

    const hashedPassword = await hashPassword(testPassword);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        password: hashedPassword,
        role: "admin", // Asegurarse de que sea admin desde el inicio
      },
    });

    console.log("\n✅ Usuario admin creado exitosamente!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", testEmail);
    console.log("🔑 Password:", testPassword);
    console.log("👤 Nombre:", testName);
    console.log("🛡️  Role:", user.role);
    console.log("🆔 ID:", user.id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n💡 Usa estas credenciales para iniciar sesión");
    console.log("   Después de iniciar sesión, verifica que aparezca");
    console.log("   la sección 'Administración' en el sidebar.\n");
  } catch (error: any) {
    console.error("❌ Error creando usuario:", error.message);
    if (error.code === "P2002") {
      console.error("   El email ya existe, intenta de nuevo");
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();

