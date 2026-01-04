"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import type { EmailAccount } from "@/lib/api";
import {
  Mail,
  Loader2,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Grid3x3,
  List,
  MoreVertical,
  Copy,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Calendar,
  Globe,
  Eye,
  EyeOff,
  Shield,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type ViewMode = "grid" | "list";

export default function EmailsPage() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const router = useRouter();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: number; address: string } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const isPersonas = user?.paymentDetails?.planCategory === "personas";

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
      checkWelcomeStatus();
    }
  }, [isAuthenticated, user]);

  const checkWelcomeStatus = () => {
    if (!user?.id) return;
    
    const welcomeShown = localStorage.getItem(`xstar_welcome_shown_${user.id}`);
    
    if (!welcomeShown) {
      setShowWelcome(true);
    }
  };

  const handleCloseWelcome = () => {
    if (!user?.id) return;
    
    localStorage.setItem(`xstar_welcome_shown_${user.id}`, "true");
    
    setShowWelcome(false);
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEmailAccounts();
      setAccounts(data);
    } catch (error: any) {
      console.error("Error loading accounts:", error);
      toast.error("Error al cargar las cuentas de correo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;

    try {
      await apiClient.deleteEmailAccount(accountToDelete.id);
      toast.success("Cuenta eliminada exitosamente");
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      await loadAccounts();
    } catch (error: any) {
      toast.error(`Error al eliminar la cuenta: ${error.message || "Intenta nuevamente"}`);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success("Dirección copiada al portapapeles");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.domainName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === "all" || account.domainName === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const uniqueDomains = Array.from(new Set(accounts.map((a) => a.domainName).filter(Boolean)));

  const totalAccounts = accounts.length;
  const uniqueDomainsCount = uniqueDomains.length;
  const totalStorage = accounts.reduce((sum, acc) => sum + (acc.storageUsed || 0), 0);

  const accountsByDomain = filteredAccounts.reduce((acc, account) => {
    const domain = account.domainName || "Sin dominio";
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(account);
    return acc;
  }, {} as Record<string, EmailAccount[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
            <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Cargando cuentas...</p>
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar cuenta de correo?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta{" "}
              <span className="font-semibold text-white">{accountToDelete?.address}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarProvider className="bg-sidebar">
        <DashboardSidebar />
        <div className="h-svh overflow-hidden lg:p-2 w-full">
          <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
              <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                        <Mail className="w-7 h-7 text-white/90" />
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                          Mis Correos
                        </h1>
                        <p className="text-white/60 mt-1 text-sm md:text-base">
                          Gestiona todas tus cuentas de correo electrónico
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={loadAccounts}
                        disabled={loading}
                        className="gap-2 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                      </Button>
                      {!isPersonas && (
                        <Button
                          onClick={() => router.push("/")}
                          className="gap-2 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          Crear Cuenta
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  {accounts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Total de Cuentas</p>
                            <p className="text-3xl font-bold text-white">{totalAccounts}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Mail className="w-6 h-6 text-white/90" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Dominios</p>
                            <p className="text-3xl font-bold text-white">{uniqueDomainsCount}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Globe className="w-6 h-6 text-white/90" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Almacenamiento</p>
                            <p className="text-3xl font-bold text-white">
                              {totalStorage.toFixed(2)} GB
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <HardDrive className="w-6 h-6 text-white/90" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Estado</p>
                            <div className="flex items-center gap-2 mt-1">
                              <CheckCircle2 className="w-5 h-5 text-[#14b4a1]" />
                              <p className="text-lg font-semibold text-white">Activo</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30">
                            <CheckCircle2 className="w-6 h-6 text-[#14b4a1]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filtros y búsqueda */}
                {accounts.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        placeholder="Buscar por dirección o dominio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                      />
                    </div>

                    {uniqueDomains.length > 0 && (
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10" />
                        <select
                          value={selectedDomain}
                          onChange={(e) => setSelectedDomain(e.target.value)}
                          className="pl-10 pr-4 h-12 rounded-md border border-gray-700/50 bg-gray-900/50 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#14b4a1]/20"
                        >
                          <option value="all">Todos los dominios</option>
                          {uniqueDomains.map((domain) => (
                            <option key={domain} value={domain}>
                              {domain}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 border border-gray-800/50 rounded-md p-1 bg-gray-900/50">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={viewMode === "grid" ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]" : "text-white/60 hover:text-white hover:bg-gray-800/50"}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={viewMode === "list" ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]" : "text-white/60 hover:text-white hover:bg-gray-800/50"}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lista de cuentas */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
                      <p className="text-white/60">Cargando cuentas...</p>
                    </div>
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="text-center py-20 space-y-6 border-2 border-dashed border-gray-800 rounded-xl">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gray-800/60 border border-gray-700/50 flex items-center justify-center">
                      <Mail className="w-10 h-10 text-white/30" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {searchQuery || selectedDomain !== "all"
                          ? "No se encontraron cuentas"
                          : "No tienes cuentas de correo"}
                      </h3>
                      <p className="text-white/60 mb-6 max-w-md mx-auto">
                        {searchQuery || selectedDomain !== "all"
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "Crea tu primera cuenta de correo para comenzar a gestionar tus comunicaciones"}
                      </p>
                      {(!searchQuery && selectedDomain === "all") && (
                        <>
                          {!isPersonas && (
                            <Button
                              onClick={() => router.push("/")}
                              className="gap-2 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                            >
                              <Plus className="w-4 h-4" />
                              Crear Primera Cuenta
                            </Button>
                          )}
                          {isPersonas && accounts.length === 0 && (
                            <Button
                              onClick={async () => {
                                try {
                                  const allAccounts = await apiClient.getEmailAccounts();
                                  if (allAccounts.length > 0) {
                                    router.push(`/mailbox/${allAccounts[0].id}`);
                                  }
                                } catch (err) {
                                  console.error("Error obteniendo cuentas:", err);
                                }
                              }}
                              className="gap-2 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                            >
                              Ir a mi buzón
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="space-y-6">
                    {Object.entries(accountsByDomain).map(([domain, domainAccounts]) => (
                      <div key={domain} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Globe className="w-5 h-5 text-white/90" />
                          </div>
                          <h2 className="text-xl font-bold text-white">{domain}</h2>
                          <Badge className="ml-2 bg-gray-800/60 text-white/90 border-gray-700/50">
                            {domainAccounts.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {domainAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="group rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 hover:shadow-xl hover:border-gray-700/50 transition-all"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50 flex-shrink-0">
                                  <Mail className="w-6 h-6 text-white/90" />
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-gray-800/50">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                                    <DropdownMenuItem
                                      onClick={() => handleCopyAddress(account.address)}
                                      className="text-white hover:bg-gray-800"
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      {copiedAddress === account.address ? "Copiado" : "Copiar dirección"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/mailbox/${account.id}`)}
                                      className="text-white hover:bg-gray-800"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Abrir buzón
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-800" />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setAccountToDelete({ id: account.id, address: account.address });
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-bold text-lg text-white truncate mb-1">
                                    {account.address}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-white/60">
                                    <Globe className="w-3 h-3" />
                                    <span className="truncate">{account.domainName || "Sin dominio"}</span>
                                  </div>
                                </div>

                                {account.storageUsed !== undefined && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-white/60">
                                      <span>Almacenamiento</span>
                                      <span>{account.storageUsed.toFixed(2)} GB</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] rounded-full transition-all"
                                        style={{
                                          width: `${Math.min((account.storageUsed / 10) * 100, 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-2">
                                  <Badge className="bg-[#14b4a1]/20 text-[#14b4a1] border-[#14b4a1]/30 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Activo
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-800/50">
                                <Button
                                  onClick={() => router.push(`/mailbox/${account.id}`)}
                                  className="w-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                                  size="sm"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Abrir Buzón
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(accountsByDomain).map(([domain, domainAccounts]) => (
                      <div key={domain} className="space-y-3">
                        <div className="flex items-center gap-2 px-2">
                          <div className="p-1.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Globe className="w-4 h-4 text-white/90" />
                          </div>
                          <h2 className="text-lg font-bold text-white">{domain}</h2>
                          <Badge className="ml-2 bg-gray-800/60 text-white/90 border-gray-700/50">
                            {domainAccounts.length}
                          </Badge>
                        </div>
                        {domainAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="group rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 hover:shadow-xl hover:border-gray-700/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50 flex-shrink-0">
                                  <Mail className="w-6 h-6 text-white/90" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-white truncate">
                                      {account.address}
                                    </h3>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0 text-white/60 hover:text-white hover:bg-gray-800/50"
                                      onClick={() => handleCopyAddress(account.address)}
                                    >
                                      {copiedAddress === account.address ? (
                                        <CheckCircle2 className="w-4 h-4 text-[#14b4a1]" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-white/60">
                                    <div className="flex items-center gap-1">
                                      <Globe className="w-3 h-3" />
                                      <span>{account.domainName || "Sin dominio"}</span>
                                    </div>
                                    {account.storageUsed !== undefined && (
                                      <div className="flex items-center gap-1">
                                        <HardDrive className="w-3 h-3" />
                                        <span>{account.storageUsed.toFixed(2)} GB</span>
                                      </div>
                                    )}
                                    <Badge className="bg-[#14b4a1]/20 text-[#14b4a1] border-[#14b4a1]/30 text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Activo
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/mailbox/${account.id}`)}
                                  className="gap-2 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Abrir Buzón
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white/60 hover:text-white hover:bg-gray-800/50">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                                    <DropdownMenuItem
                                      onClick={() => handleCopyAddress(account.address)}
                                      className="text-white hover:bg-gray-800"
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copiar dirección
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-800" />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setAccountToDelete({ id: account.id, address: account.address });
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Eliminar cuenta
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>

      {/* Modal de Bienvenida */}
      <Dialog open={showWelcome} onOpenChange={(open) => {
        if (!open) {
          handleCloseWelcome();
        }
      }}>
        <DialogContent className="sm:max-w-2xl bg-gray-900/95 backdrop-blur-xl border-2 border-[#14b4a1]/30 max-h-[90vh] overflow-y-auto text-white custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30">
                <Shield className="w-8 h-8 text-[#14b4a1]" />
              </div>
              Te damos la bienvenida a Xstar Mail
            </DialogTitle>
            <DialogDescription className="text-base text-white/70 pt-2">
              Donde la privacidad es por defecto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Cifrado avanzado */}
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-[#14b4a1]/20 to-[#14b4a1]/10 border border-[#14b4a1]/30">
              <div className="p-2 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30 flex-shrink-0">
                <Lock className="w-6 h-6 text-[#14b4a1]" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Cifrado avanzado</h3>
                <p className="text-sm text-white/70">
                  Asegura que solo tú y los remitentes esperados podáis acceder a tus correos electrónicos.
                </p>
              </div>
            </div>

            {/* Protección contra spam */}
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-[#14b4a1]/20 to-[#14b4a1]/10 border border-[#14b4a1]/30">
              <div className="p-2 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30 flex-shrink-0">
                <Mail className="w-6 h-6 text-[#14b4a1]" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Protección contra spam líder en la industria</h3>
                <p className="text-sm text-white/70">
                  Mantiene los correos electrónicos de spam fuera de tu bandeja de entrada.
                </p>
              </div>
            </div>

            {/* Protección contra rastreadores */}
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-[#14b4a1]/20 to-[#14b4a1]/10 border border-[#14b4a1]/30">
              <div className="p-2 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30 flex-shrink-0">
                <EyeOff className="w-6 h-6 text-[#14b4a1]" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Protección contra rastreadores</h3>
                <p className="text-sm text-white/70">
                  No más seguimiento a través de internet.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800/50">
            <Button
              onClick={handleCloseWelcome}
              className="h-12 px-8 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-bold rounded-xl shadow-lg shadow-[#14b4a1]/30 hover:shadow-xl hover:shadow-[#14b4a1]/50 transition-all duration-300"
            >
              Comenzar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
