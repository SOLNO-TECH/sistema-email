"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import type { Domain } from "@/lib/api";
import {
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  AlertCircle,
  Settings,
  Mail,
  Save,
  Eye,
  EyeOff,
  Info,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
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

export default function DomainsPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [smtpDialogOpen, setSmtpDialogOpen] = useState<number | null>(null);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  const [smtpConfig, setSmtpConfig] = useState({
    smtpProvider: "" as "sendgrid" | "mailgun" | "smtp" | "gmail" | "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpApiKey: "",
  });

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
      loadDomains();
    }
  }, [isAuthenticated]);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDomains();
      setDomains(data);
      setError(null);
    } catch (error: any) {
      console.error("Error loading domains:", error);
      toast.error("Error al cargar los dominios");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);

    try {
      const domain = await apiClient.addDomain({ domainName: domainName.trim() });
      toast.success(`Dominio ${domain.domainName} agregado exitosamente`);
      setDomainName("");
      await loadDomains();
    } catch (err: any) {
      const errorMessage = err.message || "Error al agregar el dominio";
      if (err.code === "LIMIT_REACHED" || errorMessage.includes("límite")) {
        setError(
          errorMessage + " Ve a la sección de Planes para actualizar tu suscripción."
        );
      } else if (errorMessage.includes("Domain exists") || errorMessage.includes("ya está")) {
        setError("Este dominio ya está registrado");
      } else {
        setError(errorMessage);
      }
      toast.error(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId: number) => {
    setVerifying(domainId);
    try {
      await apiClient.verifyDomain(domainId);
      toast.success("DNS verificado");
      await loadDomains();
    } catch (error: any) {
      toast.error("Error al verificar DNS");
    } finally {
      setVerifying(null);
    }
  };

  const handleSaveSmtp = async (domainId: number) => {
    setSavingSmtp(true);
    try {
      // Convertir "" a undefined para campos opcionales
      const configToSend = {
        ...smtpConfig,
        smtpProvider: smtpConfig.smtpProvider === "" ? undefined : smtpConfig.smtpProvider,
      };
      await apiClient.updateDomainSmtp(domainId, configToSend);
      toast.success("Configuración SMTP guardada");
      setSmtpDialogOpen(null);
      await loadDomains();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar configuración");
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;
    
    setDeleting(domainToDelete.id);
    try {
      await apiClient.deleteDomain(domainToDelete.id);
      toast.success(`Dominio ${domainToDelete.domainName} eliminado exitosamente`);
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
      await loadDomains();
    } catch (error: any) {
      if (error.emailAccountsCount) {
        toast.error(
          `No se puede eliminar el dominio porque tiene ${error.emailAccountsCount} cuenta(s) de correo asociada(s). Elimina las cuentas primero.`
        );
      } else {
        toast.error(error.message || "Error al eliminar dominio");
      }
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
            <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Cargando dominios...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const verifiedDomains = domains.filter((d) => d.dnsVerified).length;
  const unverifiedDomains = domains.length - verifiedDomains;

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
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                        <Globe className="w-7 h-7 text-white/90" />
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                          Mis Dominios
                        </h1>
                        <p className="text-white/60 mt-1 text-sm md:text-base">
                          Gestiona y verifica tus dominios vinculados
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={loadDomains}
                      disabled={loading}
                      className="gap-2 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      Actualizar
                    </Button>
                  </div>

                  {/* Estadísticas */}
                  {domains.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Total</p>
                            <p className="text-3xl font-bold text-white">{domains.length}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Globe className="w-6 h-6 text-white/90" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Verificados</p>
                            <p className="text-3xl font-bold text-[#14b4a1]">
                              {verifiedDomains}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30">
                            <CheckCircle2 className="w-6 h-6 text-[#14b4a1]" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Pendientes</p>
                            <p className="text-3xl font-bold text-orange-400">
                              {unverifiedDomains}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
                            <XCircle className="w-6 h-6 text-orange-400" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-5 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Con SMTP</p>
                            <p className="text-3xl font-bold text-white">
                              {domains.filter((d) => (d as any).smtpProvider).length}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Mail className="w-6 h-6 text-white/90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulario para agregar dominio */}
                <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                      <Plus className="w-5 h-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Vincular Nuevo Dominio
                    </h2>
                  </div>

                  <form onSubmit={handleAddDomain} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="domainName" className="text-white/70 font-medium">
                        Nombre del dominio
                      </Label>
                      <Input
                        id="domainName"
                        type="text"
                        placeholder="ejemplo.com"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                        required
                      />
                      <p className="text-xs text-white/50">
                        Ingresa el dominio que ya tienes para vincularlo a tu cuenta
                      </p>
                    </div>

                    {error && (
                      <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={adding}
                      className="gap-2 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold h-12"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Agregando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Vincular Dominio
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Lista de dominios */}
                <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                      <Globe className="w-5 h-5 text-white/90" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Dominios Vinculados
                    </h2>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
                        <p className="text-white/60">Cargando dominios...</p>
                      </div>
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="text-center py-20 space-y-6 border-2 border-dashed border-gray-800 rounded-xl">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gray-800/60 border border-gray-700/50 flex items-center justify-center">
                        <Globe className="w-10 h-10 text-white/30" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">
                          No tienes dominios vinculados
                        </h3>
                        <p className="text-white/60 mb-6 max-w-md mx-auto">
                          Vincula tu primer dominio para comenzar a crear cuentas de correo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {domains.map((domain) => (
                        <div
                          key={domain.id}
                          className="group rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-sm p-6 hover:shadow-xl hover:border-gray-700/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50 flex-shrink-0">
                                <Globe className="w-6 h-6 text-white/90" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <h3 className="font-bold text-xl text-white">
                                    {domain.domainName}
                                  </h3>
                                  {domain.dnsVerified ? (
                                    <Badge className="bg-[#14b4a1]/20 text-[#14b4a1] border-[#14b4a1]/30">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Verificado
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Pendiente
                                    </Badge>
                                  )}
                                  {(domain as any).smtpProvider && (
                                    <Badge className="bg-gray-800/60 text-white/90 border-gray-700/50">
                                      <Mail className="w-3 h-3 mr-1" />
                                      SMTP: {(domain as any).smtpProvider}
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-2 text-sm text-white/60">
                                  {domain.mxRecord && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3" />
                                      <span className="font-mono">MX: {domain.mxRecord}</span>
                                    </div>
                                  )}
                                  {domain.spfRecord && (
                                    <div className="flex items-center gap-2">
                                      <Info className="w-3 h-3" />
                                      <span className="font-mono text-xs truncate">
                                        SPF: {domain.spfRecord.substring(0, 50)}...
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-xs pt-2 text-white/50">
                                    Agregado el {new Date(domain.createdAt).toLocaleDateString("es-ES")}
                                  </div>
                                </div>

                                {!domain.dnsVerified && (
                                  <div className="mt-4 rounded-xl border border-orange-800/50 bg-gradient-to-br from-orange-950/30 to-orange-950/20 backdrop-blur-sm p-3">
                                    <div className="flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                      <div className="text-xs text-white/70">
                                        <p className="font-medium mb-1 text-white/90">Configuración DNS requerida</p>
                                        <p className="text-white/60">
                                          Configura los registros DNS en tu proveedor de dominio para verificar.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {!domain.dnsVerified && (
                                  <div className="mt-3 rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-950/30 to-blue-950/20 backdrop-blur-sm p-3">
                                    <div className="flex items-start gap-2">
                                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                      <div className="text-xs text-white/70">
                                        <p className="font-medium mb-1 text-white/90">💡 Importante</p>
                                        <p className="text-white/60">
                                          Para enviar correos desde este dominio, configura SMTP (SendGrid, Mailgun, etc.) 
                                          usando el botón "SMTP" abajo.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyDomain(domain.id)}
                                disabled={verifying === domain.id}
                                className="gap-2 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                              >
                                {verifying === domain.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                Verificar DNS
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDomainToDelete(domain);
                                  setDeleteDialogOpen(true);
                                }}
                                className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-900/50 hover:border-red-800/50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </Button>

                              <Dialog
                                open={smtpDialogOpen === domain.id}
                                onOpenChange={(open) => {
                                  setSmtpDialogOpen(open ? domain.id : null);
                                  if (open) {
                                    setSmtpConfig({
                                      smtpProvider: (domain as any).smtpProvider || "",
                                      smtpHost: (domain as any).smtpHost || "",
                                      smtpPort: (domain as any).smtpPort || 587,
                                      smtpUser: (domain as any).smtpUser || "",
                                      smtpPassword: "",
                                      smtpApiKey: "",
                                    });
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-2 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50">
                                    <Settings className="w-4 h-4" />
                                    SMTP
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white custom-scrollbar">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Configuración SMTP - {domain.domainName}</DialogTitle>
                                    <DialogDescription className="text-white/70">
                                      Configura cómo se enviarán los correos desde este dominio. 
                                      Los correos se enviarán desde las cuentas creadas (ej: admin@{domain.domainName}).
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-950/30 to-blue-950/20 backdrop-blur-sm p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                      <div className="text-sm text-white/70">
                                        <p className="font-medium mb-1 text-white/90">¿Cómo funciona?</p>
                                        <p className="text-xs text-white/60">
                                          Cuando crees una cuenta como <code className="bg-blue-900/50 px-1 rounded">admin@{domain.domainName}</code>, 
                                          los correos se enviarán desde esa dirección usando la configuración SMTP que definas aquí.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleSaveSmtp(domain.id);
                                    }}
                                    className="space-y-4"
                                  >
                                    <div className="space-y-2">
                                      <Label htmlFor="smtpProvider" className="text-white/70">Proveedor SMTP</Label>
                                      <Select
                                        value={smtpConfig.smtpProvider}
                                        onValueChange={(value: any) =>
                                          setSmtpConfig({ ...smtpConfig, smtpProvider: value })
                                        }
                                      >
                                        <SelectTrigger className="h-12 bg-gray-800/50 border-gray-700/50 text-white">
                                          <SelectValue placeholder="Selecciona un proveedor" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-800">
                                          <SelectItem value="sendgrid" className="text-white hover:bg-gray-800">
                                            <div className="flex items-center gap-2">
                                              <Mail className="w-4 h-4" />
                                              SendGrid (Recomendado)
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="mailgun" className="text-white hover:bg-gray-800">
                                            <div className="flex items-center gap-2">
                                              <Mail className="w-4 h-4" />
                                              Mailgun
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="smtp" className="text-white hover:bg-gray-800">
                                            <div className="flex items-center gap-2">
                                              <Settings className="w-4 h-4" />
                                              SMTP Personalizado
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="gmail" className="text-white hover:bg-gray-800">
                                            <div className="flex items-center gap-2">
                                              <Mail className="w-4 h-4" />
                                              Gmail (Solo desarrollo)
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <p className="text-xs text-white/50">
                                        {smtpConfig.smtpProvider === "sendgrid" &&
                                          "SendGrid permite enviar desde tu dominio. Verifica tu dominio en SendGrid y usa tu API Key."}
                                        {smtpConfig.smtpProvider === "mailgun" &&
                                          "Mailgun similar a SendGrid. Verifica tu dominio en Mailgun y usa tu API Key."}
                                        {smtpConfig.smtpProvider === "smtp" &&
                                          "Usa tu propio servidor SMTP (Postfix, etc.). Requiere host, puerto, usuario y contraseña."}
                                        {smtpConfig.smtpProvider === "gmail" &&
                                          "⚠️ Solo para desarrollo. Los correos pueden ir a spam si el remitente no es Gmail."}
                                      </p>
                                    </div>

                                    {(smtpConfig.smtpProvider === "sendgrid" ||
                                      smtpConfig.smtpProvider === "mailgun") && (
                                      <div className="space-y-2">
                                        <Label htmlFor="smtpApiKey" className="text-white/70">API Key</Label>
                                        <div className="relative">
                                          <Input
                                            id="smtpApiKey"
                                            type={showPassword ? "text" : "password"}
                                            value={smtpConfig.smtpApiKey}
                                            onChange={(e) =>
                                              setSmtpConfig({
                                                ...smtpConfig,
                                                smtpApiKey: e.target.value,
                                              })
                                            }
                                            placeholder={
                                              smtpConfig.smtpProvider === "sendgrid"
                                                ? "SG.xxxxx"
                                                : "key-xxxxx"
                                            }
                                            className="h-12 pr-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                          >
                                            {showPassword ? (
                                              <EyeOff className="w-4 h-4" />
                                            ) : (
                                              <Eye className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                        <p className="text-xs text-white/50">
                                          {smtpConfig.smtpProvider === "sendgrid" && (
                                            <>
                                              Obtén tu API Key en{" "}
                                              <a
                                                href="https://app.sendgrid.com/settings/api_keys"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-[#14b4a1] text-[#14b4a1]"
                                              >
                                                SendGrid Settings
                                              </a>
                                              . Verifica tu dominio en SendGrid primero.
                                            </>
                                          )}
                                          {smtpConfig.smtpProvider === "mailgun" && (
                                            <>
                                              Obtén tu API Key en{" "}
                                              <a
                                                href="https://app.mailgun.com/app/account/security/api_keys"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-[#14b4a1] text-[#14b4a1]"
                                              >
                                                Mailgun Dashboard
                                              </a>
                                              . Verifica tu dominio en Mailgun primero.
                                            </>
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    {smtpConfig.smtpProvider === "smtp" && (
                                      <>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="smtpHost" className="text-white/70">Host SMTP</Label>
                                            <Input
                                              id="smtpHost"
                                              value={smtpConfig.smtpHost}
                                              onChange={(e) =>
                                                setSmtpConfig({
                                                  ...smtpConfig,
                                                  smtpHost: e.target.value,
                                                })
                                              }
                                              placeholder="mail.midominio.com"
                                              className="h-12 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="smtpPort" className="text-white/70">Puerto</Label>
                                            <Input
                                              id="smtpPort"
                                              type="number"
                                              value={smtpConfig.smtpPort}
                                              onChange={(e) =>
                                                setSmtpConfig({
                                                  ...smtpConfig,
                                                  smtpPort: parseInt(e.target.value) || 587,
                                                })
                                              }
                                              placeholder="587"
                                              className="h-12 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="smtpUser" className="text-white/70">Usuario SMTP</Label>
                                          <Input
                                            id="smtpUser"
                                            value={smtpConfig.smtpUser}
                                            onChange={(e) =>
                                              setSmtpConfig({
                                                ...smtpConfig,
                                                smtpUser: e.target.value,
                                              })
                                            }
                                            placeholder="noreply@midominio.com"
                                            className="h-12 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="smtpPassword" className="text-white/70">Contraseña SMTP</Label>
                                          <div className="relative">
                                            <Input
                                              id="smtpPassword"
                                              type={showPassword ? "text" : "password"}
                                              value={smtpConfig.smtpPassword}
                                              onChange={(e) =>
                                                setSmtpConfig({
                                                  ...smtpConfig,
                                                  smtpPassword: e.target.value,
                                                })
                                              }
                                              placeholder="••••••••"
                                              className="h-12 pr-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setShowPassword(!showPassword)}
                                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            >
                                              {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                              ) : (
                                                <Eye className="w-4 h-4" />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {smtpConfig.smtpProvider === "gmail" && (
                                      <div className="rounded-xl border border-yellow-800/50 bg-gradient-to-br from-yellow-950/30 to-yellow-950/20 backdrop-blur-sm p-4">
                                        <p className="text-sm text-yellow-400">
                                          ⚠️ <strong>Limitación:</strong> Gmail solo permite enviar desde direcciones Gmail. 
                                          Si envías desde <code className="bg-yellow-900/50 px-1 rounded">
                                            admin@{domain.domainName}
                                          </code>
                                          , el correo puede ir a spam o ser rechazado.
                                        </p>
                                        <p className="text-xs text-yellow-300 mt-2">
                                          Usa SendGrid o Mailgun para producción. Configura las variables globales en .env:
                                          EMAIL_SMTP_USER y EMAIL_SMTP_PASSWORD.
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/50">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSmtpDialogOpen(null)}
                                        className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={savingSmtp}
                                        className="gap-2 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                                      >
                                        {savingSmtp ? (
                                          <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Guardando...
                                          </>
                                        ) : (
                                          <>
                                            <Save className="w-4 h-4" />
                                            Guardar Configuración
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Eliminar dominio?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Estás a punto de eliminar el dominio{" "}
              <strong className="text-white">{domainToDelete?.domainName}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
            {domainToDelete && (
              <div className="mt-4 rounded-xl border border-orange-800/50 bg-gradient-to-br from-orange-950/30 to-orange-950/20 backdrop-blur-sm p-3">
                <div className="text-sm text-orange-400">
                  <strong>⚠️ Importante:</strong> Si el dominio tiene cuentas de correo
                  asociadas, deberás eliminarlas primero.
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDomain}
              disabled={deleting !== null}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              {deleting !== null ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
