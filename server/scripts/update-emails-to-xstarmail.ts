import prisma from "../lib/prisma";

/**
 * Script para actualizar todos los emails de usuarios a @xstarmail.es
 * 
 * Uso: npx ts-node scripts/update-emails-to-xstarmail.ts
 * 
 * Este script:
 * 1. Busca todos los usuarios en la base de datos
 * 2. Para cada usuario, extrae el nombre de usuario (parte antes del @)
 * 3. Actualiza el email a nombre@xstarmail.es
 * 4. Maneja conflictos si ya existe un usuario con ese email
 */

async function updateEmailsToXstarmail() {
  console.log("🔄 Iniciando actualización de emails a @xstarmail.es...\n");

  try {
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (users.length === 0) {
      console.log("⚠️  No se encontraron usuarios en la base de datos");
      return;
    }

    console.log(`📊 Total de usuarios encontrados: ${users.length}\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const updates: Array<{ old: string; new: string; name: string }> = [];
    const skippedUsers: Array<{ email: string; reason: string }> = [];
    const errorUsers: Array<{ email: string; error: string }> = [];

    for (const user of users) {
      try {
        // Extraer el nombre de usuario (parte antes del @)
        let username: string;
        if (user.email.includes("@")) {
          username = user.email.split("@")[0].toLowerCase().trim();
        } else {
          // Si no tiene @, usar el email completo como nombre de usuario
          username = user.email.toLowerCase().trim();
        }

        // Crear el nuevo email
        const newEmail = `${username}@xstarmail.es`;

        // Si el email ya es el correcto, saltarlo
        if (user.email.toLowerCase() === newEmail.toLowerCase()) {
          console.log(`⏭️  Saltando: ${user.email} (ya tiene @xstarmail.es)`);
          skipped++;
          skippedUsers.push({
            email: user.email,
            reason: "Ya tiene @xstarmail.es",
          });
          continue;
        }

        // Verificar si ya existe un usuario con el nuevo email
        const existingUser = await prisma.user.findUnique({
          where: { email: newEmail },
        });

        if (existingUser && existingUser.id !== user.id) {
          console.log(
            `⚠️  Conflicto: ${user.email} → ${newEmail} (ya existe otro usuario)`
          );
          skipped++;
          skippedUsers.push({
            email: user.email,
            reason: `El email ${newEmail} ya está en uso por otro usuario`,
          });
          continue;
        }

        // Actualizar el email
        await prisma.user.update({
          where: { id: user.id },
          data: { email: newEmail },
        });

        console.log(`✅ Actualizado: ${user.email} → ${newEmail}`);
        updated++;
        updates.push({
          old: user.email,
          new: newEmail,
          name: user.name,
        });
      } catch (error: any) {
        console.error(`❌ Error actualizando ${user.email}:`, error.message);
        errors++;
        errorUsers.push({
          email: user.email,
          error: error.message,
        });
      }
    }

    // Mostrar resumen
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE ACTUALIZACIÓN");
    console.log("=".repeat(60));
    console.log(`✅ Actualizados: ${updated}`);
    console.log(`⏭️  Saltados: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📊 Total: ${users.length}`);

    if (updates.length > 0) {
      console.log("\n📝 USUARIOS ACTUALIZADOS:");
      console.log("-".repeat(60));
      updates.forEach((update) => {
        console.log(`  ${update.name}`);
        console.log(`    ${update.old} → ${update.new}`);
      });
    }

    if (skippedUsers.length > 0) {
      console.log("\n⏭️  USUARIOS SALTADOS:");
      console.log("-".repeat(60));
      skippedUsers.forEach((skipped) => {
        console.log(`  ${skipped.email}`);
        console.log(`    Razón: ${skipped.reason}`);
      });
    }

    if (errorUsers.length > 0) {
      console.log("\n❌ ERRORES:");
      console.log("-".repeat(60));
      errorUsers.forEach((error) => {
        console.log(`  ${error.email}`);
        console.log(`    Error: ${error.error}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Actualización completada");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("❌ Error general:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
updateEmailsToXstarmail()
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });

