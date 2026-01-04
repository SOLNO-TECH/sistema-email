"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient, type AdminUser, type AdminUserDetail, type Plan, type Domain, type Ticket, type Invoice, type EmailAccount, type Subscription } from "@/lib/api";
import {
  Loader2,
  Shield,
  Users,
  Mail,
  Globe,
  CreditCard,
  FileText,
  Search,
  Trash2,
  Eye,
  X,
  Edit,
  Plus,
  LayoutDashboard,
  Package,
  Ticket as TicketIcon,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "sonner";

type TabType = "dashboard" | "users" | "plans" | "domains" | "tickets" | "invoices" | "subscriptions" | "email-accounts" | "promo-codes";

export default function AdminPage() {
  const { user: currentUser, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Plans state
  const [plans, setPlans] = useState<(Plan & { _count: { subscriptions: number } })[]>([]);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: "",
    description: "",
    priceMonthly: "",
    priceYearly: "",
    maxEmails: "1",
    maxStorageGB: "1",
    maxDomains: "1",
    category: "personas" as "personas" | "empresas",
    isActive: true,
  });

  // Domains state
  const [domains, setDomains] = useState<(Domain & { user: { id: number; name: string; email: string }; _count: { emailAccounts: number } })[]>([]);

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("all");

  // Invoices state
  const [invoices, setInvoices] = useState<(Invoice & { user: { id: number; name: string; email: string } })[]>([]);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Array<Subscription & {
    user: { id: number; name: string; email: string };
    Plan?: {
      id: number;
      name: string;
      description?: string;
      priceMonthly: number;
      priceYearly: number;
      maxEmails: number;
      maxStorageGB: number;
      maxDomains: number;
    };
    _count: { invoices: number };
  }>>([]);

  // Email Accounts state
  const [emailAccounts, setEmailAccounts] = useState<(EmailAccount & { domain: { id: number; domainName: string; dnsVerified: boolean }; owner?: { id: number; name: string; email: string }; _count: { emails: number } })[]>([]);

  // Promo Codes state
  const [promoCodes, setPromoCodes] = useState<Array<{
    id: number;
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maxUses?: number;
    currentUses: number;
    validFrom: string;
    validUntil?: string;
    isActive: boolean;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    creator: { id: number; name: string; email: string };
  }>>([]);
  const [promoCodeDialogOpen, setPromoCodeDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<any>(null);
  const [promoCodeFormData, setPromoCodeFormData] = useState({
    code: "",
    description: "",
    discountType: "fixed" as "fixed" | "percentage",
    discountValue: "",
    maxUses: "",
    validFrom: "",
    validUntil: "",
  });
  const [deletePromoCodeId, setDeletePromoCodeId] = useState<number | null>(null);

  // Delete states
  const [deleteTicketId, setDeleteTicketId] = useState<number | null>(null);
  const [deleteDomainId, setDeleteDomainId] = useState<number | null>(null);
  const [deleteEmailAccountId, setDeleteEmailAccountId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalRegularUsers: 0,
    totalDomains: 0,
    totalEmailAccounts: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalInvoices: 0,
    totalTickets: 0,
    totalPlans: 0,
    totalEmails: 0,
    totalStorageUsed: 0,
    newUsersLastMonth: 0,
    ticketsByStatus: {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    },
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || currentUser?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadAllData();
    }
  }, [currentUser, activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [apiClient.getSystemStats()];

      if (activeTab === "users" || activeTab === "dashboard") {
        promises.push(apiClient.getAllUsers());
      }
      if (activeTab === "plans") {
        promises.push(apiClient.getAllPlans());
      }
      if (activeTab === "domains") {
        promises.push(apiClient.getAllDomains());
      }
      if (activeTab === "tickets") {
        promises.push(apiClient.getAllTickets());
      }
      if (activeTab === "invoices") {
        promises.push(apiClient.getAllInvoices());
      }
      if (activeTab === "subscriptions") {
        promises.push(apiClient.getAllSubscriptions());
      }
      if (activeTab === "email-accounts") {
        promises.push(apiClient.getAllEmailAccounts());
      }
      if (activeTab === "promo-codes") {
        promises.push(apiClient.getPromoCodes());
      }

      const results = await Promise.all(promises);
      const statsResponse = results[0];
      const statsData = statsResponse?.stats || {};
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalAdmins: statsData.totalAdmins || 0,
        totalRegularUsers: statsData.totalRegularUsers || 0,
        totalDomains: statsData.totalDomains || 0,
        totalEmailAccounts: statsData.totalEmailAccounts || 0,
        totalSubscriptions: statsData.totalSubscriptions || 0,
        activeSubscriptions: statsData.activeSubscriptions || 0,
        totalInvoices: statsData.totalInvoices || 0,
        totalTickets: statsData.totalTickets || 0,
        totalPlans: statsData.totalPlans || 0,
        totalEmails: statsData.totalEmails || 0,
        totalStorageUsed: statsData.totalStorageUsed || 0,
        newUsersLastMonth: statsData.newUsersLastMonth || 0,
        ticketsByStatus: statsData.ticketsByStatus || {
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
        },
      });

      let index = 1;
      if (activeTab === "users" || activeTab === "dashboard") {
        setUsers(results[index++]?.users || []);
      }
      if (activeTab === "plans") {
        setPlans(results[index++]?.plans || []);
      }
      if (activeTab === "domains") {
        setDomains(results[index++]?.domains || []);
      }
      if (activeTab === "tickets") {
        setTickets(results[index++] || []);
      }
      if (activeTab === "invoices") {
        setInvoices(results[index++]?.invoices || []);
      }
      if (activeTab === "subscriptions") {
        setSubscriptions(results[index++]?.subscriptions || []);
      }
      if (activeTab === "email-accounts") {
        setEmailAccounts(results[index++]?.emailAccounts || []);
      }
      if (activeTab === "promo-codes") {
        setPromoCodes(results[index++]?.promoCodes || []);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: number) => {
    try {
      const response = await apiClient.getUserById(userId);
      setSelectedUser(response.user);
      setUserDialogOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      toast.error("Error al cargar los detalles del usuario");
    }
  };

  const handleUpdateRole = async (userId: number, newRole: "user" | "admin") => {
    try {
      await apiClient.updateUser(userId, { role: newRole });
      toast.success("Rol actualizado correctamente");
      await loadAllData();
      if (selectedUser && selectedUser.id === userId) {
        const updated = await apiClient.getUserById(userId);
        setSelectedUser(updated.user);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Error al actualizar el rol del usuario");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await apiClient.deleteUser(userToDelete);
      toast.success("Usuario eliminado correctamente");
      await loadAllData();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      if (selectedUser && selectedUser.id === userToDelete) {
        setUserDialogOpen(false);
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Error al eliminar el usuario");
    }
  };

  const handleCreatePlan = async () => {
    try {
      await apiClient.createPlan({
        name: planFormData.name,
        description: planFormData.description || undefined,
        priceMonthly: parseFloat(planFormData.priceMonthly),
        priceYearly: parseFloat(planFormData.priceYearly),
        maxEmails: parseInt(planFormData.maxEmails),
        maxStorageGB: parseInt(planFormData.maxStorageGB),
        maxDomains: parseInt(planFormData.maxDomains),
        category: planFormData.category,
        isActive: planFormData.isActive,
      });
      toast.success("Plan creado correctamente");
      setPlanDialogOpen(false);
      resetPlanForm();
      await loadAllData();
    } catch (error: any) {
      console.error("Error creating plan:", error);
      toast.error(error.message || "Error al crear el plan");
    }
  };

  const handleUpdatePlan = async (id: number) => {
    try {
      await apiClient.updatePlan(id, {
        name: planFormData.name,
        description: planFormData.description || undefined,
        priceMonthly: parseFloat(planFormData.priceMonthly),
        priceYearly: parseFloat(planFormData.priceYearly),
        maxEmails: parseInt(planFormData.maxEmails),
        maxStorageGB: parseInt(planFormData.maxStorageGB),
        maxDomains: parseInt(planFormData.maxDomains),
        category: planFormData.category,
        isActive: planFormData.isActive,
      });
      toast.success("Plan actualizado correctamente");
      setPlanDialogOpen(false);
      setEditingPlan(null);
      resetPlanForm();
      await loadAllData();
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast.error(error.message || "Error al actualizar el plan");
    }
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await apiClient.deletePlan(id);
      toast.success("Plan eliminado correctamente");
      await loadAllData();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast.error(error.message || "Error al eliminar el plan");
    }
  };

  const handleUpdateTicketStatus = async (id: number, status: "open" | "in_progress" | "resolved" | "closed") => {
    try {
      await apiClient.updateTicketStatus(id, status);
      toast.success("Estado del ticket actualizado");
      await loadAllData();
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast.error(error.message || "Error al actualizar el ticket");
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicketId) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteTicketAdmin(deleteTicketId);
      toast.success("Ticket eliminado correctamente");
      await loadAllData();
      setDeleteTicketId(null);
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      toast.error(error.message || "Error al eliminar el ticket");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!deleteDomainId) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteDomainAdmin(deleteDomainId);
      toast.success("Dominio eliminado correctamente");
      await loadAllData();
      setDeleteDomainId(null);
    } catch (error: any) {
      console.error("Error deleting domain:", error);
      const errorMessage = error.emailAccountsCount
        ? `No se puede eliminar el dominio porque tiene ${error.emailAccountsCount} cuenta(s) de correo asociada(s)`
        : error.message || "Error al eliminar el dominio";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteEmailAccount = async () => {
    if (!deleteEmailAccountId) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteEmailAccountAdmin(deleteEmailAccountId);
      toast.success("Cuenta de email eliminada correctamente");
      await loadAllData();
      setDeleteEmailAccountId(null);
    } catch (error: any) {
      console.error("Error deleting email account:", error);
      toast.error(error.message || "Error al eliminar la cuenta de email");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: "",
      description: "",
      priceMonthly: "",
      priceYearly: "",
      maxEmails: "1",
      maxStorageGB: "1",
      maxDomains: "1",
      category: "personas",
      isActive: true,
    });
  };

  const openEditPlanDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      description: plan.description || "",
      priceMonthly: plan.priceMonthly.toString(),
      priceYearly: plan.priceYearly.toString(),
      maxEmails: plan.maxEmails.toString(),
      maxStorageGB: plan.maxStorageGB.toString(),
      maxDomains: plan.maxDomains.toString(),
      category: (plan.category || "personas") as "personas" | "empresas",
      isActive: plan.isActive,
    });
    setPlanDialogOpen(true);
  };

  const handleSavePromoCode = async () => {
    try {
      const data = {
        code: promoCodeFormData.code,
        description: promoCodeFormData.description || undefined,
        discountType: promoCodeFormData.discountType,
        discountValue: parseFloat(promoCodeFormData.discountValue),
        maxUses: promoCodeFormData.maxUses ? parseInt(promoCodeFormData.maxUses) : undefined,
        validFrom: promoCodeFormData.validFrom || undefined,
        validUntil: promoCodeFormData.validUntil || undefined,
      };

      if (editingPromoCode) {
        await apiClient.updatePromoCode(editingPromoCode.id, data);
        toast.success("Código promocional actualizado exitosamente");
      } else {
        await apiClient.createPromoCode(data);
        toast.success("Código promocional creado exitosamente");
      }

      setPromoCodeDialogOpen(false);
      await loadAllData();
    } catch (error: any) {
      console.error("Error saving promo code:", error);
      toast.error(error.message || "Error al guardar el código promocional");
    }
  };

  const handleDeletePromoCode = async () => {
    if (!deletePromoCodeId) return;
    try {
      await apiClient.deletePromoCode(deletePromoCodeId);
      toast.success("Código promocional eliminado exitosamente");
      await loadAllData();
      setDeletePromoCodeId(null);
    } catch (error: any) {
      console.error("Error deleting promo code:", error);
      toast.error(error.message || "Error al eliminar el código promocional");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTickets = tickets.filter((t) =>
    ticketStatusFilter === "all" ? true : t.status === ticketStatusFilter
  );

  if (isLoading || loading) {
    return (
      <SidebarProvider className="bg-sidebar">
        <DashboardSidebar />
        <div className="h-svh overflow-hidden lg:p-2 w-full">
          <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-[#14b4a1]" />
                  <div className="absolute inset-0 bg-[#14b4a1]/20 rounded-full blur-xl animate-pulse" />
                </div>
                <p className="text-white/70 font-medium">Cargando panel de administración...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || currentUser?.role !== "admin") {
    return null;
  }

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <Toaster richColors position="top-right" />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                    <Shield className="w-7 h-7 text-white/90" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      Panel de Administración
                    </h1>
                    <p className="text-white/60 mt-1 text-sm md:text-base">
                      Gestiona usuarios, dominios y configuración del sistema
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-800/50">
                <div className="flex flex-wrap gap-2 sm:gap-4 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "dashboard"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 inline mr-2" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "users"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Usuarios
                  </button>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "plans"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    Planes
                  </button>
                  <button
                    onClick={() => setActiveTab("domains")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "domains"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <Globe className="w-4 h-4 inline mr-2" />
                    Dominios
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "tickets"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <TicketIcon className="w-4 h-4 inline mr-2" />
                    Tickets
                    {stats.ticketsByStatus?.open > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs">
                        {stats.ticketsByStatus.open}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "invoices"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Facturas
                  </button>
                  <button
                    onClick={() => setActiveTab("subscriptions")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "subscriptions"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Suscripciones
                  </button>
                  <button
                    onClick={() => setActiveTab("email-accounts")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "email-accounts"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Cuentas Email
                  </button>
                  <button
                    onClick={() => setActiveTab("promo-codes")}
                    className={`px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "promo-codes"
                        ? "text-white border-b-2 border-[#14b4a1]"
                        : "text-white/60 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    Códigos Promo
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === "dashboard" && (
                  <DashboardTab stats={stats} />
                )}
                {activeTab === "users" && (
                  <UsersTab
                    users={filteredUsers}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onViewUser={handleViewUser}
                    onUpdateRole={handleUpdateRole}
                    onDeleteUser={(id) => {
                      setUserToDelete(id);
                      setDeleteDialogOpen(true);
                    }}
                    currentUserId={currentUser?.id}
                  />
                )}
                {activeTab === "plans" && (
                  <PlansTab
                    plans={plans}
                    onEditPlan={openEditPlanDialog}
                    onDeletePlan={handleDeletePlan}
                    onAddPlan={() => {
                      setEditingPlan(null);
                      resetPlanForm();
                      setPlanDialogOpen(true);
                    }}
                  />
                )}
                {activeTab === "domains" && (
                  <DomainsTab domains={domains} onDelete={(id) => setDeleteDomainId(id)} />
                )}
                {activeTab === "tickets" && (
                  <TicketsTab
                    tickets={filteredTickets}
                    statusFilter={ticketStatusFilter}
                    onStatusFilterChange={setTicketStatusFilter}
                    onUpdateStatus={handleUpdateTicketStatus}
                    onDelete={(id) => setDeleteTicketId(id)}
                  />
                )}
                {activeTab === "invoices" && (
                  <InvoicesTab invoices={invoices} />
                )}
                {activeTab === "subscriptions" && (
                  <SubscriptionsTab 
                    subscriptions={subscriptions} 
                    onDelete={async (id) => {
                      await apiClient.cancelSubscriptionAdmin(id);
                    }}
                    onRefresh={loadAllData}
                  />
                )}
                {activeTab === "email-accounts" && (
                  <EmailAccountsTab emailAccounts={emailAccounts} onDelete={(id) => setDeleteEmailAccountId(id)} />
                )}
                {activeTab === "promo-codes" && (
                  <PromoCodesTab
                    promoCodes={promoCodes}
                    onAdd={() => {
                      setEditingPromoCode(null);
                      setPromoCodeFormData({
                        code: "",
                        description: "",
                        discountType: "fixed",
                        discountValue: "",
                        maxUses: "",
                        validFrom: "",
                        validUntil: "",
                      });
                      setPromoCodeDialogOpen(true);
                    }}
                    onEdit={(code) => {
                      setEditingPromoCode(code);
                      setPromoCodeFormData({
                        code: code.code,
                        description: code.description || "",
                        discountType: code.discountType as "fixed" | "percentage",
                        discountValue: code.discountValue.toString(),
                        maxUses: code.maxUses?.toString() || "",
                        validFrom: new Date(code.validFrom).toISOString().split('T')[0],
                        validUntil: code.validUntil ? new Date(code.validUntil).toISOString().split('T')[0] : "",
                      });
                      setPromoCodeDialogOpen(true);
                    }}
                    onDelete={(id) => setDeletePromoCodeId(id)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={(open) => {
        setPlanDialogOpen(open);
        if (!open) {
          setEditingPlan(null);
          resetPlanForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingPlan ? "Editar Plan" : "Crear Plan"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editingPlan ? "Actualiza la información del plan" : "Crea un nuevo plan para los usuarios"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-white/70">Nombre del Plan</Label>
              <Input
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                placeholder="Ej: Plan Básico"
                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Descripción</Label>
              <Textarea
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                placeholder="Descripción del plan"
                rows={3}
                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Categoría</Label>
              <Select
                value={planFormData.category}
                onValueChange={(value: "personas" | "empresas") => setPlanFormData({ ...planFormData, category: value })}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="personas" className="text-white hover:bg-gray-800">Para Personas</SelectItem>
                  <SelectItem value="empresas" className="text-white hover:bg-gray-800">Para Empresas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Mensual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planFormData.priceMonthly}
                  onChange={(e) => setPlanFormData({ ...planFormData, priceMonthly: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Anual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planFormData.priceYearly}
                  onChange={(e) => setPlanFormData({ ...planFormData, priceYearly: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Máx. Emails</Label>
                <Input
                  type="number"
                  value={planFormData.maxEmails}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxEmails: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Máx. Almacenamiento (GB)</Label>
                <Input
                  type="number"
                  value={planFormData.maxStorageGB}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxStorageGB: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Máx. Dominios</Label>
                <Input
                  type="number"
                  value={planFormData.maxDomains}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxDomains: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={planFormData.isActive}
                onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="isActive">Plan Activo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/50">
              <Button
                variant="outline"
                onClick={() => {
                  setPlanDialogOpen(false);
                  setEditingPlan(null);
                  resetPlanForm();
                }}
                className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => editingPlan ? handleUpdatePlan(editingPlan.id) : handleCreatePlan()}
                disabled={!planFormData.name || !planFormData.priceMonthly || !planFormData.priceYearly}
                className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
              >
                {editingPlan ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onUpdateRole={handleUpdateRole}
      />

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Ticket Dialog */}
      <AlertDialog open={deleteTicketId !== null} onOpenChange={(open) => !open && setDeleteTicketId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar ticket?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente el ticket y todos sus mensajes y archivos adjuntos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Domain Dialog */}
      <AlertDialog open={deleteDomainId !== null} onOpenChange={(open) => !open && setDeleteDomainId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar dominio?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente el dominio. No podrás eliminar un dominio que tenga cuentas de correo asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDomain}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Email Account Dialog */}
      <AlertDialog open={deleteEmailAccountId !== null} onOpenChange={(open) => !open && setDeleteEmailAccountId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar cuenta de email?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de email y todos sus correos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmailAccount}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promo Code Dialog */}
      <Dialog open={promoCodeDialogOpen} onOpenChange={setPromoCodeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPromoCode ? "Editar Código Promocional" : "Crear Código Promocional"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editingPromoCode ? "Modifica los detalles del código promocional" : "Crea un nuevo código promocional para tus usuarios"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-white/70">Código</Label>
              <Input
                value={promoCodeFormData.code}
                onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME20"
                disabled={!!editingPromoCode}
                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
              />
              <p className="text-xs text-white/50">El código se convertirá automáticamente a mayúsculas</p>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Descripción (opcional)</Label>
              <Input
                value={promoCodeFormData.description}
                onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, description: e.target.value })}
                placeholder="Código de bienvenida"
                className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Tipo de Descuento</Label>
                <Select
                  value={promoCodeFormData.discountType}
                  onValueChange={(value) => setPromoCodeFormData({ ...promoCodeFormData, discountType: value as "fixed" | "percentage" })}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="fixed" className="text-white hover:bg-gray-800">Cantidad Fija (€)</SelectItem>
                    <SelectItem value="percentage" className="text-white hover:bg-gray-800">Porcentaje (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">
                  Valor {promoCodeFormData.discountType === "fixed" ? "(€)" : "(%)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={promoCodeFormData.discountValue}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, discountValue: e.target.value })}
                  placeholder={promoCodeFormData.discountType === "fixed" ? "10.00" : "20"}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Máximo de Usos (opcional)</Label>
                <Input
                  type="number"
                  value={promoCodeFormData.maxUses}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, maxUses: e.target.value })}
                  placeholder="100"
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-white/30"
                />
                <p className="text-xs text-white/50">Deja vacío para ilimitado</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Válido Desde</Label>
                <Input
                  type="date"
                  value={promoCodeFormData.validFrom}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, validFrom: e.target.value })}
                  className="bg-gray-800/50 border-gray-700/50 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Válido Hasta (opcional)</Label>
              <Input
                type="date"
                value={promoCodeFormData.validUntil}
                onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, validUntil: e.target.value })}
                className="bg-gray-800/50 border-gray-700/50 text-white"
              />
              <p className="text-xs text-white/50">Deja vacío para sin fecha de expiración</p>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/50">
              <Button
                variant="outline"
                onClick={() => {
                  setPromoCodeDialogOpen(false);
                  setEditingPromoCode(null);
                }}
                className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSavePromoCode}
                disabled={!promoCodeFormData.code || !promoCodeFormData.discountValue}
                className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
              >
                {editingPromoCode ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Promo Code Dialog */}
      <AlertDialog open={deletePromoCodeId !== null} onOpenChange={(open) => !open && setDeletePromoCodeId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar código promocional?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. El código promocional será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePromoCode}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

// Dashboard Tab Component
function DashboardTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Usuarios"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          subtitle={`${stats.totalAdmins} admin, ${stats.totalRegularUsers} usuarios`}
        />
        <StatCard
          title="Dominios"
          value={stats.totalDomains}
          icon={<Globe className="w-6 h-6" />}
        />
        <StatCard
          title="Cuentas Email"
          value={stats.totalEmailAccounts}
          icon={<Mail className="w-6 h-6" />}
        />
        <StatCard
          title="Suscripciones Activas"
          value={stats.activeSubscriptions}
          icon={<CreditCard className="w-6 h-6" />}
          subtitle={`${stats.totalSubscriptions} totales`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tickets Abiertos"
          value={stats.ticketsByStatus?.open || 0}
          icon={<TicketIcon className="w-6 h-6" />}
          subtitle={`${stats.totalTickets} totales`}
        />
        <StatCard
          title="Planes"
          value={stats.totalPlans}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          title="Facturas"
          value={stats.totalInvoices}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="Almacenamiento Total"
          value={`${stats.totalStorageUsed.toFixed(2)} GB`}
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
              <TicketIcon className="w-5 h-5 text-white/90" />
            </div>
            <h3 className="font-bold text-white">Tickets por Estado</h3>
          </div>
          <div className="space-y-3">
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-yellow-950/30 to-yellow-950/20 border border-yellow-800/50 hover:border-yellow-700/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-white/90">Abiertos</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">{stats.ticketsByStatus?.open || 0}</span>
            </div>
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-950/30 to-blue-950/20 border border-blue-800/50 hover:border-blue-700/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-white/90">En Progreso</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.ticketsByStatus?.inProgress || 0}</span>
            </div>
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-950/30 to-green-950/20 border border-green-800/50 hover:border-green-700/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm font-medium text-white/90">Resueltos</span>
              </div>
              <span className="text-2xl font-bold text-green-400">{stats.ticketsByStatus?.resolved || 0}</span>
            </div>
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-800/20 border border-gray-700/50 hover:border-gray-600/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/30">
                  <X className="w-4 h-4 text-white/60" />
                </div>
                <span className="text-sm font-medium text-white/90">Cerrados</span>
              </div>
              <span className="text-2xl font-bold text-white/70">{stats.ticketsByStatus?.closed || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
              <Activity className="w-5 h-5 text-white/90" />
            </div>
            <h3 className="font-bold text-white">Actividad Reciente</h3>
          </div>
          <div className="space-y-3">
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-800/20 border border-gray-700/50 hover:border-gray-600/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#14b4a1]/20 border border-[#14b4a1]/30">
                  <Users className="w-4 h-4 text-[#14b4a1]" />
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Usuarios nuevos este mes</span>
                  <span className="text-sm font-medium text-white/90">Nuevos usuarios</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-[#14b4a1]">{stats.newUsersLastMonth}</span>
            </div>
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-800/20 border border-gray-700/50 hover:border-gray-600/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Total de correos</span>
                  <span className="text-sm font-medium text-white/90">Correos enviados</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-400">{stats.totalEmails}</span>
            </div>
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-800/20 border border-gray-700/50 hover:border-gray-600/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Almacenamiento total</span>
                  <span className="text-sm font-medium text-white/90">Espacio usado</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-400">{stats.totalStorageUsed.toFixed(2)} GB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({
  users,
  searchTerm,
  setSearchTerm,
  onViewUser,
  onUpdateRole,
  onDeleteUser,
  currentUserId,
}: {
  users: AdminUser[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onViewUser: (id: number) => void;
  onUpdateRole: (id: number, role: "user" | "admin") => void;
  onDeleteUser: (id: number) => void;
  currentUserId?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <Input
          type="text"
          placeholder="Buscar usuarios por nombre o email..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-700/50 bg-gray-900/50 text-white placeholder:text-white/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => setSearchTerm("")}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Dominios</TableHead>
                <TableHead>Cuentas</TableHead>
                <TableHead>Suscripciones</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Usuario"}
                      </span>
                    </TableCell>
                    <TableCell>{user._count.Domain}</TableCell>
                    <TableCell>{user._count.EmailAccounts}</TableCell>
                    <TableCell>{user._count.subscriptions}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onViewUser(user.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user.role === "user" ? (
                          <Button variant="ghost" size="sm" onClick={() => onUpdateRole(user.id, "admin")}>
                            <Shield className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => onUpdateRole(user.id, "user")}>
                            <Users className="w-4 h-4" />
                          </Button>
                        )}
                        {user.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Plans Tab Component
function PlansTab({
  plans,
  onEditPlan,
  onDeletePlan,
  onAddPlan,
}: {
  plans: (Plan & { _count: { subscriptions: number } })[];
  onEditPlan: (plan: Plan) => void;
  onDeletePlan: (id: number) => void;
  onAddPlan: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Planes Disponibles</h2>
        <Button 
          onClick={onAddPlan}
          className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-white/60 mt-1">{plan.description}</p>
                )}
              </div>
              {!plan.isActive && (
                <span className="px-2 py-1 bg-gray-800/60 text-white/60 rounded text-xs border border-gray-700/50">Inactivo</span>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <span className="text-white/70">Precio Mensual:</span>
                <span className="font-semibold text-white">€{plan.priceMonthly}</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <span className="text-white/70">Precio Anual:</span>
                <span className="font-semibold text-white">€{plan.priceYearly}</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <span className="text-white/70">Máx. Emails:</span>
                <span className="font-semibold text-white">{plan.maxEmails}</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <span className="text-white/70">Máx. Almacenamiento:</span>
                <span className="font-semibold text-white">{plan.maxStorageGB} GB</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <span className="text-white/70">Máx. Dominios:</span>
                <span className="font-semibold text-white">{plan.maxDomains}</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <span className="text-white/70">Suscripciones:</span>
                <span className="font-semibold text-white">{plan._count.subscriptions}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-gray-800/50">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditPlan(plan)} 
                className="flex-1 border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("¿Estás seguro de eliminar este plan?")) {
                    onDeletePlan(plan.id);
                  }
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-900/50 hover:border-red-800/50"
                disabled={plan._count.subscriptions > 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Domains Tab Component
function DomainsTab({
  domains,
  onDelete,
}: {
  domains: (Domain & { user: { id: number; name: string; email: string }; _count: { emailAccounts: number } })[];
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Dominios del Sistema</h2>
      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Dominio</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Cuentas Email</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay dominios registrados
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>{domain.id}</TableCell>
                    <TableCell className="font-medium">{domain.domainName}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{domain.user.name}</div>
                        <div className="text-xs text-muted-foreground">{domain.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {domain.dnsVerified ? (
                        <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">Verificado</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded text-xs">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell>{domain._count.emailAccounts}</TableCell>
                    <TableCell>{new Date(domain.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(domain.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={domain._count.emailAccounts > 0}
                        title={domain._count.emailAccounts > 0 ? "No se puede eliminar: tiene cuentas de email asociadas" : "Eliminar dominio"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Tickets Tab Component
function TicketsTab({
  tickets,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onDelete,
}: {
  tickets: Ticket[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onUpdateStatus: (id: number, status: "open" | "in_progress" | "resolved" | "closed") => void;
  onDelete: (id: number) => void;
}) {
  const getStatusBadge = (status: string) => {
    const badges = {
      open: "bg-yellow-500/10 text-yellow-600",
      in_progress: "bg-blue-500/10 text-blue-600",
      resolved: "bg-green-500/10 text-green-600",
      closed: "bg-gray-500/10 text-gray-600",
    };
    return badges[status as keyof typeof badges] || "bg-muted text-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      open: "Abierto",
      in_progress: "En Progreso",
      resolved: "Resuelto",
      closed: "Cerrado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: "bg-gray-500/10 text-gray-600",
      medium: "bg-blue-500/10 text-blue-600",
      high: "bg-orange-500/10 text-orange-600",
      urgent: "bg-red-500/10 text-red-600",
    };
    return badges[priority as keyof typeof badges] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Tickets de Soporte</h2>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-700/50 text-white">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            <SelectItem value="all" className="text-white hover:bg-gray-800">Todos</SelectItem>
            <SelectItem value="open" className="text-white hover:bg-gray-800">Abiertos</SelectItem>
            <SelectItem value="in_progress" className="text-white hover:bg-gray-800">En Progreso</SelectItem>
            <SelectItem value="resolved" className="text-white hover:bg-gray-800">Resueltos</SelectItem>
            <SelectItem value="closed" className="text-white hover:bg-gray-800">Cerrados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay tickets
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>
                      {ticket.user?.name || ticket.user?.email || `Usuario ${ticket.userId}`}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value: any) => onUpdateStatus(ticket.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Abierto</SelectItem>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="resolved">Resuelto</SelectItem>
                          <SelectItem value="closed">Cerrado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(ticket.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Invoices Tab Component
function InvoicesTab({
  invoices,
}: {
  invoices: (Invoice & { user: { id: number; name: string; email: string } })[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Facturas del Sistema</h2>
      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay facturas
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{invoice.user.name}</div>
                        <div className="text-xs text-muted-foreground">{invoice.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.subscription?.Plan?.name || invoice.subscription?.plan || "N/A"}
                    </TableCell>
                    <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Subscriptions Tab Component
function SubscriptionsTab({
  subscriptions,
  onDelete,
  onRefresh,
}: {
  subscriptions: Array<Subscription & {
    user: { id: number; name: string; email: string };
    Plan?: {
      id: number;
      name: string;
      description?: string;
      priceMonthly: number;
      priceYearly: number;
      maxEmails: number;
      maxStorageGB: number;
      maxDomains: number;
    };
    _count: { invoices: number };
  }>;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<number | null>(null);

  const getSubscriptionStatus = (subscription: Subscription) => {
    if (!subscription.endDate) {
      return { label: "Activa", badge: "bg-green-500/10 text-green-600", isActive: true };
    }
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    if (endDate > now) {
      return { label: "Activa", badge: "bg-green-500/10 text-green-600", isActive: true };
    }
    return { label: "Vencida", badge: "bg-gray-500/10 text-gray-600", isActive: false };
  };

  const handleDeleteClick = (id: number) => {
    setSubscriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (subscriptionToDelete) {
      setDeletingId(subscriptionToDelete);
      try {
        await onDelete(subscriptionToDelete);
        setDeleteDialogOpen(false);
        setSubscriptionToDelete(null);
        onRefresh();
        toast.success("Suscripción cancelada exitosamente");
      } catch (error: any) {
        toast.error(error.message || "Error al cancelar la suscripción");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Suscripciones del Sistema</h2>
        <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio Mensual</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Facturas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No hay suscripciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => {
                    const status = getSubscriptionStatus(subscription);
                    return (
                      <TableRow key={subscription.id}>
                        <TableCell>{subscription.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{subscription.user.name}</div>
                            <div className="text-xs text-muted-foreground">{subscription.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {subscription.Plan?.name || subscription.plan || "N/A"}
                            </div>
                            {subscription.Plan?.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {subscription.Plan.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {subscription.Plan?.priceMonthly
                            ? `$${subscription.Plan.priceMonthly.toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>{new Date(subscription.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : "Sin límite"}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${status.badge}`}>{status.label}</span>
                        </TableCell>
                        <TableCell>{subscription._count?.invoices || 0}</TableCell>
                        <TableCell className="text-right">
                          {status.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(subscription.id)}
                              disabled={deletingId === subscription.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              {deletingId === subscription.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Cancelar suscripción?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción cancelará la suscripción activa del usuario. La suscripción se marcará como vencida
              inmediatamente. ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-semibold"
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Cancelando...
                </>
              ) : (
                "Cancelar Suscripción"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Email Accounts Tab Component
function EmailAccountsTab({
  emailAccounts,
  onDelete,
}: {
  emailAccounts: (EmailAccount & { domain: { id: number; domainName: string; dnsVerified: boolean }; owner?: { id: number; name: string; email: string }; _count: { emails: number } })[];
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Cuentas de Email del Sistema</h2>
      <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Dominio</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Almacenamiento</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay cuentas de email
                  </TableCell>
                </TableRow>
              ) : (
                emailAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.id}</TableCell>
                    <TableCell className="font-medium">{account.address}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{account.domain.domainName}</div>
                        {account.domain.dnsVerified ? (
                          <span className="text-xs text-green-600">Verificado</span>
                        ) : (
                          <span className="text-xs text-yellow-600">Pendiente</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.owner ? (
                        <div>
                          <div className="font-medium text-foreground">{account.owner.name}</div>
                          <div className="text-xs text-muted-foreground">{account.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{account.storageUsed?.toFixed(2) || "0.00"} GB</TableCell>
                    <TableCell>{account._count?.emails || 0}</TableCell>
                    <TableCell>{new Date(account.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(account.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// User Details Dialog Component
function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  onUpdateRole,
}: {
  user: AdminUserDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRole: (id: number, role: "user" | "admin") => void;
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Detalles del Usuario</DialogTitle>
          <DialogDescription className="text-white/70">Información completa del usuario {user.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">ID</p>
              <p className="font-semibold text-foreground">{user.id}</p>
            </div>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Nombre</p>
              <p className="font-semibold text-foreground">{user.name}</p>
            </div>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-semibold text-foreground">{user.email}</p>
            </div>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Rol</p>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === "admin"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Usuario"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateRole(user.id, user.role === "admin" ? "user" : "admin")}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Cambiar a {user.role === "admin" ? "Usuario" : "Admin"}
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Fecha de Registro</p>
              <p className="font-semibold text-foreground">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5" />
              Dominios ({user.Domain.length})
            </h3>
            <div className="space-y-2">
              {user.Domain.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tiene dominios</p>
              ) : (
                user.Domain.map((domain) => (
                  <div key={domain.id} className="bg-muted/50 border rounded-lg p-3">
                    <p className="font-medium text-foreground">{domain.domainName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verificado: {domain.dnsVerified ? "Sí" : "No"} | Cuentas: {domain.emailAccounts?.length || 0}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
              <Mail className="w-5 h-5" />
              Cuentas de Email ({user.EmailAccounts.length})
            </h3>
            <div className="space-y-2">
              {user.EmailAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tiene cuentas de email</p>
              ) : (
                user.EmailAccounts.map((account) => (
                  <div key={account.id} className="bg-muted/50 border rounded-lg p-3">
                    <p className="font-medium text-foreground">{account.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dominio: {account.domain?.domainName || "N/A"} | Almacenamiento: {account.storageUsed?.toFixed(2) || "0.00"} GB
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5" />
              Suscripciones ({user.subscriptions.length})
            </h3>
            <div className="space-y-2">
              {user.subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tiene suscripciones</p>
              ) : (
                user.subscriptions.map((sub) => (
                  <div key={sub.id} className="bg-muted/50 border rounded-lg p-3">
                    <p className="font-medium text-foreground">{sub.Plan?.name || sub.plan}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inicio: {new Date(sub.startDate).toLocaleDateString()} |{" "}
                      {sub.endDate ? `Fin: ${new Date(sub.endDate).toLocaleDateString()}` : "Activa"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5" />
              Facturas ({user.invoices.length})
            </h3>
            <div className="space-y-2">
              {user.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tiene facturas</p>
              ) : (
                user.invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-muted/50 border rounded-lg p-3">
                    <p className="text-sm text-foreground">
                      Factura #{invoice.id} - {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl transition-all hover:border-gray-700/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">{icon}</div>
      </div>
    </div>
  );
}

// Promo Codes Tab Component
function PromoCodesTab({
  promoCodes,
  onAdd,
  onEdit,
  onDelete,
}: {
  promoCodes: Array<{
    id: number;
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maxUses?: number;
    currentUses: number;
    validFrom: string;
    validUntil?: string;
    isActive: boolean;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    creator: { id: number; name: string; email: string };
  }>;
  onAdd: () => void;
  onEdit: (code: any) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Códigos Promocionales</h2>
          <p className="text-white/60 mt-1">Gestiona los códigos promocionales del sistema</p>
        </div>
        <Button
          onClick={onAdd}
          className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Código
        </Button>
      </div>

      {promoCodes.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl">
          <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/50 font-medium text-lg mb-2">No hay códigos promocionales</p>
          <p className="text-white/40 text-sm">Crea tu primer código promocional</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800/50 hover:bg-gray-900/50">
                <TableHead className="text-white/70">Código</TableHead>
                <TableHead className="text-white/70">Descripción</TableHead>
                <TableHead className="text-white/70">Tipo</TableHead>
                <TableHead className="text-white/70">Valor</TableHead>
                <TableHead className="text-white/70">Usos</TableHead>
                <TableHead className="text-white/70">Válido Hasta</TableHead>
                <TableHead className="text-white/70">Estado</TableHead>
                <TableHead className="text-white/70">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((code) => (
                <TableRow key={code.id} className="border-gray-800/50 hover:bg-gray-900/50">
                  <TableCell className="font-semibold text-white">{code.code}</TableCell>
                  <TableCell className="text-white/80">{code.description || "-"}</TableCell>
                  <TableCell className="text-white/80 capitalize">{code.discountType}</TableCell>
                  <TableCell className="text-white/80">
                    {code.discountType === "fixed" ? `${code.discountValue}€` : `${code.discountValue}%`}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {code.maxUses ? `${code.currentUses}/${code.maxUses}` : `${code.currentUses} (∞)`}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {code.validUntil ? new Date(code.validUntil).toLocaleDateString() : "Sin límite"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        code.isActive
                          ? "bg-[#14b4a1]/20 text-[#14b4a1] border border-[#14b4a1]/30"
                          : "bg-gray-700/50 text-white/60 border border-gray-600/50"
                      }`}
                    >
                      {code.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(code)}
                        className="text-white/60 hover:text-white hover:bg-gray-800/50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(code.id)}
                        className="text-white/60 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
