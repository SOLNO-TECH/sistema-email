import prisma from "../lib/prisma";

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("❌ Uso: npx ts-node scripts/create-admin.ts <email>");
    console.error("   Ejemplo: npx ts-node scripts/create-admin.ts admin@ejemplo.com");
    process.exit(1);
  }

  const email = args[0];

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Usuario con email ${email} no encontrado`);
      console.error("   Primero debes registrar el usuario normalmente desde la aplicación");
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`✅ El usuario ${email} ya es administrador`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log(`✅ Usuario ${email} actualizado a administrador`);
    console.log(`   Ahora puedes iniciar sesión y acceder al panel de administración`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

