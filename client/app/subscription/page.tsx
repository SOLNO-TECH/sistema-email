"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient, type Plan, type UserLimits, type Invoice } from "@/lib/api";
import {
  CreditCard,
  Wallet,
  Receipt,
  Bell,
  Gift,
  Loader2,
  Info,
  Check,
  ChevronRight,
  Plus,
  Download,
  Mail,
  Calendar,
  HardDrive,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
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

export default function SubscriptionPage() {
  const { isAuthenticated, isLoading, checkAuth, user, setUser } = useAuthStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [giftCode, setGiftCode] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddPayPal, setShowAddPayPal] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");

  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [notifications, setNotifications] = useState({
    emailSubscriptions: {
      importantAnnouncements: true,
      businessNewsletter: false,
      protonNewsletter: true,
      offersPromotions: false,
      welcomeEmails: true,
      userSurveys: false,
    },
    productUpdates: {
      mailCalendar: true,
      drive: true,
      pass: true,
      wallet: true,
      vpn: true,
      lumo: true,
    },
    appNotifications: {
      inApp: true,
    },
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
    if (isAuthenticated && !isLoading) {
      loadSubscriptionData();
    }
  }, [isAuthenticated, isLoading]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoadingData(true);
      const [planData, limitsData, invoicesData, creditsData, preferencesData] = await Promise.all([
        apiClient.getCurrentPlan(),
        apiClient.getUserLimits(),
        apiClient.getInvoices(),
        apiClient.getUserCredits().catch(() => ({ credits: 0 })),
        apiClient.getUserPreferences().catch(() => ({ preferences: {}, recovery: {}, credits: 0, security: {} })),
      ]);

      setCurrentPlan(planData.plan);
      setUserLimits(limitsData);
      setInvoices(invoicesData);
      setAvailableCredits(creditsData.credits || 0);

      // Cargar preferencias de notificaciones
      if (preferencesData.preferences?.notifications) {
        setNotifications(preferencesData.preferences.notifications);
      }

      // Cargar métodos de pago del usuario
      if (user?.paymentMethod && user?.paymentDetails) {
        try {
          const paymentDetails =
            typeof user.paymentDetails === "string"
              ? JSON.parse(user.paymentDetails)
              : user.paymentDetails;
          setPaymentMethods([
            {
              type: user.paymentMethod,
              ...paymentDetails,
            },
          ]);
        } catch (e) {
          console.error("Error parsing payment details:", e);
        }
      }
    } catch (error: any) {
      console.error("Error loading subscription data:", error);
      toast.error(`Error al cargar datos: ${error.message || "Intenta nuevamente"}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) {
      toast.error("Por favor ingrese un código de regalo");
      return;
    }
    setIsSaving(true);
    try {
      const result = await apiClient.applyGiftCode(giftCode.trim());
      toast.success(`Código de regalo aplicado exitosamente. Se agregaron $${result.creditsAdded} créditos.`);
      setGiftCode("");
      setAvailableCredits(result.totalCredits);
      await loadSubscriptionData();
    } catch (error: any) {
      toast.error(error.message || "Error al aplicar código de regalo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async (method: "card" | "paypal") => {
    setIsSaving(true);
    try {
      const paymentDetails: any = {
        type: method,
      };
      
      if (method === "card") {
        // En producción, aquí procesarías la tarjeta con un servicio de pago seguro
        paymentDetails.brand = "visa";
        paymentDetails.last4 = "4242"; // Simulado
      }

      await apiClient.updateProfile({
        paymentMethod: method,
        paymentDetails: paymentDetails,
      });

      toast.success(
        method === "card"
          ? "Tarjeta agregada exitosamente"
          : "PayPal agregado exitosamente"
      );
      
      // Recargar datos del usuario
      const { user: updatedUser } = await apiClient.getMe();
      setUser(updatedUser);
      
      // Recargar datos de suscripción
      await loadSubscriptionData();
      
      setShowAddCard(false);
      setShowAddPayPal(false);
    } catch (error: any) {
      toast.error(error.message || "Error al agregar método de pago");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCredits = async () => {
    if (!creditsAmount || parseFloat(creditsAmount) <= 0) {
      toast.error("Por favor ingrese una cantidad válida");
      return;
    }
    setIsSaving(true);
    try {
      const result = await apiClient.addCredits(parseFloat(creditsAmount));
      toast.success(`$${creditsAmount} créditos agregados exitosamente`);
      setAvailableCredits(result.credits);
      setShowAddCredits(false);
      setCreditsAmount("");
    } catch (error: any) {
      toast.error(error.message || "Error al agregar créditos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = (category: string, key: string, value: boolean) => {
    setNotifications((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const currentPreferences = await apiClient.getUserPreferences().catch(() => ({ preferences: {} }));
      await apiClient.updateUserPreferences({
        ...currentPreferences.preferences,
        notifications: notifications,
      });
      toast.success("Preferencias de notificaciones guardadas");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar preferencias");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
          <p className="text-muted-foreground">Cargando suscripción...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const planName = currentPlan?.name || "Sin plan";
  const planDescription = currentPlan?.description || "No tienes un plan activo";
  const maxStorageGB = userLimits?.maxStorageGB || 0.5;
  const currentStorageGB = userLimits?.currentStorageGB || 0;
  const storagePercentage = maxStorageGB > 0 ? (currentStorageGB / maxStorageGB) * 100 : 0;

  return (
    <>
      <Toaster />
      <SidebarProvider className="bg-sidebar">
        <DashboardSidebar />
        <div className="h-svh overflow-hidden lg:p-2 w-full">
          <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto w-full">
              <div className="p-4 sm:p-6 md:p-8 lg:p-12 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 md:space-y-10">
                {/* Header */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                        Suscripción
                      </h1>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                        Gestiona tu plan, métodos de pago y facturas
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Su plan */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Su plan</h2>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                          {planName}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          {planDescription}
                        </p>
                        {currentPlan && userLimits && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                              <div className="text-xs text-muted-foreground font-medium mb-1">
                                Correos electrónicos
                              </div>
                              <div className="text-lg sm:text-xl font-bold text-foreground">
                                {userLimits.currentEmails} / {userLimits.maxEmails === -1 ? "∞" : userLimits.maxEmails}
                              </div>
                              {userLimits.maxEmails !== -1 && (
                                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className="bg-foreground h-1.5 rounded-full transition-all"
                                    style={{ 
                                      width: `${Math.min((userLimits.currentEmails / userLimits.maxEmails) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                              <div className="text-xs text-muted-foreground font-medium mb-1">
                                Dominios
                              </div>
                              <div className="text-lg sm:text-xl font-bold text-foreground">
                                {userLimits.currentDomains} / {userLimits.maxDomains === -1 ? "∞" : userLimits.maxDomains}
                              </div>
                              {userLimits.maxDomains !== -1 && (
                                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className="bg-foreground h-1.5 rounded-full transition-all"
                                    style={{ 
                                      width: `${Math.min((userLimits.currentDomains / userLimits.maxDomains) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                              <div className="text-xs text-muted-foreground font-medium mb-1">
                                Almacenamiento
                              </div>
                              <div className="text-lg sm:text-xl font-bold text-foreground">
                                {userLimits.currentStorageGB.toFixed(2)} / {userLimits.maxStorageGB === -1 ? "∞" : userLimits.maxStorageGB} GB
                              </div>
                              {userLimits.maxStorageGB !== -1 && (
                                <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className="bg-foreground h-1.5 rounded-full transition-all"
                                    style={{ 
                                      width: `${Math.min((userLimits.currentStorageGB / userLimits.maxStorageGB) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                              Almacenamiento de Mail usado
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground">
                                  <Info className="w-4 h-4" />
                                </button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Almacenamiento de Mail</DialogTitle>
                                  <DialogDescription>
                                    El almacenamiento se utiliza para guardar todos tus correos
                                    electrónicos. Puedes obtener más espacio actualizando tu plan.
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                            {currentStorageGB.toFixed(2)} GB de {maxStorageGB} GB
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-foreground h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 h-12"
                        onClick={() => router.push("/plans")}
                      >
                        Obtener más almacenamiento
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Compare nuestros planes */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                      Compare nuestros planes
                    </h2>
                    <Button
                      variant="outline"
                      className="h-10 w-full sm:w-auto"
                      onClick={() => router.push("/plans")}
                    >
                      Ver todos los planes
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Métodos de pago */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                      Métodos de pago
                    </h2>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Puede agregar un método de pago para que la suscripción se renueve
                        automáticamente. También están disponibles otros métodos de pago.
                      </p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Más información</span>
                      </div>

                      {paymentMethods.length === 0 ? (
                        <div className="border border-border rounded-lg p-4 sm:p-6 text-center">
                          <p className="text-sm sm:text-base text-muted-foreground mb-4">
                            No tiene ningún método de pago guardado.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="h-11 w-full sm:w-auto"
                                >
                                  <CreditCard className="w-4 h-4 mr-2 shrink-0" />
                                  <span className="hidden min-[380px]:inline">Agregar tarjeta de crédito/débito</span>
                                  <span className="min-[380px]:hidden">Agregar tarjeta</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Agregar tarjeta de crédito/débito</DialogTitle>
                                  <DialogDescription>
                                    Ingrese los datos de su tarjeta para pagos automáticos.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <Button
                                    onClick={() => handleAddPayment("card")}
                                    disabled={isSaving}
                                    className="w-full"
                                  >
                                    {isSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Procesando...
                                      </>
                                    ) : (
                                      "Continuar"
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog open={showAddPayPal} onOpenChange={setShowAddPayPal}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="h-11 w-full sm:w-auto"
                                >
                                  Agregar PayPal
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Agregar PayPal</DialogTitle>
                                  <DialogDescription>
                                    Conecte su cuenta de PayPal para pagos automáticos.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <Button
                                    onClick={() => handleAddPayment("paypal")}
                                    disabled={isSaving}
                                    className="w-full"
                                  >
                                    {isSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Procesando...
                                      </>
                                    ) : (
                                      "Conectar PayPal"
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {paymentMethods.map((method, index) => (
                            <div
                              key={index}
                              className="border border-border rounded-lg p-3 sm:p-4 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm sm:text-base font-medium text-foreground truncate">
                                    {method.type === "card"
                                      ? `Tarjeta terminada en ${method.last4 || "****"}`
                                      : method.type === "paypal"
                                      ? "PayPal"
                                      : method.type === "bank_account"
                                      ? `Cuenta bancaria ${method.bankName || ""}`
                                      : "Método de pago"}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                    {method.brand ? method.brand.toUpperCase() : method.type === "card" ? "Tarjeta" : "Activo"}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="shrink-0">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Créditos */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Créditos</h2>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Cuando la suscripción se renueve, aplicaremos cualquier crédito disponible
                        antes de cobrar al método de pago anterior.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4" />
                        <span>Más información</span>
                      </div>

                      <div className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            Créditos disponibles
                          </span>
                          <span className="text-lg font-semibold text-foreground">
                            {availableCredits}
                          </span>
                        </div>
                        {/* Funcionalidad de agregar créditos desactivada */}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Código de regalo */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                      Código de regalo
                    </h2>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Si tiene un código de regalo, ingréselo abajo para aplicar el descuento.
                      </p>
                      <form onSubmit={handleGiftCode} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={giftCode}
                            onChange={(e) => setGiftCode(e.target.value)}
                            placeholder="Código de regalo"
                            className="h-11"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isSaving || !giftCode}
                          className="h-11 w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Aplicando...
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Agregar código de regalo</span>
                              <span className="sm:hidden">Agregar</span>
                              <Gift className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Facturas */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Facturas</h2>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Vea, descargue y gestione sus facturas.
                      </p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>Factura</span>
                        <span>•</span>
                        <span>Nota de crédito</span>
                        <span>•</span>
                        <span>Conversión de divisa</span>
                      </div>

                      {invoices.length === 0 ? (
                        <div className="border border-border rounded-lg p-8 text-center">
                          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No tiene facturas.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {invoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className="border border-border rounded-lg p-4 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  Factura #{invoice.id}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {new Date(invoice.createdAt).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                  {invoice.subscription?.Plan && (
                                    <> • {invoice.subscription.Plan.name}</>
                                  )}
                                  {invoice.subscription?.Plan && (
                                    <> • ${invoice.subscription.Plan.priceMonthly.toFixed(2)}</>
                                  )}
                                </p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Descargar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Notificaciones */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Notificaciones</h2>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                    <div className="space-y-4 sm:space-y-6">
                      <p className="text-sm text-muted-foreground">
                        Para informarse de las últimas novedades de los productos de Proton, puede
                        suscribirse a nuestros diferentes boletines y visitar nuestro blog de vez
                        en cuando.
                      </p>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Suscripciones de correo</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Avisos importantes de Proton
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">2 a 4 correos al año</p>
                            </div>
                            <Switch
                              checked={notifications.emailSubscriptions.importantAnnouncements}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(
                                  "emailSubscriptions",
                                  "importantAnnouncements",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Boletín de Proton for Business
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">1 correo al mes</p>
                            </div>
                            <Switch
                              checked={notifications.emailSubscriptions.businessNewsletter}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(
                                  "emailSubscriptions",
                                  "businessNewsletter",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Boletín de Proton
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                1 correo por mes. Obtenga las últimas noticias de privacidad y lo
                                que sucede en Proton.
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailSubscriptions.protonNewsletter}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(
                                  "emailSubscriptions",
                                  "protonNewsletter",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Ofertas y promociones de Proton
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                1 correo por trimestre
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailSubscriptions.offersPromotions}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(
                                  "emailSubscriptions",
                                  "offersPromotions",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Correos electrónicos de bienvenida de Proton
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Durante el primer mes de uso de Proton
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailSubscriptions.welcomeEmails}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(
                                  "emailSubscriptions",
                                  "welcomeEmails",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Encuesta a los usuarios de Proton
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Participe en las encuestas para mejorar los servicios de Proton
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailSubscriptions.userSurveys}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(
                                  "emailSubscriptions",
                                  "userSurveys",
                                  checked
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">
                          Actualizaciones de productos
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Actualizaciones de producto para Proton Mail y Calendar
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">1 correo al mes</p>
                            </div>
                            <Switch
                              checked={notifications.productUpdates.mailCalendar}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("productUpdates", "mailCalendar", checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Actualizaciones de producto para Proton Drive
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">4 a 6 correos al año</p>
                            </div>
                            <Switch
                              checked={notifications.productUpdates.drive}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("productUpdates", "drive", checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Actualizaciones de producto para Proton Pass
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">4 a 6 correos al año</p>
                            </div>
                            <Switch
                              checked={notifications.productUpdates.pass}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("productUpdates", "pass", checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Actualizaciones de producto para Proton Wallet
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">4 a 6 correos al año</p>
                            </div>
                            <Switch
                              checked={notifications.productUpdates.wallet}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("productUpdates", "wallet", checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Actualizaciones de producto para Proton VPN
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">4 a 6 correos al año</p>
                            </div>
                            <Switch
                              checked={notifications.productUpdates.vpn}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("productUpdates", "vpn", checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Actualizaciones de producto para Lumo
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">4 a 6 correos al año</p>
                            </div>
                            <Switch
                              checked={notifications.productUpdates.lumo}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("productUpdates", "lumo", checked)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">
                          Notificaciones de la aplicación
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                              <Label className="text-xs sm:text-sm text-foreground font-medium">
                                Notificaciones dentro de la aplicación
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Más información: Las notificaciones críticas de la cuenta seguirán
                                llegando
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Desactivarlo impedirá que reciba notificaciones de las aplicaciones
                                de Proton
                              </p>
                            </div>
                            <Switch
                              checked={notifications.appNotifications.inApp}
                              onCheckedChange={(checked) =>
                                handleNotificationChange("appNotifications", "inApp", checked)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveNotifications}
                        disabled={isSaving}
                        className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 h-11 sm:h-12 mt-4"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Guardar preferencias de notificaciones</span>
                            <span className="sm:hidden">Guardar</span>
                            <Bell className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
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

