"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient, type Plan } from "@/lib/api";
import {
  Sparkles,
  Loader2,
  Info,
  Check,
  CreditCard,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PlansPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [planCategory, setPlanCategory] = useState<"personas" | "empresas">("personas");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState("EUR");
  const [subscribing, setSubscribing] = useState<number | null>(null);

  // Leer categoría de la URL
  useEffect(() => {
    const category = searchParams.get("category");
    if (category === "personas" || category === "empresas") {
      setPlanCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadPlansData();
    }
  }, [isAuthenticated, isLoading]);

  const loadPlansData = async () => {
    try {
      setIsLoadingData(true);
      const [planData, plansData] = await Promise.all([
        apiClient.getCurrentPlan(),
        apiClient.getPlans(),
      ]);

      setCurrentPlan(planData.plan);
      setAllPlans(plansData);
    } catch (error: any) {
      console.error("Error loading plans data:", error);
      toast.error(`Error al cargar datos: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubscribe = async (planId: number, period: "monthly" | "yearly") => {
    setSubscribing(planId);
    try {
      const plan = allPlans.find((p) => p.id === planId);
      
      if (plan && plan.priceMonthly === 0) {
        await apiClient.createSubscription({
          planId,
          billingPeriod: period,
        });
        await loadPlansData();
        toast.success("¡Plan activado exitosamente!");
      } else {
        const paymentIntent = await apiClient.createPaymentIntent({
          planId,
          billingPeriod: period,
        });
        
        if (confirm(`¿Confirmar suscripción por ${currency === "EUR" ? "€" : "$"}${paymentIntent.amount}?`)) {
          await apiClient.createSubscription({
            planId,
            billingPeriod: period,
          });
          await loadPlansData();
          toast.success("¡Suscripción activada exitosamente!");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al suscribirse");
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanFeatures = (plan: Plan): Array<{ text: string; info?: string }> => {
    const features: Array<{ text: string; info?: string }> = [];
    
    if (plan.maxStorageGB > 0) {
      features.push({
        text: `${plan.maxStorageGB} GB de almacenamiento`,
        info: "El espacio de almacenamiento es compartido entre todas las aplicaciones"
      });
    }
    if (plan.maxEmails > 0) {
      features.push({
        text: `${plan.maxEmails} direcciones/alias de correo`,
        info: "Cree múltiples direcciones de correo para sus identidades en línea"
      });
    }
    features.push({ text: "Carpetas, etiquetas y filtros ilimitados" });
    if (plan.maxDomains > 0) {
      features.push({ text: "Use su propio dominio de correo electrónico" });
    }
    features.push({ text: "Aplicación de escritorio" });
    
    if (plan.name.toLowerCase().includes("unlimited") || plan.maxStorageGB >= 100) {
      features.push({ text: "Mensajes al día ilimitados" });
      features.push({ text: "3 dominios de correo electrónico personalizados" });
      features.push({ text: "Soporte prioritario" });
    } else if (plan.name.toLowerCase().includes("duo") || planCategory === "family") {
      features.push({ text: "Hasta 2 usuarios" });
      features.push({ text: "2 TB de almacenamiento" });
      features.push({ text: "30 direcciones/alias de correo" });
      features.push({ text: "Soporte prioritario" });
    } else {
      features.push({ text: "Dark Web Monitoring" });
    }
    
    return features;
  };

  const filteredPlans = (() => {
    if (allPlans.length === 0) return [];
    
    const filtered = allPlans.filter((plan) => {
      return plan.category === planCategory && plan.isActive;
    });
    
    if (filtered.length === 0) {
      return allPlans.filter(p => p.isActive);
    }
    
    return filtered;
  })();

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
            <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Toaster />
      <SidebarProvider className="bg-sidebar">
        <DashboardSidebar />
        <div className="h-svh overflow-hidden lg:p-2 w-full">
          <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
              <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Sparkles className="w-7 h-7 text-white/90" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Actualizar plan
                      </h1>
                      <p className="text-white/60 mt-1 text-sm md:text-base">
                        Desbloquee funciones premium al actualizar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs para tipo de plan */}
                <div className="flex gap-2 border-b border-gray-800/50 pb-1">
                  <button
                    onClick={() => {
                      setPlanCategory("personas");
                      router.push("/plans?category=personas");
                    }}
                    className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-all ${
                      planCategory === "personas"
                        ? "text-white bg-gray-800/50 border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    Para Personas
                  </button>
                  <button
                    onClick={() => {
                      setPlanCategory("empresas");
                      router.push("/plans?category=empresas");
                    }}
                    className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-all ${
                      planCategory === "empresas"
                        ? "text-white bg-gray-800/50 border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    Para Empresas
                  </button>
                </div>

                {/* Toggle período y selector de moneda */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-900/30 border border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium transition-colors ${
                        billingPeriod === "monthly"
                          ? "text-white"
                          : "text-white/50"
                      }`}
                    >
                      1 mes
                    </span>
                    <button
                      onClick={() =>
                        setBillingPeriod(
                          billingPeriod === "monthly" ? "yearly" : "monthly"
                        )
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        billingPeriod === "yearly"
                          ? "bg-[#14b4a1]"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                          billingPeriod === "yearly" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium transition-colors ${
                        billingPeriod === "yearly"
                          ? "text-white"
                          : "text-white/50"
                      }`}
                    >
                      12 meses
                    </span>
                    {billingPeriod === "yearly" && (
                      <span className="px-2 py-1 rounded-full bg-[#14b4a1]/20 border border-[#14b4a1]/40 text-xs font-semibold text-[#14b4a1]">
                        Ahorra hasta 20%
                      </span>
                    )}
                  </div>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-24 h-9 bg-gray-800/50 border-gray-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="EUR" className="text-white">EUR</SelectItem>
                      <SelectItem value="USD" className="text-white">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Planes */}
                {filteredPlans.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-xl">
                    <Sparkles className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60 font-medium">No hay planes disponibles en esta categoría</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan) => {
                      const price =
                        billingPeriod === "monthly"
                          ? plan.priceMonthly
                          : plan.priceYearly / 12;
                      const isCurrentPlan = currentPlan?.id === plan.id;
                      const isSubscribing = subscribing === plan.id;
                      const isRecommended = plan.name.toLowerCase().includes("unlimited") || 
                                           plan.name.toLowerCase().includes("recomendado");

                      return (
                        <div
                          key={plan.id}
                          className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                            isCurrentPlan
                              ? "border-[#14b4a1] bg-gradient-to-br from-[#14b4a1]/20 to-[#14b4a1]/10 shadow-lg shadow-[#14b4a1]/30"
                              : isRecommended
                              ? "border-[#14b4a1]/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 hover:border-[#14b4a1] hover:shadow-[#14b4a1]/20"
                              : "border-gray-800/50 bg-gradient-to-br from-gray-900/40 to-gray-900/20 hover:border-gray-700/50"
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          {isRecommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                              <span className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-[#14b4a1]/30">
                                Recomendado
                              </span>
                            </div>
                          )}

                          <div className="relative z-10 p-6 space-y-5">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-white">
                                  {plan.name}
                                </h3>
                                {isCurrentPlan && (
                                  <div className="px-2 py-1 rounded-full bg-[#14b4a1]/20 border border-[#14b4a1]/40">
                                    <Check className="w-4 h-4 text-[#14b4a1]" />
                                  </div>
                                )}
                              </div>
                              {plan.description && (
                                <p className="text-sm text-white/60 line-clamp-2">
                                  {plan.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-gray-800/50">
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">
                                  {price === 0 ? "Gratis" : price.toFixed(2)}
                                </span>
                                {price > 0 && (
                                  <>
                                    <span className="text-white/60">
                                      {currency === "EUR" ? "€" : "$"}
                                    </span>
                                    <span className="text-white/60 text-sm">/mes</span>
                                  </>
                                )}
                              </div>
                              {billingPeriod === "yearly" && plan.priceYearly > 0 && plan.priceMonthly > 0 && (
                                <div className="text-xs text-white/50 mt-1 font-medium">
                                  Ahorra{" "}
                                  <span className="text-[#14b4a1] font-bold">
                                    {Math.round(
                                      ((plan.priceMonthly * 12 - plan.priceYearly) /
                                        (plan.priceMonthly * 12)) *
                                        100
                                    )}%
                                  </span>{" "}
                                  al pagar anualmente
                                </div>
                              )}
                            </div>

                            <Button
                              className={`w-full h-11 font-semibold transition-all ${
                                isCurrentPlan
                                  ? "bg-gradient-to-r from-[#14b4a1]/30 to-[#14b4a1]/20 border-2 border-[#14b4a1]/40 text-[#14b4a1] cursor-not-allowed"
                                  : "bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white shadow-lg shadow-[#14b4a1]/20 hover:shadow-xl hover:shadow-[#14b4a1]/30"
                              }`}
                              disabled={isCurrentPlan || isSubscribing}
                              onClick={() => handleSubscribe(plan.id, billingPeriod)}
                            >
                              {isSubscribing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Procesando...
                                </>
                              ) : isCurrentPlan ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Plan Actual
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Seleccionar plan
                                </>
                              )}
                            </Button>

                            <div className="space-y-2.5 pt-2">
                              {getPlanFeatures(plan).slice(0, 6).map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 text-sm">
                                  <div className="p-1 rounded-md bg-gray-800/60 border border-gray-700/50 mt-0.5 flex-shrink-0">
                                    <Check className="w-3.5 h-3.5 text-[#14b4a1]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-white/80 font-medium">{feature.text}</span>
                                    {feature.info && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <button className="ml-1.5 text-white/40 hover:text-[#14b4a1] transition-colors inline-flex items-center">
                                            <Info className="w-3.5 h-3.5" />
                                          </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                          <DialogHeader>
                                            <DialogTitle className="text-white">{feature.text}</DialogTitle>
                                            <DialogDescription className="text-white/70">
                                              {feature.info}
                                            </DialogDescription>
                                          </DialogHeader>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {getPlanFeatures(plan).length > 6 && (
                                <div className="text-xs text-white/50 pt-1">
                                  +{getPlanFeatures(plan).length - 6} características más
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
