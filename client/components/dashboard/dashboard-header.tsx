"use client";

import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Sparkles, Zap, Menu, User, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { NotificationsDropdown } from "./notifications-dropdown";

export function DashboardHeader() {
  const { user, logout, checkAuth } = useAuthStore();
  const router = useRouter();

  const handleRefresh = async () => {
    await checkAuth();
  };

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <div className="w-full sticky top-0 z-10 flex items-center justify-between border-b-2 border-[#14b4a1]/30 bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-2xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-4.5 md:py-5 shadow-lg shadow-black/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#14b4a1]/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#13282b]/10 rounded-full blur-2xl -ml-32 -mb-32" />
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 relative z-10">
        <SidebarTrigger className="shrink-0 text-[#14b4a1] hover:text-[#0f9d8a] hover:bg-[#14b4a1]/10 rounded-lg p-2 transition-all duration-300" />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] flex items-center justify-center shadow-lg shadow-[#14b4a1]/30 group">
              <Hand className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-bounce" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full bg-[#14b4a1]/20 animate-ping opacity-75" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#14b4a1] rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-extrabold truncate">
            <span className="hidden xs:inline bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] bg-clip-text text-transparent">Bienvenido, </span>
            <span className="text-foreground">{user?.name || user?.email || "Usuario"}</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 shrink-0 relative z-10">
        <ThemeToggle />
        <NotificationsDropdown />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 h-9 sm:h-10 px-3 sm:px-4 hover:bg-[#14b4a1]/15 hover:text-[#14b4a1] transition-all duration-300 rounded-lg border border-transparent hover:border-[#14b4a1]/30 hover:shadow-md hover:shadow-[#14b4a1]/20"
          title="Refrescar sesión"
        >
          <RefreshCw className="size-4 sm:size-5" />
          <span className="hidden md:inline font-medium">Refrescar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 h-9 sm:h-10 px-3 sm:px-4 hover:bg-red-500/15 hover:text-red-500 transition-all duration-300 rounded-lg border border-transparent hover:border-red-500/30 hover:shadow-md hover:shadow-red-500/20"
        >
          <LogOut className="size-4 sm:size-5" />
          <span className="hidden md:inline font-medium">Salir</span>
        </Button>
      </div>
    </div>
  );
}
