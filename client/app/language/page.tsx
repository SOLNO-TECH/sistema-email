"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import {
  Languages,
  Loader2,
  Globe,
  Clock,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguagePage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Estados para configuración
  const [defaultLanguage, setDefaultLanguage] = useState("es-LA");
  const [timeFormat, setTimeFormat] = useState("auto");
  const [weekStart, setWeekStart] = useState("auto");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    } else if (isAuthenticated && !isLoading) {
      loadLanguageSettings();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadLanguageSettings = async () => {
    try {
      setIsLoadingData(true);
      const savedLanguage = localStorage.getItem("language") || "es-LA";
      const savedTimeFormat = localStorage.getItem("timeFormat") || "auto";
      const savedWeekStart = localStorage.getItem("weekStart") || "auto";
      
      setDefaultLanguage(savedLanguage);
      setTimeFormat(savedTimeFormat);
      setWeekStart(savedWeekStart);
    } catch (error: any) {
      console.error("Error loading language settings:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("language", defaultLanguage);
      localStorage.setItem("timeFormat", timeFormat);
      localStorage.setItem("weekStart", weekStart);
      
      await new Promise((resolve) => setTimeout(resolve, 300));
      toast.success("Configuración guardada exitosamente");
    } catch (error: any) {
      toast.error(`Error al guardar: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar automáticamente cuando cambian los valores
  useEffect(() => {
    if (!isLoadingData && isAuthenticated) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("language", defaultLanguage);
        localStorage.setItem("timeFormat", timeFormat);
        localStorage.setItem("weekStart", weekStart);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [defaultLanguage, timeFormat, weekStart, isLoadingData, isAuthenticated]);

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
            <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      "es-LA": "Español (Latinoamérica)",
      "es-ES": "Español (España)",
      "en-US": "English (United States)",
      "en-GB": "English (United Kingdom)",
      "pt-BR": "Português (Brasil)",
      "fr-FR": "Français (France)",
      "de-DE": "Deutsch (Germany)",
      "it-IT": "Italiano (Italy)",
    };
    return languages[code] || code;
  };

  const getTimeFormatLabel = (format: string) => {
    if (format === "auto") {
      return "Automático (13:00)";
    } else if (format === "12h") {
      return "12 horas (1:00 PM)";
    } else {
      return "24 horas (13:00)";
    }
  };

  const getWeekStartLabel = (start: string) => {
    if (start === "auto") {
      return "Automático (Lunes)";
    } else if (start === "monday") {
      return "Lunes";
    } else if (start === "sunday") {
      return "Domingo";
    } else if (start === "saturday") {
      return "Sábado";
    }
    return start;
  };

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
                      <Languages className="w-7 h-7 text-white/90" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Idioma y hora
                      </h1>
                      <p className="text-white/60 mt-1 text-sm md:text-base">
                        Configure su idioma preferido y formato de fecha y hora
                      </p>
                    </div>
                  </div>
                </div>

                {/* Idioma por defecto */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Globe className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Idioma por defecto
                      </h2>
                      <p className="text-sm text-white/50">Selecciona tu idioma preferido</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-4">
                    <div className="space-y-3">
                      <Label className="text-white/70 font-medium">Idioma</Label>
                      <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                        <SelectTrigger className="w-full sm:w-80 bg-gray-900/50 border-gray-700/50 text-white hover:bg-gray-900/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800">
                          <SelectItem value="es-LA" className="text-white hover:bg-gray-800">
                            Español (Latinoamérica)
                          </SelectItem>
                          <SelectItem value="es-ES" className="text-white hover:bg-gray-800">
                            Español (España)
                          </SelectItem>
                          <SelectItem value="en-US" className="text-white hover:bg-gray-800">
                            English (United States)
                          </SelectItem>
                          <SelectItem value="en-GB" className="text-white hover:bg-gray-800">
                            English (United Kingdom)
                          </SelectItem>
                          <SelectItem value="pt-BR" className="text-white hover:bg-gray-800">
                            Português (Brasil)
                          </SelectItem>
                          <SelectItem value="fr-FR" className="text-white hover:bg-gray-800">
                            Français (France)
                          </SelectItem>
                          <SelectItem value="de-DE" className="text-white hover:bg-gray-800">
                            Deutsch (Germany)
                          </SelectItem>
                          <SelectItem value="it-IT" className="text-white hover:bg-gray-800">
                            Italiano (Italy)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-white/50 flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14b4a1]" />
                        Los cambios se guardan automáticamente
                      </p>
                    </div>
                    <div className="pt-2 border-t border-gray-800/50">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-[#14b4a1] hover:text-[#0f9d8a] font-medium"
                        onClick={() => {
                          window.open("https://translate.proton.me/", "_blank");
                        }}
                      >
                        Ayúdenos a traducir
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Formato de hora */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Clock className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Formato de hora
                      </h2>
                      <p className="text-sm text-white/50">Personaliza cómo se muestra la hora</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-3">
                      <Label className="text-white/70 font-medium">Formato</Label>
                      <Select value={timeFormat} onValueChange={setTimeFormat}>
                        <SelectTrigger className="w-full sm:w-80 bg-gray-900/50 border-gray-700/50 text-white hover:bg-gray-900/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800">
                          <SelectItem value="auto" className="text-white hover:bg-gray-800">
                            Automático (13:00)
                          </SelectItem>
                          <SelectItem value="12h" className="text-white hover:bg-gray-800">
                            12 horas (1:00 PM)
                          </SelectItem>
                          <SelectItem value="24h" className="text-white hover:bg-gray-800">
                            24 horas (13:00)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-white/50 flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14b4a1]" />
                        Los cambios se guardan automáticamente
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inicio de semana */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Calendar className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Inicio de semana
                      </h2>
                      <p className="text-sm text-white/50">Define qué día inicia tu semana</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-3">
                      <Label className="text-white/70 font-medium">Día de inicio</Label>
                      <Select value={weekStart} onValueChange={setWeekStart}>
                        <SelectTrigger className="w-full sm:w-80 bg-gray-900/50 border-gray-700/50 text-white hover:bg-gray-900/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800">
                          <SelectItem value="auto" className="text-white hover:bg-gray-800">
                            Automático (Lunes)
                          </SelectItem>
                          <SelectItem value="monday" className="text-white hover:bg-gray-800">
                            Lunes
                          </SelectItem>
                          <SelectItem value="sunday" className="text-white hover:bg-gray-800">
                            Domingo
                          </SelectItem>
                          <SelectItem value="saturday" className="text-white hover:bg-gray-800">
                            Sábado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-white/50 flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14b4a1]" />
                        Los cambios se guardan automáticamente
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
