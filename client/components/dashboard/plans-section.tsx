"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiClient, type Plan, type UserLimits } from "@/lib/api";
import { Check, Loader2, CreditCard, Zap, Sparkles, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function PlansSection() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, currentPlanData, limitsData] = await Promise.all([
        apiClient.getPlans(),
        apiClient.getCurrentPlan(),
        apiClient.getUserLimits(),
      ]);
      setPlans(plansData);
      setCurrentPlan(currentPlanData.plan);
      setLimits(limitsData);
    } catch (err) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number, billingPeriod: "monthly" | "yearly") => {
    setSubscribing(planId);
    try {
      const plan = plans.find((p) => p.id === planId);
      
      // Si el plan es gratuito, crear suscripción directamente
      if (plan && plan.priceMonthly === 0) {
        await apiClient.createSubscription({
          planId,
          billingPeriod,
        });
        await loadData();
        alert("¡Plan gratuito activado exitosamente!");
      } else {
        // Para planes de pago, crear intención de pago
        const paymentIntent = await apiClient.createPaymentIntent({
          planId,
          billingPeriod,
        });
        
        // En producción, aquí se redirigiría a Stripe Checkout
        // Por ahora, simulamos el pago exitoso
        if (confirm(`¿Confirmar suscripción por $${paymentIntent.amount}?`)) {
          await apiClient.createSubscription({
            planId,
            billingPeriod,
          });
          await loadData();
          alert("¡Suscripción activada exitosamente!");
        }
      }
    } catch (err: any) {
      alert(err.message || "Error al suscribirse");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
          <p className="text-white/60 text-sm">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Límites actuales */}
      {limits && (
        <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl hover:border-gray-700/50 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50 group-hover:border-[#14b4a1]/30 transition-colors">
                <Zap className="w-6 h-6 text-white/90" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tu Plan Actual</h2>
                <p className="text-sm text-white/50">Límites y uso</p>
              </div>
            </div>
            {currentPlan ? (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-white">{currentPlan.name}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                    <div className="text-xs text-white/60 font-medium mb-1">Cuentas de Correo</div>
                    <div className="text-xl font-bold text-white">
                      {limits.currentEmails} / {limits.maxEmails === -1 ? "∞" : limits.maxEmails}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                    <div className="text-xs text-white/60 font-medium mb-1">Dominios</div>
                    <div className="text-xl font-bold text-white">
                      {limits.currentDomains} / {limits.maxDomains === -1 ? "∞" : limits.maxDomains}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                    <div className="text-xs text-white/60 font-medium mb-1">Almacenamiento</div>
                    <div className="text-xl font-bold text-white">
                      {limits.currentStorageGB.toFixed(2)} / {limits.maxStorageGB === -1 ? "∞" : limits.maxStorageGB} GB
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-xl">
                <Sparkles className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60 font-medium">No tienes un plan activo</p>
                <p className="text-white/40 text-sm mt-1">Selecciona uno de los planes disponibles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Planes disponibles */}
      <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
            <CreditCard className="w-6 h-6 text-white/90" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Planes Disponibles</h2>
            <p className="text-sm text-white/50">Elige el plan que mejor se adapte a ti</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isSubscribing = subscribing === plan.id;

            return (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                  isCurrentPlan 
                    ? "border-[#14b4a1] bg-gradient-to-br from-[#14b4a1]/20 to-[#14b4a1]/10 shadow-lg shadow-[#14b4a1]/30" 
                    : "border-gray-800/50 bg-gradient-to-br from-gray-900/40 to-gray-900/20 hover:border-gray-700/50 hover:shadow-[#14b4a1]/10"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-xl font-bold ${
                        isCurrentPlan 
                          ? "text-white"
                          : "text-white"
                      }`}>{plan.name}</h3>
                      {isCurrentPlan && (
                        <div className="px-2 py-1 rounded-full bg-[#14b4a1]/20 border border-[#14b4a1]/40">
                          <Check className="w-4 h-4 text-[#14b4a1]" />
                        </div>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-xs text-white/60 line-clamp-2 font-medium">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-800/50">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${
                        isCurrentPlan ? "text-[#14b4a1]" : "text-white"
                      }`}>
                        {plan.priceMonthly === 0 ? "Gratis" : `€${plan.priceMonthly}`}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-sm font-normal text-white/50">
                          /mes
                        </span>
                      )}
                    </div>
                    {plan.priceYearly > 0 && (
                      <div className="text-xs text-white/50 mt-1 font-medium">
                        €{plan.priceYearly}/año (ahorra{" "}
                        <span className="text-[#14b4a1] font-bold">
                          {Math.round(
                            ((plan.priceMonthly * 12 - plan.priceYearly) /
                              (plan.priceMonthly * 12)) *
                              100
                          )}
                          %
                        </span>
                        )
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1 rounded-md bg-gray-800/60 border border-gray-700/50">
                        <Check className="w-3.5 h-3.5 text-[#14b4a1]" />
                      </div>
                      <span className="text-white/80 font-medium">{plan.maxEmails === -1 ? "∞" : plan.maxEmails} cuenta(s) de correo</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1 rounded-md bg-gray-800/60 border border-gray-700/50">
                        <Check className="w-3.5 h-3.5 text-[#14b4a1]" />
                      </div>
                      <span className="text-white/80 font-medium">{plan.maxDomains === -1 ? "∞" : plan.maxDomains} dominio(s)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1 rounded-md bg-gray-800/60 border border-gray-700/50">
                        <Check className="w-3.5 h-3.5 text-[#14b4a1]" />
                      </div>
                      <span className="text-white/80 font-medium">{plan.maxStorageGB === -1 ? "∞" : plan.maxStorageGB} GB de almacenamiento</span>
                    </div>
                  </div>

                  {isCurrentPlan ? (
                    <Button 
                      disabled 
                      className="w-full bg-gradient-to-r from-[#14b4a1]/30 to-[#14b4a1]/20 border-2 border-[#14b4a1]/40 text-[#14b4a1] font-semibold cursor-not-allowed"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Plan Actual
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold shadow-lg shadow-[#14b4a1]/20 hover:shadow-xl hover:shadow-[#14b4a1]/30 transition-all duration-300"
                        onClick={() => handleSubscribe(plan.id, "monthly")}
                        disabled={isSubscribing || plan.priceMonthly === 0}
                      >
                        {isSubscribing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : plan.priceMonthly === 0 ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Activar Gratis
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Suscribirse
                          </>
                        )}
                      </Button>
                      {plan.priceYearly > 0 && (
                        <Button
                          variant="outline"
                          className="w-full border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                          onClick={() => handleSubscribe(plan.id, "yearly")}
                          disabled={isSubscribing}
                        >
                          {isSubscribing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Año completo (€{plan.priceYearly})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
