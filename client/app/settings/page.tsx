"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import {
  Settings,
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Phone,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { isAuthenticated, isLoading, checkAuth, user, setUser } = useAuthStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "",
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
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
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      if (user.paymentMethod) {
        setPaymentData((prev) => ({
          ...prev,
          paymentMethod: user.paymentMethod || "",
        }));

        if (user.paymentDetails) {
          const details = user.paymentDetails;
          setPaymentData((prev) => ({
            ...prev,
            cardNumber: details.last4 ? `**** **** **** ${details.last4}` : "",
            cardHolder: details.accountHolder || "",
            bankName: details.bankName || "",
            accountNumber: details.accountNumber || "",
          }));
        }
      }

      setIsLoadingProfile(false);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await apiClient.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });

      setUser(response.user);
      toast.success("Perfil actualizado exitosamente");
    } catch (error: any) {
      toast.error(`Error al actualizar perfil: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (profileData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSaving(true);

    try {
      await apiClient.changePassword({
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword,
      });

      toast.success("Contraseña actualizada exitosamente");
      setProfileData({
        ...profileData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(`Error al cambiar contraseña: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const paymentDetails: any = {};

      if (paymentData.paymentMethod === "card") {
        paymentDetails.type = "card";
        paymentDetails.last4 = paymentData.cardNumber.slice(-4);
        paymentDetails.brand = "visa";
        paymentDetails.accountHolder = paymentData.cardHolder;
      } else if (paymentData.paymentMethod === "bank_account") {
        paymentDetails.type = "bank_account";
        paymentDetails.bankName = paymentData.bankName;
        paymentDetails.accountNumber = paymentData.accountNumber;
        paymentDetails.accountHolder = paymentData.accountHolder;
      }

      const response = await apiClient.updateProfile({
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: paymentDetails,
      });

      setUser(response.user);
      toast.success("Método de pago actualizado exitosamente");
    } catch (error: any) {
      toast.error(`Error al actualizar método de pago: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Preferencias guardadas");
    } catch (error: any) {
      toast.error(`Error al guardar preferencias: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingProfile) {
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
                      <Settings className="w-7 h-7 text-white/90" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Configuración
                      </h1>
                      <p className="text-white/60 mt-1 text-sm md:text-base">
                        Gestiona tu perfil, seguridad y preferencias
                      </p>
                    </div>
                  </div>
                </div>

                {/* Perfil */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <User className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Información Personal</h2>
                      <p className="text-sm text-white/50">Actualiza tu información de perfil</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white/70 font-medium flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nombre completo
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            value={profileData.name}
                            onChange={(e) =>
                              setProfileData({ ...profileData, name: e.target.value })
                            }
                            className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                            placeholder="Tu nombre completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/70 font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Correo electrónico
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            className="h-12 bg-gray-900/50 border-gray-700/50 text-white/50 cursor-not-allowed"
                            placeholder="correo@ejemplo.com"
                            disabled
                          />
                          <p className="text-xs text-white/50 flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            El correo electrónico no se puede cambiar
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white/70 font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Número telefónico
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) =>
                              setProfileData({ ...profileData, phone: e.target.value })
                            }
                            className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold h-12"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar cambios
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <CreditCard className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Método de Pago</h2>
                      <p className="text-sm text-white/50">Gestiona tus métodos de pago</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <form onSubmit={handlePaymentUpdate} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-white/70 font-medium flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Método de pago principal
                        </Label>
                        <Select
                          value={paymentData.paymentMethod}
                          onValueChange={(value) =>
                            setPaymentData({ ...paymentData, paymentMethod: value })
                          }
                        >
                          <SelectTrigger className="h-12 bg-gray-900/50 border-gray-700/50 text-white">
                            <SelectValue placeholder="Selecciona un método de pago" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-800">
                            <SelectItem value="card" className="text-white hover:bg-gray-800">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Tarjeta de crédito/débito
                              </div>
                            </SelectItem>
                            <SelectItem value="bank_account" className="text-white hover:bg-gray-800">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Cuenta bancaria
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentData.paymentMethod === "card" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 space-y-0">
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber" className="text-white/70">
                              Número de tarjeta
                            </Label>
                            <Input
                              id="cardNumber"
                              type="text"
                              value={paymentData.cardNumber}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  cardNumber: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cardHolder" className="text-white/70">
                              Titular de la tarjeta
                            </Label>
                            <Input
                              id="cardHolder"
                              type="text"
                              value={paymentData.cardHolder}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  cardHolder: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="Nombre completo"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expiryDate" className="text-white/70">
                              Fecha de expiración
                            </Label>
                            <Input
                              id="expiryDate"
                              type="text"
                              value={paymentData.expiryDate}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  expiryDate: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="MM/AA"
                              maxLength={5}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cvv" className="text-white/70">
                              CVV
                            </Label>
                            <Input
                              id="cvv"
                              type="text"
                              value={paymentData.cvv}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  cvv: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      )}

                      {paymentData.paymentMethod === "bank_account" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 space-y-0">
                          <div className="space-y-2">
                            <Label htmlFor="bankName" className="text-white/70">
                              Nombre del banco
                            </Label>
                            <Input
                              id="bankName"
                              type="text"
                              value={paymentData.bankName}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  bankName: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="Nombre del banco"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="accountNumber" className="text-white/70">
                              Número de cuenta
                            </Label>
                            <Input
                              id="accountNumber"
                              type="text"
                              value={paymentData.accountNumber}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  accountNumber: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="Número de cuenta"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="accountHolder" className="text-white/70">
                              Titular de la cuenta
                            </Label>
                            <Input
                              id="accountHolder"
                              type="text"
                              value={paymentData.accountHolder}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  accountHolder: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                              placeholder="Nombre completo del titular"
                            />
                          </div>
                        </div>
                      )}

                      {paymentData.paymentMethod && (
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold h-12"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Guardar método de pago
                            </>
                          )}
                        </Button>
                      )}
                    </form>
                  </div>
                </div>

                {/* Seguridad */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Lock className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Seguridad</h2>
                      <p className="text-sm text-white/50">Gestiona la seguridad de tu cuenta</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-white/70 font-medium">
                          Contraseña actual
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={profileData.currentPassword}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30 pr-10"
                            placeholder="••••••••"
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-white/70 font-medium">
                            Nueva contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? "text" : "password"}
                              value={profileData.newPassword}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  newPassword: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30 pr-10"
                              placeholder="••••••••"
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
                          <Label htmlFor="confirmPassword" className="text-white/70 font-medium">
                            Confirmar nueva contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={profileData.confirmPassword}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className="h-12 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30 pr-10"
                              placeholder="••••••••"
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
                      </div>

                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold h-12"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cambiando...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Cambiar contraseña
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Preferencias */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Bell className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Preferencias</h2>
                      <p className="text-sm text-white/50">Gestiona tus preferencias de notificaciones</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/50 transition-all">
                        <div className="space-y-1">
                          <Label htmlFor="emailNotifications" className="text-white font-semibold">
                            Notificaciones por correo
                          </Label>
                          <p className="text-sm text-white/60">
                            Recibe notificaciones importantes por correo electrónico
                          </p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={preferences.emailNotifications}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              emailNotifications: checked,
                            })
                          }
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/50 transition-all">
                        <div className="space-y-1">
                          <Label htmlFor="marketingEmails" className="text-white font-semibold">
                            Correos de marketing
                          </Label>
                          <p className="text-sm text-white/60">
                            Recibe ofertas especiales y actualizaciones de productos
                          </p>
                        </div>
                        <Switch
                          id="marketingEmails"
                          checked={preferences.marketingEmails}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              marketingEmails: checked,
                            })
                          }
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/50 transition-all">
                        <div className="space-y-1">
                          <Label htmlFor="securityAlerts" className="text-white font-semibold">
                            Alertas de seguridad
                          </Label>
                          <p className="text-sm text-white/60">
                            Recibe alertas sobre actividad sospechosa en tu cuenta
                          </p>
                        </div>
                        <Switch
                          id="securityAlerts"
                          checked={preferences.securityAlerts}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              securityAlerts: checked,
                            })
                          }
                          className="data-[state=checked]:bg-[#14b4a1]"
                        />
                      </div>

                      <Button
                        onClick={handlePreferencesUpdate}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold h-12 mt-4"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar preferencias
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Información de la cuenta */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                      <Shield className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Información de la cuenta</h2>
                      <p className="text-sm text-white/50">Detalles de tu cuenta</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                        <div>
                          <p className="text-sm text-white/60 mb-1">Rol</p>
                          <p className="text-base font-semibold text-white capitalize">
                            {user?.role || "Usuario"}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30">
                          <CheckCircle2 className="w-5 h-5 text-[#14b4a1]" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                        <div>
                          <p className="text-sm text-white/60 mb-1">ID de usuario</p>
                          <p className="text-base font-semibold text-white">
                            {user?.id || "N/A"}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/30">
                          <Shield className="w-5 h-5 text-white/70" />
                        </div>
                      </div>
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
