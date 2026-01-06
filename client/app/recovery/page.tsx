"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import {
  KeyRound,
  Loader2,
  Info,
  Shield,
  Mail,
  Phone,
  FileText,
  Smartphone,
  Users,
  AlertTriangle,
  Check,
  Plus,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api";
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

export default function RecoveryPage() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Estados para recuperación de cuenta
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryEmailEnabled, setRecoveryEmailEnabled] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+52");
  const [recoveryPhoneEnabled, setRecoveryPhoneEnabled] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);

  // Estados para recuperación de datos
  const [recoveryPhraseEnabled, setRecoveryPhraseEnabled] = useState(false);
  const [deviceRecoveryEnabled, setDeviceRecoveryEnabled] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState<string | null>(null);
  const [showPhraseDialog, setShowPhraseDialog] = useState(false);
  const [isGeneratingPhrase, setIsGeneratingPhrase] = useState(false);
  const [isSettingUpDevice, setIsSettingUpDevice] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState("");

  // Estados para acceso de emergencia
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState("");

  // Estados para restablecimiento de contraseña
  const [passwordResetEnabled, setPasswordResetEnabled] = useState(false);

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
      loadRecoveryData();
    }
  }, [isAuthenticated, isLoading]);

  const loadRecoveryData = async () => {
    try {
      setIsLoadingData(true);
      const data = await apiClient.getUserPreferences();
      
      if (data.recovery) {
        setRecoveryEmail(data.recovery.email || "");
        setRecoveryEmailEnabled(data.recovery.allowEmailRecovery || false);
        setRecoveryPhone(data.recovery.phone || "");
        setCountryCode(data.recovery.phoneCountryCode || "+52");
        setRecoveryPhoneEnabled(data.recovery.allowPhoneRecovery || false);
        setRecoveryPhraseEnabled(data.recovery.allowRecoveryPhrase || false);
        setDeviceRecoveryEnabled(data.recovery.allowDeviceRecovery || false);
        
        // Si ya tiene frase generada, no mostrar la frase (por seguridad)
        // Solo indicar que ya está configurada
        if (data.recovery.hasRecoveryPhrase) {
          // No establecer generatedPhrase para no mostrar la frase antigua
          // El usuario puede generar una nueva si lo desea
        }
      }
      
      // Cargar contactos de emergencia
      try {
        const contactsData = await apiClient.getEmergencyContacts();
        setEmergencyContacts(contactsData.contacts || []);
      } catch (e) {
        console.error("Error loading emergency contacts:", e);
      }
    } catch (error: any) {
      console.error("Error loading recovery data:", error);
      toast.error(`Error al cargar datos: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveRecoveryEmail = async () => {
    if (!recoveryEmail.trim()) {
      toast.error("Por favor ingrese un correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail.trim())) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    setIsSaving(true);
    try {
      // Enviar código de verificación
      setIsSendingEmailCode(true);
      await apiClient.sendVerificationCode({ email: recoveryEmail.trim() });
      toast.success("Código de verificación enviado a tu correo");
      setIsSendingEmailCode(false);
      
      // Mostrar diálogo para ingresar código
      const code = prompt("Ingrese el código de verificación enviado a su correo:");
      if (!code) {
        setIsSaving(false);
        return;
      }

      setIsVerifyingEmail(true);
      await apiClient.verifyEmailCode({ email: recoveryEmail.trim(), code });
      
      // Guardar email de recuperación
      await apiClient.updateRecoverySettings({
        recoveryEmail: recoveryEmail.trim(),
        allowEmailRecovery: recoveryEmailEnabled,
      });
      
      toast.success("Dirección de correo de recuperación guardada y verificada");
      await loadRecoveryData();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el correo de recuperación");
    } finally {
      setIsSaving(false);
      setIsSendingEmailCode(false);
      setIsVerifyingEmail(false);
    }
  };

  const handleSaveRecoveryPhone = async () => {
    if (!recoveryPhone.trim()) {
      toast.error("Por favor ingrese un número telefónico");
      return;
    }

    setIsSaving(true);
    try {
      // Enviar código de verificación por SMS
      setIsSendingPhoneCode(true);
      const response = await apiClient.sendPhoneVerificationCode({
        phone: recoveryPhone.trim(),
        countryCode: countryCode,
      });
      
      // En desarrollo, mostrar el código en el toast
      if (response.code) {
        toast.success(`Código enviado (desarrollo: ${response.code})`);
      } else {
        toast.success("Código de verificación enviado a tu teléfono");
      }
      setIsSendingPhoneCode(false);
      
      // Mostrar diálogo para ingresar código
      const enteredCode = prompt("Ingrese el código de verificación enviado a su teléfono:");
      if (!enteredCode) {
        setIsSaving(false);
        return;
      }

      setIsVerifyingPhone(true);
      await apiClient.verifyPhoneCode({
        phone: recoveryPhone.trim(),
        countryCode: countryCode,
        code: enteredCode,
      });
      
      // Guardar teléfono de recuperación
      await apiClient.updateRecoverySettings({
        recoveryPhone: recoveryPhone.trim(),
        recoveryPhoneCountryCode: countryCode,
        allowPhoneRecovery: recoveryPhoneEnabled,
      });
      
      toast.success("Número telefónico de recuperación guardado y verificado");
      await loadRecoveryData();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el teléfono de recuperación");
    } finally {
      setIsSaving(false);
      setIsSendingPhoneCode(false);
      setIsVerifyingPhone(false);
    }
  };

  const handleAddEmergencyContact = async () => {
    if (!newContactEmail) {
      toast.error("Por favor ingrese un correo electrónico");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContactEmail.trim())) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.addEmergencyContact(newContactEmail.trim());
      setNewContactEmail("");
      setShowAddContact(false);
      toast.success("Contacto de emergencia agregado");
      await loadRecoveryData();
    } catch (error: any) {
      toast.error(error.message || "Error al agregar contacto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmergencyContact = async (email: string) => {
    try {
      await apiClient.removeEmergencyContact(email);
      toast.success("Contacto de emergencia eliminado");
      await loadRecoveryData();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar contacto");
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsSaving(true);
    try {
      await apiClient.forgotPassword(user?.email || "");
      toast.success("Solicitud de restablecimiento de contraseña enviada a tu correo");
    } catch (error: any) {
      toast.error(error.message || "Error al solicitar restablecimiento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRecoveryEmail = async (enabled: boolean) => {
    setRecoveryEmailEnabled(enabled);
    try {
      await apiClient.updateRecoverySettings({
        allowEmailRecovery: enabled,
      });
      toast.success(enabled ? "Recuperación por correo habilitada" : "Recuperación por correo deshabilitada");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar configuración");
      setRecoveryEmailEnabled(!enabled);
    }
  };

  const handleToggleRecoveryPhone = async (enabled: boolean) => {
    setRecoveryPhoneEnabled(enabled);
    try {
      await apiClient.updateRecoverySettings({
        allowPhoneRecovery: enabled,
      });
      toast.success(enabled ? "Recuperación por teléfono habilitada" : "Recuperación por teléfono deshabilitada");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar configuración");
      setRecoveryPhoneEnabled(!enabled);
    }
  };

  const handleToggleRecoveryPhrase = async (enabled: boolean) => {
    if (enabled && !generatedPhrase) {
      // Si se habilita y no hay frase generada, generar una
      setIsGeneratingPhrase(true);
      try {
        const response = await apiClient.generateRecoveryPhrase();
        setGeneratedPhrase(response.phrase);
        setShowPhraseDialog(true);
        await apiClient.updateRecoverySettings({
          allowRecoveryPhrase: true,
        });
        toast.success("Frase de recuperación generada. Guárdala en un lugar seguro.");
      } catch (error: any) {
        toast.error(error.message || "Error al generar frase de recuperación");
        setRecoveryPhraseEnabled(false);
      } finally {
        setIsGeneratingPhrase(false);
      }
    } else {
      setRecoveryPhraseEnabled(enabled);
      try {
        await apiClient.updateRecoverySettings({
          allowRecoveryPhrase: enabled,
        });
        toast.success(enabled ? "Recuperación con frase habilitada" : "Recuperación con frase deshabilitada");
      } catch (error: any) {
        toast.error(error.message || "Error al actualizar configuración");
        setRecoveryPhraseEnabled(!enabled);
      }
    }
  };

  const handleGeneratePhrase = async () => {
    setIsGeneratingPhrase(true);
    try {
      const response = await apiClient.generateRecoveryPhrase();
      setGeneratedPhrase(response.phrase);
      setShowPhraseDialog(true);
      toast.success("Frase de recuperación generada. Guárdala en un lugar seguro.");
    } catch (error: any) {
      toast.error(error.message || "Error al generar frase de recuperación");
    } finally {
      setIsGeneratingPhrase(false);
    }
  };

  const handleToggleDeviceRecovery = async (enabled: boolean) => {
    if (enabled) {
      // Si se habilita, configurar el dispositivo actual
      setIsSettingUpDevice(true);
      try {
        // Obtener información del dispositivo
        const deviceInfo = `${navigator.userAgent} - ${new Date().toISOString()}`;
        await apiClient.setupDeviceRecovery(deviceInfo);
        setDeviceRecoveryEnabled(true);
        toast.success("Dispositivo de confianza configurado exitosamente");
      } catch (error: any) {
        toast.error(error.message || "Error al configurar dispositivo");
        setDeviceRecoveryEnabled(false);
      } finally {
        setIsSettingUpDevice(false);
      }
    } else {
      setDeviceRecoveryEnabled(enabled);
      try {
        await apiClient.updateRecoverySettings({
          allowDeviceRecovery: enabled,
        });
        toast.success("Recuperación desde dispositivo deshabilitada");
      } catch (error: any) {
        toast.error(error.message || "Error al actualizar configuración");
        setDeviceRecoveryEnabled(!enabled);
      }
    }
  };

  const handleSetupDeviceFromOther = async () => {
    setIsSettingUpDevice(true);
    try {
      const deviceInfo = prompt("Ingrese información del dispositivo (opcional):") || `${navigator.userAgent} - ${new Date().toISOString()}`;
      await apiClient.setupDeviceRecovery(deviceInfo);
      toast.success("Dispositivo de confianza configurado exitosamente");
      await loadRecoveryData();
    } catch (error: any) {
      toast.error(error.message || "Error al configurar dispositivo");
    } finally {
      setIsSettingUpDevice(false);
    }
  };

  const handleDownloadRecoveryFile = async () => {
    try {
      // Generar archivo de recuperación
      const recoveryData = {
        userId: user?.id,
        email: user?.email,
        recoveryPhrase: "No configurada", // La frase de recuperación no está disponible en el objeto User
        timestamp: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(recoveryData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xstar-recovery-${user?.email}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Archivo de recuperación descargado");
    } catch (error: any) {
      toast.error(error.message || "Error al descargar archivo");
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
          <p className="text-white/70 font-medium">Cargando recuperación...</p>
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
                      <KeyRound className="w-7 h-7 text-white/90" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Recuperación
                      </h1>
                      <p className="text-white/60 mt-1 text-sm md:text-base">
                        Proteja su cuenta y configure métodos de recuperación
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proteja la cuenta - Advertencia */}
                <div className="group relative overflow-hidden rounded-2xl border border-orange-800/50 bg-gradient-to-br from-orange-950/30 to-orange-950/20 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-orange-900/40 border border-orange-800/50 flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h2 className="text-xl font-bold text-white">
                        Proteja la cuenta
                      </h2>
                      <p className="text-sm text-white/70 leading-relaxed">
                        Está en riesgo de perder el acceso a la cuenta y sus datos. Si pierde los datos de inicio de sesión y necesita restablecer la cuenta, es obligatorio que tenga configurados un método de recuperación de la cuenta y de los datos, de lo contrario, es posible que no pueda acceder a ninguno de sus correos electrónicos, contactos, archivos o contraseñas.
                      </p>
                      <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-600 text-white font-semibold shadow-lg shadow-orange-600/20">
                        Proteger la cuenta ahora
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recuperación de cuenta */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Shield className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Recuperación de cuenta
                      </h2>
                      <p className="text-sm text-white/50">Métodos para recuperar el acceso</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-6">

                    {/* Dirección de correo de recuperación */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                          <Mail className="w-5 h-5 text-white/70" />
                        </div>
                        <Label className="text-white font-semibold">
                          Dirección de correo de recuperación
                        </Label>
                      </div>
                      <div className="flex gap-3">
                        <Input
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="flex-1 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                        />
                        <Button
                          onClick={handleSaveRecoveryEmail}
                          disabled={isSaving || isSendingEmailCode || isVerifyingEmail}
                          className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                        >
                          {isSaving || isSendingEmailCode || isVerifyingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isSendingEmailCode ? "Enviando código..." : isVerifyingEmail ? "Verificando..." : "Guardando..."}
                            </>
                          ) : (
                            "Guardar y Verificar"
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/60">
                          Permitir recuperación por correo electrónico
                        </p>
                        <Switch
                          checked={recoveryEmailEnabled}
                          onCheckedChange={handleToggleRecoveryEmail}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Número telefónico de recuperación */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                          <Phone className="w-5 h-5 text-white/70" />
                        </div>
                        <Label className="text-white font-semibold">
                          Número telefónico de recuperación
                        </Label>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-32 bg-gray-900/50 border-gray-700/50 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800">
                              <SelectItem value="+52" className="text-white">México +52</SelectItem>
                              <SelectItem value="+1" className="text-white">USA +1</SelectItem>
                              <SelectItem value="+34" className="text-white">España +34</SelectItem>
                              <SelectItem value="+54" className="text-white">Argentina +54</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="tel"
                            value={recoveryPhone}
                            onChange={(e) => setRecoveryPhone(e.target.value)}
                            placeholder="222 123 4567"
                            className="flex-1 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                          />
                        </div>
                        <Button
                          onClick={handleSaveRecoveryPhone}
                          disabled={isSaving || isSendingPhoneCode || isVerifyingPhone}
                          className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                        >
                          {isSaving || isSendingPhoneCode || isVerifyingPhone ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isSendingPhoneCode ? "Enviando código..." : isVerifyingPhone ? "Verificando..." : "Guardando..."}
                            </>
                          ) : (
                            "Guardar y Verificar"
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/60">
                          Permitir recuperación por teléfono
                        </p>
                        <Switch
                          checked={recoveryPhoneEnabled}
                          onCheckedChange={handleToggleRecoveryPhone}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recuperación de datos */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <FileText className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Recuperación de datos
                      </h2>
                      <p className="text-sm text-white/50">Métodos para recuperar sus datos</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-6">
                    <p className="text-sm text-white/60 leading-relaxed">
                      Active al menos un método de recuperación de datos para asegurarse de tener acceso a los contenidos de la cuenta si pierde la contraseña.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Info className="w-4 h-4" />
                      <span>Más información acerca de la recuperación de datos</span>
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Frase de recuperación */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <KeyRound className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">
                              Frase de recuperación
                            </Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="ml-2 text-white/40 hover:text-[#14b4a1] transition-colors">
                                  <Info className="w-4 h-4 inline" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Frase de recuperación</DialogTitle>
                                  <DialogDescription className="text-white/70">
                                    Una frase de recuperación le permite acceder a la cuenta y recuperar los mensajes cifrados si olvida la contraseña.
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <Switch
                          checked={recoveryPhraseEnabled}
                          onCheckedChange={handleToggleRecoveryPhrase}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                      <p className="text-sm text-white/50 ml-12">
                        Permitir recuperación con una frase de recuperación
                      </p>
                      {recoveryPhraseEnabled && (
                        <div className="ml-12 mt-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 space-y-3">
                          {generatedPhrase ? (
                            <>
                              <p className="text-sm text-white/80 font-medium">Tu frase de recuperación generada:</p>
                              <div className="p-4 rounded-lg bg-gray-900/50 border-2 border-[#14b4a1]/30">
                                <p className="text-white font-mono text-sm break-words text-center leading-relaxed">{generatedPhrase}</p>
                              </div>
                              <p className="text-xs text-orange-400/80 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Guarda esta frase en un lugar seguro. No la compartas con nadie. Solo se mostrará una vez.</span>
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    if (generatedPhrase) {
                                      navigator.clipboard.writeText(generatedPhrase);
                                      toast.success("Frase copiada al portapapeles");
                                    }
                                  }}
                                  variant="outline"
                                  className="flex-1 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                                >
                                  Copiar frase
                                </Button>
                                <Button
                                  onClick={handleGeneratePhrase}
                                  disabled={isGeneratingPhrase}
                                  variant="outline"
                                  className="flex-1 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                                >
                                  {isGeneratingPhrase ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Generando...
                                    </>
                                  ) : (
                                    "Generar nueva"
                                  )}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-white/60 mb-2">
                                Genera una frase de recuperación única para poder acceder a tu cuenta si olvidas tu contraseña.
                              </p>
                              <Button
                                onClick={handleGeneratePhrase}
                                disabled={isGeneratingPhrase}
                                className="w-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                              >
                                {isGeneratingPhrase ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <KeyRound className="w-4 h-4 mr-2" />
                                    Generar frase de recuperación
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Recuperación desde un dispositivo */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <Smartphone className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">
                              Recuperación desde un dispositivo
                            </Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="ml-2 text-white/40 hover:text-[#14b4a1] transition-colors">
                                  <Info className="w-4 h-4 inline" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Recuperación desde un dispositivo</DialogTitle>
                                  <DialogDescription className="text-white/70">
                                    Almacenamos de forma segura la información de recuperación en el dispositivo de confianza para evitar que pierda los datos.
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <Switch
                          checked={deviceRecoveryEnabled}
                          onCheckedChange={handleToggleDeviceRecovery}
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>
                      <p className="text-sm text-white/50 ml-12">
                        Permitir recuperación usando un dispositivo de confianza
                      </p>
                      {deviceRecoveryEnabled && (
                        <div className="ml-12 mt-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 space-y-3">
                          <p className="text-sm text-white/80">
                            Este dispositivo está configurado como dispositivo de confianza.
                          </p>
                          <Button
                            onClick={handleSetupDeviceFromOther}
                            disabled={isSettingUpDevice}
                            variant="outline"
                            className="w-full border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                          >
                            {isSettingUpDevice ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Configurando...
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-4 h-4 mr-2" />
                                Configurar otro dispositivo
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Archivo de recuperación */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                          <FileText className="w-5 h-5 text-white/70" />
                        </div>
                        <div>
                          <Label className="text-white font-semibold">
                            Archivo de recuperación
                          </Label>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="ml-2 text-white/40 hover:text-[#14b4a1] transition-colors">
                                <Info className="w-4 h-4 inline" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800 text-white">
                              <DialogHeader>
                                <DialogTitle className="text-white">Archivo de recuperación</DialogTitle>
                                <DialogDescription className="text-white/70">
                                  Un archivo de recuperación le permite desbloquear y ver los datos después de una recuperación de la cuenta.
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleDownloadRecoveryFile}
                        className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar archivo de recuperación
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Acceso de emergencia */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Users className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Acceso de emergencia
                      </h2>
                      <p className="text-sm text-white/50">Contactos de confianza</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-6">
                    {/* Personas en las que confío */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Personas en las que confío
                        </h3>
                        <p className="text-sm text-white/60">
                          Pueden pedir acceder a mi cuenta en caso de emergencia.
                        </p>
                      </div>
                      {emergencyContacts.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center">
                          <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                          <p className="text-white/60 font-medium mb-4">
                            No hay contactos de emergencia configurados
                          </p>
                          <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                            <DialogTrigger asChild>
                              <Button
                                className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                                onClick={() => setShowAddContact(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir contacto de emergencia
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800 text-white">
                              <DialogHeader>
                                <DialogTitle className="text-white">Añadir contacto de emergencia</DialogTitle>
                                <DialogDescription className="text-white/70">
                                  Ingrese el correo electrónico de la persona en la que confía.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label className="text-white/70">Correo electrónico</Label>
                                  <Input
                                    type="email"
                                    value={newContactEmail}
                                    onChange={(e) => setNewContactEmail(e.target.value)}
                                    placeholder="contacto@ejemplo.com"
                                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                                  />
                                </div>
                                <Button
                                  onClick={handleAddEmergencyContact}
                                  disabled={isSaving || !newContactEmail}
                                  className="w-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Agregando...
                                    </>
                                  ) : (
                                    "Agregar contacto"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {emergencyContacts.map((contact, index) => (
                            <div
                              key={index}
                              className="group flex items-center justify-between p-4 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                                  <Mail className="w-5 h-5 text-white/70" />
                                </div>
                                <span className="text-white font-medium">{contact.email}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/40 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => handleRemoveEmergencyContact(contact.email)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => setShowAddContact(true)}
                            className="w-full border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Añadir contacto de emergencia
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-gray-800/50" />

                    {/* Personas que confían en mí */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        Personas que confían en mí
                      </h3>
                      <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center">
                        <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                        <p className="text-white/60">
                          Aún no se le ha designado como contacto de emergencia para nadie.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ajustes de restablecimiento de contraseña */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <KeyRound className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Ajustes de restablecimiento de contraseña
                      </h2>
                      <p className="text-sm text-white/50">Configuración de seguridad</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl space-y-6">
                    <p className="text-sm text-white/60 leading-relaxed">
                      Para mejorar la seguridad de la cuenta y proteger los datos, puede solicitar un restablecimiento de contraseña desde los ajustes de la cuenta en la aplicación web.
                    </p>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                      <p className="text-sm text-white font-medium">
                        Permitir el restablecimiento de contraseña desde los ajustes
                      </p>
                      <Switch
                        checked={passwordResetEnabled}
                        onCheckedChange={setPasswordResetEnabled}
                        className="data-[state=checked]:bg-[#14b4a1]"
                      />
                    </div>
                    <Button
                      onClick={handleRequestPasswordReset}
                      disabled={isSaving || !passwordResetEnabled}
                      className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold shadow-lg shadow-[#14b4a1]/20 hover:shadow-xl hover:shadow-[#14b4a1]/30"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Solicitar el restablecimiento de contraseña"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>

      {/* Dialog para mostrar frase de recuperación */}
      <AlertDialog open={showPhraseDialog} onOpenChange={(open) => {
        setShowPhraseDialog(open);
        if (!open) {
          // Cuando se cierra, mantener la frase en el estado para mostrarla en la sección
          // No limpiar generatedPhrase para que se siga mostrando
        }
      }}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">Frase de recuperación generada</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Guarda esta frase en un lugar seguro. La necesitarás para recuperar tu cuenta si olvidas tu contraseña.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="p-6 rounded-xl bg-gray-800/50 border-2 border-[#14b4a1]/30">
              <p className="text-white font-mono text-lg text-center break-words leading-relaxed">
                {generatedPhrase}
              </p>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-orange-950/30 border border-orange-800/50">
              <p className="text-sm text-orange-300/90 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Importante:</strong> Esta frase solo se mostrará una vez. Si la pierdes, no podrás recuperar tu cuenta.
                  Guárdala en un lugar seguro y nunca la compartas con nadie.
                </span>
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">
              Cerrar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (generatedPhrase) {
                  navigator.clipboard.writeText(generatedPhrase);
                  toast.success("Frase copiada al portapapeles");
                }
              }}
              className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
            >
              Copiar frase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
