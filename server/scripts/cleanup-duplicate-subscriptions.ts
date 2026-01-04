import prisma from "../lib/prisma";

/**
 * Script para limpiar suscripciones duplicadas
 * Mantiene solo la suscripción más reciente activa por usuario
 */
async function cleanupDuplicateSubscriptions() {
  try {
    console.log("🧹 Iniciando limpieza de suscripciones duplicadas...");

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    let totalCleaned = 0;

    for (const user of users) {
      // Obtener todas las suscripciones del usuario
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
        orderBy: { startDate: "desc" },
      });

      if (subscriptions.length <= 1) {
        continue; // No hay duplicados
      }

      // Identificar suscripciones activas (sin endDate o endDate en el futuro)
      const activeSubscriptions = subscriptions.filter(
        (sub) => !sub.endDate || sub.endDate >= new Date()
      );

      // Si hay múltiples suscripciones activas, mantener solo la más reciente
      if (activeSubscriptions.length > 1) {
        // Ordenar por fecha de inicio (más reciente primero)
        activeSubscriptions.sort(
          (a, b) => b.startDate.getTime() - a.startDate.getTime()
        );

        // Mantener la primera (más reciente) y cancelar las demás
        const toCancel = activeSubscriptions.slice(1);

        for (const sub of toCancel) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { endDate: new Date() },
          });
          totalCleaned++;
        }

        console.log(
          `✅ Usuario ${user.email} (ID: ${user.id}): ${toCancel.length} suscripción(es) duplicada(s) cancelada(s)`
        );
      }

      // También cancelar suscripciones expiradas que no deberían estar activas
      const expiredSubscriptions = subscriptions.filter(
        (sub) => sub.endDate && sub.endDate < new Date()
      );

      // Si hay muchas suscripciones expiradas, mantener solo las últimas 5 para historial
      if (expiredSubscriptions.length > 5) {
        const toDelete = expiredSubscriptions.slice(5);
        for (const sub of toDelete) {
          await prisma.subscription.delete({
            where: { id: sub.id },
          });
          totalCleaned++;
        }
        console.log(
          `🗑️ Usuario ${user.email} (ID: ${user.id}): ${toDelete.length} suscripción(es) expirada(s) antigua(s) eliminada(s)`
        );
      }
    }

    console.log(`\n✅ Limpieza completada: ${totalCleaned} suscripción(es) procesada(s)`);

    // Estadísticas finales
    const stats = await prisma.subscription.groupBy({
      by: ["userId"],
      _count: true,
    });

    const usersWithMultiple = stats.filter((s) => s._count > 1).length;
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Usuarios con múltiples suscripciones: ${usersWithMultiple}`);
    console.log(`   - Total de usuarios: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la limpieza:", error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupDuplicateSubscriptions();
}

export default cleanupDuplicateSubscriptions;

