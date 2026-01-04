import prisma from "../lib/prisma";

async function initPlans() {
  console.log("Inicializando planes...");

  const plans = [
    // ========== PLANES PARA PERSONAS ==========
    {
      name: "Gratis",
      description: "Plan básico para comenzar. Perfecto para uso personal.",
      priceMonthly: 0,
      priceYearly: 0,
      maxEmails: 1,
      maxStorageGB: 1,
      maxDomains: 1,
      category: "personas",
      isActive: true,
    },
    {
      name: "Personal",
      description: "Ideal para uso personal avanzado. Más espacio y cuentas.",
      priceMonthly: 4.99,
      priceYearly: 49.99,
      maxEmails: 3,
      maxStorageGB: 5,
      maxDomains: 1,
      category: "personas",
      isActive: true,
    },
    {
      name: "Personal Pro",
      description: "Para usuarios que necesitan más recursos. Recomendado.",
      priceMonthly: 9.99,
      priceYearly: 99.99,
      maxEmails: 5,
      maxStorageGB: 10,
      maxDomains: 2,
      category: "personas",
      isActive: true,
    },
    {
      name: "Familiar",
      description: "Perfecto para familias. Múltiples cuentas y dominios.",
      priceMonthly: 14.99,
      priceYearly: 149.99,
      maxEmails: 10,
      maxStorageGB: 25,
      maxDomains: 3,
      category: "personas",
      isActive: true,
    },
    {
      name: "Premium",
      description: "Máxima privacidad y recursos para usuarios exigentes.",
      priceMonthly: 24.99,
      priceYearly: 249.99,
      maxEmails: 15,
      maxStorageGB: 50,
      maxDomains: 5,
      category: "personas",
      isActive: true,
    },
    
    // ========== PLANES PARA EMPRESAS ==========
    {
      name: "Startup",
      description: "Ideal para startups y pequeñas empresas. Comienza tu negocio.",
      priceMonthly: 19.99,
      priceYearly: 199.99,
      maxEmails: 10,
      maxStorageGB: 20,
      maxDomains: 2,
      category: "empresas",
      isActive: true,
    },
    {
      name: "Básico Empresarial",
      description: "Solución profesional para pequeñas empresas.",
      priceMonthly: 39.99,
      priceYearly: 399.99,
      maxEmails: 25,
      maxStorageGB: 50,
      maxDomains: 5,
      category: "empresas",
      isActive: true,
    },
    {
      name: "Profesional",
      description: "Para empresas en crecimiento. Recursos ampliados.",
      priceMonthly: 79.99,
      priceYearly: 799.99,
      maxEmails: 50,
      maxStorageGB: 100,
      maxDomains: 10,
      category: "empresas",
      isActive: true,
    },
    {
      name: "Business",
      description: "Solución completa para empresas medianas. Recomendado.",
      priceMonthly: 149.99,
      priceYearly: 1499.99,
      maxEmails: 100,
      maxStorageGB: 250,
      maxDomains: 20,
      category: "empresas",
      isActive: true,
    },
    {
      name: "Enterprise",
      description: "Máxima capacidad para grandes empresas. Sin límites prácticos.",
      priceMonthly: 299.99,
      priceYearly: 2999.99,
      maxEmails: 200,
      maxStorageGB: 500,
      maxDomains: 50,
      category: "empresas",
      isActive: true,
    },
    {
      name: "Corporativo",
      description: "Solución empresarial premium. Soporte prioritario incluido.",
      priceMonthly: 499.99,
      priceYearly: 4999.99,
      maxEmails: 500,
      maxStorageGB: 1000,
      maxDomains: 100,
      category: "empresas",
      isActive: true,
    },
  ];

  for (const planData of plans) {
    const existing = await prisma.plan.findFirst({
      where: { name: planData.name },
    });

    if (!existing) {
      await prisma.plan.create({ data: planData });
      console.log(`✅ Plan "${planData.name}" creado`);
    } else {
      console.log(`⚠️  Plan "${planData.name}" ya existe`);
    }
  }

  console.log("✅ Planes inicializados correctamente");
}

initPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

