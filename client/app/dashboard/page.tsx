"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
      return;
    }
    
    // Verificar que el email esté verificado
    if (!isLoading && isAuthenticated && user && user.emailVerified === false) {
      // Redirigir a la página de auth para completar la verificación
      router.push("/auth?verify=true");
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // No mostrar el dashboard si el email no está verificado
  if (user && user.emailVerified === false) {
    return null; // El useEffect ya redirigirá
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-auto bg-background">
            <DashboardContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

