"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Sparkles, Mail, Globe, HardDrive, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { Plan, UserLimits } from "@/lib/api";

export function UpgradeCard() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const [planData, limitsData] = await Promise.all([
          apiClient.getCurrentPlan(),
          apiClient.getUserLimits(),
        ]);
        setPlan(planData.plan);
        setLimits(limitsData);
      } catch (error) {
        console.error("Error fetching plan info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-[#14b4a1]/30 bg-gradient-to-br from-[#13282b] to-[#0a1a1c] p-2 shadow-sm">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="size-4 animate-spin text-[#14b4a1]" />
        </div>
      </div>
    );
  }

  const planName = plan?.name || "Gratis";
  const maxEmails = limits?.maxEmails || 0;
  const maxStorage = limits?.maxStorageGB || 0;
  const maxDomains = limits?.maxDomains || 0;
  const currentEmails = limits?.currentEmails || 0;
  const currentDomains = limits?.currentDomains || 0;
  const currentStorage = limits?.currentStorageGB || 0;

  // Calcular porcentajes para las barras de progreso
  const emailPercentage = maxEmails === -1 ? 0 : Math.min((currentEmails / maxEmails) * 100, 100);
  const domainPercentage = maxDomains === -1 ? 0 : Math.min((currentDomains / maxDomains) * 100, 100);
  const storagePercentage = maxStorage === -1 ? 0 : Math.min((currentStorage / maxStorage) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#14b4a1]/30 bg-gradient-to-br from-[#13282b] via-[#13282b] to-[#0a1a1c] p-2.5 shadow-lg hover:shadow-xl hover:shadow-[#14b4a1]/30 transition-all duration-300 hover:border-[#14b4a1]/50 group">
      {/* Compact decorative background elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-[#14b4a1]/15 rounded-full blur-2xl -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#14b4a1]/10 rounded-full blur-xl -ml-8 -mb-8" />
      
      <div className="relative space-y-2 z-10">
        {/* Header Compact */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="p-1 rounded-lg bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40 flex-shrink-0">
              <CreditCard className="size-3 text-[#14b4a1]" />
            </div>
            <span className="text-xs font-bold text-white truncate">Plan</span>
          </div>
          {plan && (
            <div className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#14b4a1]/20 to-[#14b4a1]/15 border border-[#14b4a1]/40 flex-shrink-0">
              <Sparkles className="size-3 text-[#14b4a1]" />
            </div>
          )}
        </div>

        {/* Plan Name Compact */}
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <span className="truncate bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">{planName}</span>
            {plan && (
              <span className="text-[9px] font-bold text-[#14b4a1] whitespace-nowrap px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#14b4a1]/20 to-[#14b4a1]/15 border border-[#14b4a1]/40">
                ✓
              </span>
            )}
          </h3>
        </div>

        {/* Limits with Progress Bars - Compact */}
        {plan && limits ? (
          <div className="space-y-1.5 pt-0.5">
            {/* Emails */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Mail className="size-2.5 text-[#14b4a1] flex-shrink-0" />
                  <span className="text-white/70 font-medium truncate text-[9px]">Correos</span>
                </div>
                <span className="text-white/90 font-semibold whitespace-nowrap flex-shrink-0 text-[9px]">
                  {currentEmails}/{maxEmails === -1 ? "∞" : maxEmails}
                </span>
              </div>
              {maxEmails !== -1 && (
                <div className="h-1 bg-[#14b4a1]/10 rounded-full overflow-hidden border border-[#14b4a1]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] rounded-full transition-all duration-500 shadow-sm shadow-[#14b4a1]/40"
                    style={{ width: `${emailPercentage}%` }}
                  />
                </div>
              )}
            </div>

            {/* Domains */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Globe className="size-2.5 text-[#14b4a1] flex-shrink-0" />
                  <span className="text-white/70 font-medium truncate text-[9px]">Dominios</span>
                </div>
                <span className="text-white/90 font-semibold whitespace-nowrap flex-shrink-0 text-[9px]">
                  {currentDomains}/{maxDomains === -1 ? "∞" : maxDomains}
                </span>
              </div>
              {maxDomains !== -1 && (
                <div className="h-1 bg-[#14b4a1]/10 rounded-full overflow-hidden border border-[#14b4a1]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] rounded-full transition-all duration-500 shadow-sm shadow-[#14b4a1]/40"
                    style={{ width: `${domainPercentage}%` }}
                  />
                </div>
              )}
            </div>

            {/* Storage */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <HardDrive className="size-2.5 text-[#14b4a1] flex-shrink-0" />
                  <span className="text-white/70 font-medium truncate text-[9px]">Almac.</span>
                </div>
                <span className="text-white/90 font-semibold whitespace-nowrap flex-shrink-0 text-[9px] text-right">
                  {currentStorage.toFixed(1)}/{maxStorage === -1 ? "∞" : maxStorage}GB
                </span>
              </div>
              {maxStorage !== -1 && (
                <div className="h-1 bg-[#14b4a1]/10 rounded-full overflow-hidden border border-[#14b4a1]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] rounded-full transition-all duration-500 shadow-sm shadow-[#14b4a1]/40"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-1">
            <p className="text-[9px] leading-tight text-white/60">
              Sin plan activo
            </p>
          </div>
        )}

        {/* Action Button - Compact */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-center gap-1 text-[10px] font-semibold border border-[#14b4a1]/40 bg-gradient-to-r from-[#14b4a1]/10 to-[#14b4a1]/5 hover:from-[#14b4a1] hover:to-[#0f9d8a] hover:text-white hover:border-[#14b4a1] text-[#14b4a1] transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:shadow-[#14b4a1]/40 rounded-lg relative overflow-hidden group/btn"
          asChild
        >
          <Link href="/plans" className="flex items-center justify-center relative z-10">
            <span className="truncate text-[10px]">
              {plan ? "Ver plan" : "Ver planes"}
            </span>
            <ArrowRight className="size-3 flex-shrink-0 ml-0.5 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

