"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  HelpCircle,
  Shield,
  Globe,
  CreditCard,
  Sparkles,
  KeyRound,
  User,
  Languages,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, checkAuth } = useAuthStore();
  const pathname = usePathname();
  // Normalizar el role a minúsculas para la comparación
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  // Verificar si es usuario "personas" (no puede crear correos/dominios)
  const isPersonas = user?.paymentDetails?.planCategory === "personas";

  // Debug: Log para verificar el role
  React.useEffect(() => {
    console.log("🔍 Sidebar - User:", user);
    console.log("🔍 Sidebar - User role (raw):", user?.role);
    console.log("🔍 Sidebar - User role (normalized):", userRole);
    console.log("🔍 Sidebar - isAdmin:", isAdmin);
    console.log("🔍 Sidebar - userRole === 'admin':", userRole === "admin");
  }, [user, userRole, isAdmin]);

  // Refrescar datos del usuario al montar el componente
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Sidebar className="lg:border-r-0! bg-[#1a1a1a] border-r border-gray-200" collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-0 border-b border-gray-700 relative z-10">
        <div className="px-4 py-6">
          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center justify-center group cursor-pointer">
              <img
                src="/ln.png"
                alt="Xstar Mail Logo"
                className="h-16 lg:h-24 w-auto object-contain transition-all duration-300 group-hover:opacity-80"
              />
            </Link>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-4 py-4 dark-scrollbar overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Botón Buzón destacado y muy reconocible */}
              <SidebarMenuItem>
                <Link href="/emails" className="block">
                  <button
                    className={`w-full mb-6 bg-[#14b4a1] hover:bg-[#0f9d8a] text-white h-11 rounded-lg shadow-sm hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2 ${
                      pathname?.startsWith("/mailbox") || pathname === "/emails"
                        ? "ring-2 ring-[#14b4a1] ring-offset-2 ring-offset-[#1a1a1a]"
                        : ""
                    }`}
                  >
                    <Inbox className="w-5 h-5" />
                    Buzón
                  </button>
                </Link>
              </SidebarMenuItem>
              
              {/* Separador sutil */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#14b4a1]/20 to-transparent mx-2 my-1" />
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                    pathname === "/dashboard"
                      ? "bg-gray-800 text-white font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <Link href="/dashboard" className="flex items-center gap-3 w-full">
                    <LayoutDashboard className={`w-5 h-5 ${pathname === "/dashboard" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Panel de control</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/plans"}
                  className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                    pathname === "/plans"
                      ? "bg-gray-800 text-white font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <Link href="/plans" className="flex items-center gap-3 w-full">
                    <Sparkles className={`w-5 h-5 ${pathname === "/plans" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Actualizar plan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/recovery"}
                  className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                    pathname === "/recovery"
                      ? "bg-gray-800 text-white font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <Link href="/recovery" className="flex items-center gap-3 w-full">
                    <KeyRound className={`w-5 h-5 ${pathname === "/recovery" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Recuperación</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/account"}
                  className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                    pathname === "/account"
                      ? "bg-gray-800 text-white font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <Link href="/account" className="flex items-center gap-3 w-full">
                    <User className={`w-5 h-5 ${pathname === "/account" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Cuenta y contraseña</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/language"}
                  className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                    pathname === "/language"
                      ? "bg-gray-800 text-white font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <Link href="/language" className="flex items-center gap-3 w-full">
                    <Languages className={`w-5 h-5 ${pathname === "/language" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Idioma y hora</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Solo mostrar Dominios si NO es usuario "personas" */}
              {!isPersonas && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/domains"}
                    className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                      pathname === "/domains"
                        ? "bg-gray-800 text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Link href="/domains" className="flex items-center gap-3 w-full">
                      <Globe className={`w-5 h-5 ${pathname === "/domains" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                      <span className="flex-1 text-left">Dominios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isAdmin && (
                <>
                  <div className="mt-4 pt-4 border-t border-gray-700" />
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin"}
                      className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                        pathname === "/admin"
                          ? "bg-gray-800 text-white font-semibold"
                          : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <Link href="/admin" className="flex items-center gap-3 w-full">
                        <Shield className={`w-5 h-5 ${pathname === "/admin" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                        <span className="flex-1 text-left">Administración</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-700 relative z-10">
        <div className="space-y-0.5 mb-2">
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/feedback"}
                className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                  pathname === "/feedback"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Link href="/feedback" className="flex items-center gap-3 w-full">
                  <MessageSquare className={`w-5 h-5 ${pathname === "/feedback" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                  <span className="flex-1 text-left">Comentarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/settings"}
                className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                  pathname === "/settings"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Link href="/settings" className="flex items-center gap-3 w-full">
                  <Settings className={`w-5 h-5 ${pathname === "/settings" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                  <span className="flex-1 text-left">Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/help"}
                className={`h-auto py-2.5 px-3 text-sm transition-all rounded-lg ${
                  pathname === "/help"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Link href="/help" className="flex items-center gap-3 w-full">
                  <HelpCircle className={`w-5 h-5 ${pathname === "/help" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                  <span className="flex-1 text-left">Centro de Ayuda</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
