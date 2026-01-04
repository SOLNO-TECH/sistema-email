"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiClient, type Plan, type UserLimits, type Invoice } from "@/lib/api";
import { 
  HardDrive, 
  CreditCard, 
  Plus, 
  Loader2, 
  Trash2, 
  FileText, 
  Bell,
  Gift,
  Wallet,
  Sparkles,
  TrendingUp,
  Shield,
  Download,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
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

export function DashboardContent() {
  const { user } = useAuthStore();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [creditsAmount, setCreditsAmount] = useState("");
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [paymentMethodType, setPaymentMethodType] = useState<"card" | "paypal">("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [deletePaymentMethodId, setDeletePaymentMethodId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [notifications, setNotifications] = useState({
    emailSubscriptions: {
      importantAnnouncements: true,
      businessNewsletter: false,
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
    },
    appNotifications: {
      inApp: true,
    },
  });

  // Mapeo de traducciones para las notificaciones
  const notificationLabels: Record<string, Record<string, string>> = {
    emailSubscriptions: {
      importantAnnouncements: "Anuncios Importantes",
      businessNewsletter: "Boletín de Negocios",
      offersPromotions: "Ofertas y Promociones",
      welcomeEmails: "Correos de Bienvenida",
      userSurveys: "Encuestas de Usuario",
    },
    productUpdates: {
      mailCalendar: "Mail y Calendario",
      drive: "Drive",
      pass: "Pass",
      wallet: "Wallet",
      vpn: "VPN",
    },
    appNotifications: {
      inApp: "En la Aplicación",
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planData, limitsData, creditsData, invoicesData] = await Promise.all([
        apiClient.getCurrentPlan(),
        apiClient.getUserLimits(),
        apiClient.getUserCredits?.().catch(() => ({ credits: 0 })) || Promise.resolve({ credits: 0 }),
        apiClient.getInvoices?.().catch(() => []) || Promise.resolve([]),
      ]);

      setCurrentPlan(planData.plan);
      setLimits(limitsData);
      setAvailableCredits(creditsData.credits || 0);
      setInvoices(invoicesData || []);

      // Cargar métodos de pago guardados
      try {
        const paymentMethodsData = await apiClient.getPaymentMethods();
        setPaymentMethods(paymentMethodsData.paymentMethods || []);
      } catch (e) {
        console.error("Error loading payment methods:", e);
        // Fallback a método antiguo si existe
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
          } catch (err) {
            console.error("Error parsing payment details:", err);
          }
        }
      }

      // Cargar preferencias de notificaciones
      if (user?.preferences) {
        try {
          const userPreferences = typeof user.preferences === "string" 
            ? JSON.parse(user.preferences) 
            : user.preferences;
          
          if (userPreferences && typeof userPreferences === "object") {
            // Si tiene preferencias de notificaciones, usarlas
            if (userPreferences.emailSubscriptions || userPreferences.productUpdates || userPreferences.appNotifications) {
              setNotifications({
                emailSubscriptions: {
                  importantAnnouncements: userPreferences.emailSubscriptions?.importantAnnouncements ?? true,
                  businessNewsletter: userPreferences.emailSubscriptions?.businessNewsletter ?? false,
                  offersPromotions: userPreferences.emailSubscriptions?.offersPromotions ?? false,
                  welcomeEmails: userPreferences.emailSubscriptions?.welcomeEmails ?? true,
                  userSurveys: userPreferences.emailSubscriptions?.userSurveys ?? false,
                },
                productUpdates: {
                  mailCalendar: userPreferences.productUpdates?.mailCalendar ?? true,
                  drive: userPreferences.productUpdates?.drive ?? true,
                  pass: userPreferences.productUpdates?.pass ?? true,
                  wallet: userPreferences.productUpdates?.wallet ?? true,
                  vpn: userPreferences.productUpdates?.vpn ?? true,
                },
                appNotifications: {
                  inApp: userPreferences.appNotifications?.inApp ?? true,
                },
              });
            }
          }
        } catch (e) {
          console.error("Error parsing user preferences:", e);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) {
      toast.error("Por favor ingrese un código promocional");
      return;
    }
    try {
      const result = await apiClient.applyGiftCode(promoCode.trim());
      toast.success(result.message || "Código promocional aplicado exitosamente");
      setPromoCode("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Error al aplicar el código promocional");
    }
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditsAmount || parseFloat(creditsAmount) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    // Verificar que tenga métodos de pago registrados
    if (paymentMethods.length === 0) {
      toast.error("No tienes métodos de pago registrados. Por favor, agrega un método de pago antes de añadir créditos.", {
        duration: 5000,
      });
      setShowAddCredits(false);
      setShowAddPaymentMethod(true);
      return;
    }

    setIsAddingCredits(true);
    try {
      const amount = parseFloat(creditsAmount);
      const result = await apiClient.addCredits(amount);
      
      if (result.success) {
        toast.success(result.message || `Se añadieron ${amount}€ de créditos exitosamente`);
        setCreditsAmount("");
        setShowAddCredits(false);
        await loadData();
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error al añadir créditos";
      toast.error(errorMessage, {
        duration: 5000,
      });
      
      // Si el error indica que no hay método de pago, abrir el diálogo de agregar método
      if (errorMessage.includes("métodos de pago registrados") || errorMessage.includes("método de pago")) {
        setShowAddCredits(false);
        setShowAddPaymentMethod(true);
      }
    } finally {
      setIsAddingCredits(false);
    }
  };

  const handleNotificationToggle = async (category: string, key: string, value: boolean) => {
    const newNotifications = {
      ...notifications,
      [category]: {
        ...notifications[category as keyof typeof notifications],
        [key]: value,
      },
    };
    
    setNotifications(newNotifications);
    
    try {
      // Guardar preferencias en el backend
      await apiClient.updateProfile({
        preferences: JSON.stringify(newNotifications),
      });
      toast.success("Preferencias de notificaciones actualizadas");
    } catch (error: any) {
      console.error("Error saving notification preferences:", error);
      toast.error("Error al guardar las preferencias");
      // Revertir el cambio si falla
      setNotifications(notifications);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPaymentMethod(true);

    try {
      if (paymentMethodType === "card") {
        // Validar datos de tarjeta
        if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
          toast.error("Por favor completa todos los campos");
          setIsAddingPaymentMethod(false);
          return;
        }

        const cardNumber = cardData.cardNumber.replace(/\s/g, "");
        if (cardNumber.length < 13 || cardNumber.length > 19) {
          toast.error("Número de tarjeta inválido");
          setIsAddingPaymentMethod(false);
          return;
        }

        const result = await apiClient.addPaymentMethod({
          type: "card",
          cardData: {
            ...cardData,
            cardNumber: cardNumber,
          },
        });

        if (result.success) {
          toast.success(result.message || "Método de pago agregado exitosamente");
          setShowAddPaymentMethod(false);
          setCardData({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
          await loadData();
        }
      } else if (paymentMethodType === "paypal") {
        const result = await apiClient.addPaymentMethod({
          type: "paypal",
        });

        if (result.success) {
          toast.success(result.message || "Método de pago PayPal agregado exitosamente");
          setShowAddPaymentMethod(false);
          await loadData();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al agregar método de pago");
    } finally {
      setIsAddingPaymentMethod(false);
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!deletePaymentMethodId) return;

    try {
      const result = await apiClient.deletePaymentMethod(deletePaymentMethodId);
      if (result.success) {
        toast.success(result.message || "Método de pago eliminado exitosamente");
        setShowDeleteDialog(false);
        setDeletePaymentMethodId(null);
        await loadData();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar método de pago");
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (loading) {
    return (
      <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
            <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white/70 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const storagePercentage = limits && limits.maxStorageGB !== -1 
    ? Math.round((limits.currentStorageGB / limits.maxStorageGB) * 100) 
    : 0;

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 sm:p-5 md:p-7 lg:p-8 h-full relative bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
      {/* Enhanced background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-gradient-to-br from-[#14b4a1]/12 via-[#14b4a1]/8 to-[#14b4a1]/3 rounded-full blur-[180px] -mr-[450px] -mt-[450px] animate-float" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-[#13282b]/20 via-[#13282b]/12 to-[#13282b]/5 rounded-full blur-[140px] -ml-[400px] -mb-[400px] animate-float-delayed" />
      </div>
      
      <div className="relative mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Panel de Control</h1>
            <p className="text-white/60 text-sm sm:text-base">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>

        {/* Grid Layout - Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tu Almacenamiento */}
          {limits && (
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl hover:border-gray-700/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50 group-hover:border-[#14b4a1]/30 transition-colors">
                      <HardDrive className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Almacenamiento</h2>
                      <p className="text-sm text-white/50">Uso de espacio</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/70">Usado</span>
                      <span className="text-sm font-bold text-white">{limits.currentStorageGB.toFixed(2)} GB</span>
                    </div>
                    <div className="h-3 bg-gray-800/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] rounded-full transition-all duration-1000 relative overflow-hidden"
                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-white/50">Total: {limits.maxStorageGB === -1 ? "∞" : limits.maxStorageGB} GB</span>
                      <span className="text-xs font-semibold text-white/60">{storagePercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tu Plan */}
          {currentPlan && (
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl hover:border-gray-700/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50 group-hover:border-[#14b4a1]/30 transition-colors">
                      <Sparkles className="w-6 h-6 text-white/90" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Plan Actual</h2>
                      <p className="text-sm text-white/50">Tu suscripción</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-white">{currentPlan.name}</div>
                  <div className="text-sm text-white/60 line-clamp-2">
                    {currentPlan.description || "Plan activo"}
                  </div>
                  <div className="pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <TrendingUp className="w-4 h-4 text-[#14b4a1]" />
                      <span>Plan activo y renovándose automáticamente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Métodos de Pago */}
        <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <CreditCard className="w-6 h-6 text-white/90" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Métodos de Pago</h2>
                <p className="text-sm text-white/50">Gestiona tus formas de pago</p>
              </div>
            </div>
            <Dialog open={showAddPaymentMethod} onOpenChange={setShowAddPaymentMethod}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold shadow-lg shadow-[#14b4a1]/20 hover:shadow-xl hover:shadow-[#14b4a1]/30 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Agregar Método de Pago</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Elige el tipo de método de pago que deseas agregar
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPaymentMethod} className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={paymentMethodType === "card" ? "default" : "outline"}
                      onClick={() => setPaymentMethodType("card")}
                      className={`flex-1 ${
                        paymentMethodType === "card"
                          ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]"
                          : "border-gray-700/50 hover:bg-gray-800/50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Tarjeta
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethodType === "paypal" ? "default" : "outline"}
                      onClick={() => setPaymentMethodType("paypal")}
                      className={`flex-1 ${
                        paymentMethodType === "paypal"
                          ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]"
                          : "border-gray-700/50 hover:bg-gray-800/50"
                      }`}
                    >
                      PayPal
                    </Button>
                  </div>

                  {paymentMethodType === "card" ? (
                    <>
                      <div>
                        <Label htmlFor="cardNumber" className="text-white/70">Número de tarjeta</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardData.cardNumber}
                          onChange={(e) => setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })}
                          maxLength={19}
                          className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardHolder" className="text-white/70">Titular de la tarjeta</Label>
                        <Input
                          id="cardHolder"
                          type="text"
                          placeholder="Nombre completo"
                          value={cardData.cardHolder}
                          onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                          className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate" className="text-white/70">Fecha de expiración</Label>
                          <Input
                            id="expiryDate"
                            type="text"
                            placeholder="MM/AA"
                            value={cardData.expiryDate}
                            onChange={(e) => setCardData({ ...cardData, expiryDate: formatExpiryDate(e.target.value) })}
                            maxLength={5}
                            className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv" className="text-white/70">CVV</Label>
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                            maxLength={4}
                            className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30 mt-1"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-700/50">
                          <CreditCard className="w-5 h-5 text-white/70" />
                        </div>
                        <div>
                          <p className="text-sm text-white/80 font-medium">Conectar con PayPal</p>
                          <p className="text-xs text-white/50 mt-0.5">Se abrirá una ventana para autorizar el pago</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddPaymentMethod(false);
                        setCardData({ cardNumber: "", cardHolder: "", expiryDate: "", cvv: "" });
                      }}
                      className="flex-1 border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isAddingPaymentMethod}
                      className="flex-1 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                    >
                      {isAddingPaymentMethod ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Agregar"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
              <CreditCard className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50 font-medium">No tienes métodos de pago registrados</p>
              <p className="text-white/40 text-sm mt-1">Añade uno para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method, index) => {
                const methodId = method.id || method.stripePaymentMethodId || method.last4 || method.email || index.toString();
                return (
                  <div
                    key={methodId}
                    className="group flex items-center justify-between p-4 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                        <CreditCard className="w-5 h-5 text-white/70" />
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {method.type === "card" ? (
                            <>
                              Tarjeta •••• {method.last4 || ""}
                              {method.isStripe && (
                                <span className="text-xs bg-[#14b4a1]/20 text-[#14b4a1] px-2 py-0.5 rounded">Stripe</span>
                              )}
                            </>
                          ) : (
                            <>
                              PayPal
                              {method.email && <span className="text-xs text-white/50">({method.email})</span>}
                            </>
                          )}
                        </div>
                        {method.brand && (
                          <div className="text-xs text-white/50 mt-0.5 capitalize">{method.brand}</div>
                        )}
                        {method.expMonth && method.expYear && (
                          <div className="text-xs text-white/50 mt-0.5">
                            Expira: {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletePaymentMethodId(methodId);
                        setShowDeleteDialog(true);
                      }}
                      className="text-white/40 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">¿Eliminar método de pago?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                Esta acción no se puede deshacer. El método de pago será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePaymentMethod}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Sistema de Créditos */}
        <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <Wallet className="w-6 h-6 text-white/90" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Créditos</h2>
              <p className="text-sm text-white/50">Gestiona tu saldo</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
              <p className="text-sm text-white/60 leading-relaxed">
                Cuando tu suscripción se renueve, aplicaremos cualquier crédito disponible antes de cobrar el método de pago anterior.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-gray-800/60 to-gray-800/40 border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/70">Créditos disponibles</span>
                  <Wallet className="w-5 h-5 text-[#14b4a1]" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{availableCredits} €</div>
                <p className="text-xs text-white/50">Listos para usar</p>
              </div>

              {/* Funcionalidad de añadir créditos desactivada */}
            </div>

            {/* Código Promocional */}
            <form onSubmit={handlePromoCode} className="p-5 rounded-xl bg-gray-800/40 border border-gray-700/30 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-white/60" />
                <label className="text-sm font-medium text-white/70">Código promocional</label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ingresa tu código"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30 flex-1"
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold px-6"
                >
                  Aplicar
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Facturas */}
        <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <FileText className="w-6 h-6 text-white/90" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Facturas</h2>
              <p className="text-sm text-white/50">Historial de pagos</p>
            </div>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
              <FileText className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50 font-medium">No hay facturas disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                      <FileText className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Factura #{invoice.id}</div>
                      <div className="text-sm text-white/50 mt-0.5">
                        {new Date(invoice.createdAt).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      {invoice.subscription?.Plan && (
                        <div className="text-sm font-bold text-white/90 mt-1">
                          {invoice.subscription.Plan.priceMonthly} €
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <Bell className="w-6 h-6 text-white/90" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notificaciones</h2>
              <p className="text-sm text-white/50">Gestiona tus preferencias</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Email Subscriptions */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#14b4a1] rounded-full" />
                Suscripciones por correo
              </h3>
              <div className="space-y-2">
                {Object.entries(notifications.emailSubscriptions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 transition-colors">
                    <span className="text-sm text-white/80 font-medium">
                      {notificationLabels.emailSubscriptions[key] || key}
                    </span>
                    <button
                      onClick={() => handleNotificationToggle("emailSubscriptions", key, !value)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        value ? "bg-[#14b4a1]" : "bg-gray-700"
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        value ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Updates */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#14b4a1] rounded-full" />
                Actualizaciones de productos
              </h3>
              <div className="space-y-2">
                {Object.entries(notifications.productUpdates).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 transition-colors">
                    <span className="text-sm text-white/80 font-medium">
                      {notificationLabels.productUpdates[key] || key}
                    </span>
                    <button
                      onClick={() => handleNotificationToggle("productUpdates", key, !value)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        value ? "bg-[#14b4a1]" : "bg-gray-700"
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        value ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* App Notifications */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#14b4a1] rounded-full" />
                Notificaciones de la aplicación
              </h3>
              <div className="space-y-2">
                {Object.entries(notifications.appNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 transition-colors">
                    <span className="text-sm text-white/80 font-medium">
                      {notificationLabels.appNotifications[key] || key}
                    </span>
                    <button
                      onClick={() => handleNotificationToggle("appNotifications", key, !value)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        value ? "bg-[#14b4a1]" : "bg-gray-700"
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        value ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
