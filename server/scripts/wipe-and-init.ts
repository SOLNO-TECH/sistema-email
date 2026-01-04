import prisma from "../lib/prisma";
import { hashPassword } from "../src/utils/hash";

// Credenciales del admin por defecto
const DEFAULT_ADMIN_EMAIL = "admin@xstarmail.es";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_NAME = "Administrador";

async function wipeDatabase() {
  console.log("🗑️  Limpiando base de datos...");
  
  try {
    // Eliminar en orden para respetar las relaciones (de hijos a padres)
    await prisma.ticketMessage.deleteMany({});
    console.log("  ✅ TicketMessages eliminados");
    
    await prisma.ticketAttachment.deleteMany({});
    console.log("  ✅ TicketAttachments eliminados");
    
    await prisma.ticket.deleteMany({});
    console.log("  ✅ Tickets eliminados");
    
    await prisma.emailAttachment.deleteMany({});
    console.log("  ✅ EmailAttachments eliminados");
    
    await prisma.email.deleteMany({});
    console.log("  ✅ Emails eliminados");
    
    await prisma.emailAccount.deleteMany({});
    console.log("  ✅ EmailAccounts eliminados");
    
    await prisma.domain.deleteMany({});
    console.log("  ✅ Domains eliminados");
    
    await prisma.invoice.deleteMany({});
    console.log("  ✅ Invoices eliminados");
    
    await prisma.subscription.deleteMany({});
    console.log("  ✅ Subscriptions eliminados");
    
    await prisma.plan.deleteMany({});
    console.log("  ✅ Plans eliminados");
    
    await prisma.user.deleteMany({});
    console.log("  ✅ Users eliminados");
    
    console.log("✅ Base de datos limpiada completamente\n");
  } catch (error: any) {
    console.error("❌ Error limpiando base de datos:", error.message);
    throw error;
  }
}

async function ensureDefaultAdmin() {
  console.log("🔧 Verificando/creando admin por defecto...");
  
  try {
    // Verificar si el admin ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN_EMAIL },
    });

    if (existingAdmin) {
      // Si existe pero no es admin, actualizarlo
      if (existingAdmin.role !== "admin") {
        await prisma.user.update({
          where: { email: DEFAULT_ADMIN_EMAIL },
          data: { role: "admin" },
        });
        console.log(`  ✅ Usuario ${DEFAULT_ADMIN_EMAIL} actualizado a admin`);
      } else {
        // Si ya es admin, actualizar la contraseña por si acaso
        const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
        await prisma.user.update({
          where: { email: DEFAULT_ADMIN_EMAIL },
          data: { password: hashedPassword },
        });
        console.log(`  ✅ Admin por defecto ya existe, contraseña actualizada`);
      }
    } else {
      // Crear el admin por defecto
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      
      const admin = await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          name: DEFAULT_ADMIN_NAME,
          password: hashedPassword,
          role: "admin",
        },
      });

      console.log(`  ✅ Admin por defecto creado exitosamente`);
      console.log(`     Email: ${DEFAULT_ADMIN_EMAIL}`);
      console.log(`     Password: ${DEFAULT_ADMIN_PASSWORD}`);
      console.log(`     ID: ${admin.id}`);
    }
    
    console.log("✅ Admin por defecto verificado/creado\n");
  } catch (error: any) {
    console.error("❌ Error creando admin por defecto:", error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 WIPE Y INICIALIZACIÓN DE BASE DE DATOS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Limpiar base de datos
    await wipeDatabase();

    // Crear admin por defecto
    await ensureDefaultAdmin();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PROCESO COMPLETADO EXITOSAMENTE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📧 Credenciales del admin por defecto:");
    console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}\n`);
  } catch (error: any) {
    console.error("\n❌ Error en el proceso:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

