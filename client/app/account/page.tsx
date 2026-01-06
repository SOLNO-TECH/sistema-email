"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import {
  User,
  Loader2,
  Info,
  KeyRound,
  Shield,
  Smartphone,
  Trash2,
  Edit,
  Check,
  X,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const { isAuthenticated, isLoading, checkAuth, user, setUser } = useAuthStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);

  // Estados para cuenta
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");

  // Estados para contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Estados para autenticación
  const [twoPasswordMode, setTwoPasswordMode] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"app" | "security_key" | null>(null);
  const [authAppEnabled, setAuthAppEnabled] = useState(false);
  const [securityKeyEnabled, setSecurityKeyEnabled] = useState(false);
  
  // Estados para 2FA
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [manualEntryKey, setManualEntryKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isGeneratingSecret, setIsGeneratingSecret] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // Estado para eliminar cuenta
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (isAuthenticated && !isLoading && user) {
      setUsername(user.email?.split("@")[0] || "");
      setDisplayName(user.name || "");
      setOriginalDisplayName(user.name || "");
      loadSecurityData();
      setIsLoadingData(false);
    } else if (!isLoading && !user) {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadSecurityData = async () => {
    try {
      const data = await apiClient.getUserPreferences();
      if (data.security) {
        setTwoPasswordMode(data.security.twoPasswordMode || false);
        setTwoFactorEnabled(data.security.twoFactorEnabled || false);
        // Validar que twoFactorMethod sea uno de los valores permitidos
        const method = data.security.twoFactorMethod;
        const validMethod: "app" | "security_key" | null = 
          method === "app" || method === "security_key" ? method : null;
        setTwoFactorMethod(validMethod);
        setAuthAppEnabled(data.security.twoFactorEnabled && method === "app");
        setSecurityKeyEnabled(data.security.twoFactorEnabled && method === "security_key");
      }
    } catch (error: any) {
      console.error("Error loading security data:", error);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("El nombre a mostrar no puede estar vacío");
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiClient.updateProfile({
        name: displayName,
      });
      setUser(response.user);
      setOriginalDisplayName(displayName);
      setIsEditingDisplayName(false);
      toast.success("Nombre a mostrar actualizado exitosamente");
    } catch (error: any) {
      toast.error(`Error al actualizar: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditDisplayName = () => {
    setDisplayName(originalDisplayName);
    setIsEditingDisplayName(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Contraseña actualizada exitosamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(`Error al cambiar contraseña: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTwoPasswordMode = async (enabled: boolean) => {
    setTwoPasswordMode(enabled);
    try {
      await apiClient.updateSecuritySettings({
        twoPasswordMode: enabled,
      });
      toast.success(enabled ? "Modo de dos contraseñas habilitado" : "Modo de dos contraseñas deshabilitado");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar configuración");
      setTwoPasswordMode(!enabled);
    }
  };

  const handleGenerate2FASecret = async () => {
    setIsGeneratingSecret(true);
    try {
      const response = await apiClient.generate2FASecret();
      setQrCode(response.qrCode);
      setManualEntryKey(response.manualEntryKey);
      setShow2FASetup(true);
    } catch (error: any) {
      toast.error(error.message || "Error al generar secret");
    } finally {
      setIsGeneratingSecret(false);
    }
  };

  const handleVerify2FACode = async (method: "app" | "security_key") => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Ingrese un código de 6 dígitos");
      return;
    }
    setIsVerifyingCode(true);
    try {
      await apiClient.verify2FACode(verificationCode, method);
      await apiClient.updateSecuritySettings({
        twoFactorEnabled: true,
        twoFactorMethod: method,
      });
      setTwoFactorEnabled(true);
      setTwoFactorMethod(method);
      setAuthAppEnabled(method === "app");
      setSecurityKeyEnabled(method === "security_key");
      setShow2FASetup(false);
      setVerificationCode("");
      toast.success("Autenticación de dos factores habilitada exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Código inválido");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt("Ingrese su contraseña para deshabilitar 2FA:");
    if (!password) return;
    
    
    setIsSaving(true);
    try {
      await apiClient.disable2FA(password);
      await apiClient.updateSecuritySettings({
        twoFactorEnabled: false,
        twoFactorMethod: undefined,
      });
      setTwoFactorEnabled(false);
      setTwoFactorMethod(null);
      setAuthAppEnabled(false);
      setSecurityKeyEnabled(false);
      toast.success("Autenticación de dos factores deshabilitada");
    } catch (error: any) {
      toast.error(error.message || "Error al deshabilitar 2FA");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAuthApp = async (enabled: boolean) => {
    if (enabled && !twoFactorEnabled) {
      // Si se habilita y no hay 2FA configurado, generar secret
      await handleGenerate2FASecret();
    } else if (!enabled && twoFactorEnabled && twoFactorMethod === "app") {
      // Si se deshabilita y está usando app, deshabilitar 2FA
      await handleDisable2FA();
    } else {
      setAuthAppEnabled(enabled);
    }
  };

  const handleToggleSecurityKey = async (enabled: boolean) => {
    if (enabled && !twoFactorEnabled) {
      // Si se habilita y no hay 2FA configurado, generar secret
      await handleGenerate2FASecret();
    } else if (!enabled && twoFactorEnabled && twoFactorMethod === "security_key") {
      // Si se deshabilita y está usando security_key, deshabilitar 2FA
      await handleDisable2FA();
    } else {
      setSecurityKeyEnabled(enabled);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Ingrese su contraseña para confirmar");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.deleteAccount(deletePassword);
      toast.success("Cuenta eliminada exitosamente");
      localStorage.removeItem("token");
      router.push("/auth");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar cuenta");
      setDeletePassword("");
    } finally {
      setIsSaving(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
            <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Cargando cuenta...</p>
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
                      <User className="w-7 h-7 text-white/90" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Cuenta y contraseña
                      </h1>
                      <p className="text-white/60 mt-1 text-sm md:text-base">
                        Gestiona tu información de cuenta y configuración de seguridad
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nombre de usuario */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <User className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Nombre de usuario
                      </h2>
                      <p className="text-sm text-white/50">Identificador único de tu cuenta</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white/70 font-medium">Nombre de usuario</Label>
                        <Input
                          type="text"
                          value={username}
                          disabled
                          className="bg-gray-900/50 border-gray-700/50 text-white/50 cursor-not-allowed"
                        />
                        <p className="text-sm text-white/50 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          El nombre de usuario no se puede cambiar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nombre a mostrar */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <User className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Nombre a mostrar
                      </h2>
                      <p className="text-sm text-white/50">Cómo te verán otros usuarios</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-4">
                      {!isEditingDisplayName ? (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                          <div>
                            <Label className="text-white/70 font-medium">Nombre a mostrar</Label>
                            <p className="text-lg font-semibold text-white mt-1">
                              {displayName || username}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingDisplayName(true)}
                            className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-white/70 font-medium">Nombre a mostrar</Label>
                            <Input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="Ingrese su nombre"
                              className="bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={handleSaveDisplayName}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Guardar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCancelEditDisplayName}
                              disabled={isSaving}
                              className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <KeyRound className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Contraseña</h2>
                      <p className="text-sm text-white/50">Gestiona la seguridad de tu contraseña</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold shadow-lg shadow-[#14b4a1]/20">
                          Cambiar contraseña
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Cambiar contraseña</DialogTitle>
                          <DialogDescription className="text-white/70">
                            Ingrese su contraseña actual y la nueva contraseña
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-white/70">Contraseña actual</Label>
                            <div className="relative">
                              <Input
                                type={showPasswords.current ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    current: !showPasswords.current,
                                  })
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                              >
                                {showPasswords.current ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white/70">Nueva contraseña</Label>
                            <div className="relative">
                              <Input
                                type={showPasswords.new ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    new: !showPasswords.new,
                                  })
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white/70">Confirmar nueva contraseña</Label>
                            <div className="relative">
                              <Input
                                type={showPasswords.confirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    confirm: !showPasswords.confirm,
                                  })
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                              >
                                {showPasswords.confirm ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="submit"
                              disabled={isSaving}
                              className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Cambiando...
                                </>
                              ) : (
                                "Cambiar contraseña"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <div className="h-px bg-gray-800/50" />

                    {/* Modo de dos contraseñas */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/30">
                            <KeyRound className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">
                              Modo de dos contraseñas
                            </Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="ml-2 text-white/40 hover:text-[#14b4a1] transition-colors">
                                  <Info className="w-4 h-4 inline" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Modo de dos contraseñas</DialogTitle>
                                  <DialogDescription className="text-white/70">
                                    El modo de dos contraseñas requiere dos contraseñas: una para iniciar sesión en su cuenta y otra para descifrar sus datos. (Avanzado)
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <Switch
                          checked={twoPasswordMode}
                          onCheckedChange={handleToggleTwoPasswordMode}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                      <p className="text-sm text-white/50 ml-12">
                        Requiere dos contraseñas separadas para mayor seguridad
                      </p>
                    </div>
                  </div>
                </div>

                {/* Autenticación de dos factores */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Shield className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Autenticación de dos factores
                      </h2>
                      <p className="text-sm text-white/50">Añade una capa adicional de seguridad</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-6">
                    <div>
                      <p className="text-sm text-white/60 leading-relaxed mb-2">
                        Añada una capa adicional de seguridad a la cuenta. Necesitará verificarse con una autenticación de dos factores cada vez que inicia sesión.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Info className="w-4 h-4" />
                        <span>Más información</span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Aplicación de autenticación */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/30">
                            <Smartphone className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">
                              Aplicación de autenticación
                            </Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="ml-2 text-white/40 hover:text-[#14b4a1] transition-colors">
                                  <Info className="w-4 h-4 inline" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Aplicación de autenticación</DialogTitle>
                                  <DialogDescription className="text-white/70">
                                    Verifique su identidad con una clave de uso único basada en tiempo desde la aplicación de autenticación
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <Switch
                          checked={authAppEnabled}
                          onCheckedChange={handleToggleAuthApp}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                      <p className="text-sm text-white/50 ml-12">
                        Usa una app como Google Authenticator o Authy
                      </p>
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Clave de seguridad */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/30">
                            <Shield className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">
                              Clave de seguridad
                            </Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="ml-2 text-white/40 hover:text-[#14b4a1] transition-colors">
                                  <Info className="w-4 h-4 inline" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Clave de seguridad</DialogTitle>
                                  <DialogDescription className="text-white/70">
                                    Verifique su identidad con una llave de seguridad U2F o FIDO2
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <Switch
                          checked={securityKeyEnabled}
                          onCheckedChange={handleToggleSecurityKey}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                      <p className="text-sm text-white/50 ml-12">
                        Usa una llave física de seguridad
                      </p>
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Xstar Authenticator */}
                    <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-800/40 to-gray-800/20 p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          Obtenga Xstar Authenticator para todos sus dispositivos
                        </h3>
                        <p className="text-sm text-white/60">
                          Descargue la aplicación e importe los códigos existentes.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-950/30 border border-orange-800/50">
                        <p className="text-sm text-orange-300/90 flex items-center gap-2">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span>Esta opción estará disponible próximamente</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialog para configurar 2FA */}
                <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
                  <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Configurar autenticación de dos factores</DialogTitle>
                      <DialogDescription className="text-white/70">
                        Escanee el código QR con su aplicación de autenticación o ingrese la clave manualmente
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {qrCode && (
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                      )}
                      {manualEntryKey && (
                        <div className="space-y-2">
                          <Label className="text-white/70">Clave manual</Label>
                          <div className="flex gap-2">
                            <Input
                              value={manualEntryKey}
                              readOnly
                              className="bg-gray-800/50 border-gray-700/50 text-white font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(manualEntryKey);
                                toast.success("Clave copiada al portapapeles");
                              }}
                              className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-white/70">Código de verificación</Label>
                        <Input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 text-center text-2xl tracking-widest"
                        />
                        <p className="text-xs text-white/50">
                          Ingrese el código de 6 dígitos de su aplicación de autenticación
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShow2FASetup(false);
                          setVerificationCode("");
                          setQrCode("");
                          setManualEntryKey("");
                        }}
                        className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => {
                          if (authAppEnabled || (!authAppEnabled && !securityKeyEnabled)) {
                            handleVerify2FACode("app");
                          } else {
                            handleVerify2FACode("security_key");
                          }
                        }}
                        disabled={!verificationCode || verificationCode.length !== 6 || isVerifyingCode}
                        className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                      >
                        {isVerifyingCode ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Verificar y habilitar"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Eliminar cuenta */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Trash2 className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Eliminar cuenta</h2>
                      <p className="text-sm text-white/50">Acción permanente e irreversible</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-red-900/50 bg-gradient-to-br from-red-950/30 to-red-950/20 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-900/40 border border-red-800/50">
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white/70 leading-relaxed">
                            Esto eliminará permanentemente la cuenta y todos los datos. No podrá reactivar esta cuenta. Esta acción no se puede deshacer.
                          </p>
                        </div>
                      </div>
                      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20"
                            disabled={isSaving}
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar cuenta permanentemente
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/70">
                              Esta acción no se puede deshacer. Esto eliminará permanentemente su cuenta y todos sus datos. No podrá reactivar esta cuenta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <div className="space-y-2">
                              <Label className="text-white/70">Ingrese su contraseña para confirmar</Label>
                              <Input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                              />
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel 
                              className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
                              onClick={() => {
                                setDeletePassword("");
                                setShowDeleteDialog(false);
                              }}
                            >
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Eliminando...
                                </>
                              ) : (
                                "Eliminar cuenta permanentemente"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
