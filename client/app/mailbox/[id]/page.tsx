"use client";

import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, type InboxEmail, type EmailAccount } from "@/lib/api";
import {
  Mail,
  Send,
  Loader2,
  ArrowLeft,
  Inbox,
  MessageSquare,
  Search,
  Archive,
  Trash2,
  Star,
  Reply,
  MoreVertical,
  X,
  Paperclip,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Clock,
  FileText,
  Tag,
  Folder,
  AlertCircle,
  Filter,
  Lock,
  Menu,
  LogOut,
  HelpCircle,
  CreditCard,
  User as UserIcon,
  ChevronUp,
  Bold,
  Link as LinkIcon,
  Smile,
  Image as ImageIcon,
  HardDrive,
  MoreHorizontal,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type MailSection = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "important" | "scheduled" | "all" | "spam" | "trash" | "categories" | "labels";

export default function MailboxPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, checkAuth, user, logout } = useAuthStore();
  const accountId = parseInt(params.id as string);
  
  // Verificar si es usuario "personas" (no debe ver opciones de crear correos/dominios)
  const isPersonas = user?.paymentDetails?.planCategory === "personas";

  const [account, setAccount] = useState<EmailAccount | null>(null);
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<InboxEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [activeSection, setActiveSection] = useState<MailSection>("inbox");
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [messageHtml, setMessageHtml] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEditorRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (accountId) {
      // Cargar correos según la sección activa
      if (activeSection === "drafts") {
        const loadDrafts = async () => {
          try {
            const drafts = await apiClient.getDrafts(accountId);
            setEmails(drafts);
          } catch (err: any) {
            console.error("Error cargando borradores:", err);
            toast.error("Error al cargar borradores");
          }
        };
        loadDrafts();
      } else {
        // Sincronizar automáticamente al cargar por primera vez
        loadMailbox(true);
      }
    }
  }, [isAuthenticated, accountId, router, activeSection]);

  useEffect(() => {
    filterEmails();
  }, [searchQuery, emails, activeSection]);

  // Cargar plan cuando se abre el menú
  useEffect(() => {
    if (userMenuOpen && user) {
      loadCurrentPlan();
    }
  }, [userMenuOpen, user]);

  const loadCurrentPlan = async () => {
    try {
      setLoadingPlan(true);
      const planData = await apiClient.getCurrentPlan();
      setCurrentPlan(planData.plan);
    } catch (err) {
      console.error("Error loading current plan:", err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  // Funciones de manejo de acciones de correo
  const handleToggleStar = async (emailId: number) => {
    try {
      const result = await apiClient.toggleStar(emailId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isStarred: result.email.isStarred } : e))
        );
        toast.success(result.email.isStarred ? "Correo destacado" : "Correo desmarcado");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar correo");
    }
  };

  const handleToggleArchive = async (emailId: number) => {
    try {
      const result = await apiClient.toggleArchive(emailId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isArchived: result.email.isArchived } : e))
        );
        toast.success(result.email.isArchived ? "Correo archivado" : "Correo desarchivado");
        filterEmails();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al archivar correo");
    }
  };

  const handleToggleSpam = async (emailId: number) => {
    try {
      const result = await apiClient.toggleSpam(emailId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isSpam: result.email.isSpam } : e))
        );
        toast.success(result.email.isSpam ? "Marcado como spam" : "Removido de spam");
        filterEmails();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al marcar como spam");
    }
  };

  const handleToggleImportant = async (emailId: number) => {
    try {
      const result = await apiClient.toggleImportant(emailId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isImportant: result.email.isImportant } : e))
        );
        toast.success(result.email.isImportant ? "Marcado como importante" : "Removido de importantes");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al marcar como importante");
    }
  };

  const handleDeleteEmail = async (emailId: number) => {
    try {
      const result = await apiClient.deleteEmail(emailId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isDeleted: true } : e))
        );
        toast.success("Correo movido a papelera");
        filterEmails();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar correo");
    }
  };

  const handleRestoreEmail = async (emailId: number) => {
    try {
      const result = await apiClient.restoreEmail(emailId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((e) => (e.id === emailId ? { ...e, isDeleted: false } : e))
        );
        toast.success("Correo restaurado");
        filterEmails();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al restaurar correo");
    }
  };

  const handlePermanentDelete = async (emailId: number) => {
    if (!confirm("¿Estás seguro de eliminar permanentemente este correo?")) {
      return;
    }
    try {
      const result = await apiClient.permanentDelete(emailId);
      if (result.success) {
        setEmails((prev) => prev.filter((e) => e.id !== emailId));
        toast.success("Correo eliminado permanentemente");
        filterEmails();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar correo");
    }
  };

  const filterEmails = () => {
    let filtered = [...emails];

    // Filtrar por sección
    switch (activeSection) {
      case "inbox":
        // Correos recibidos no leídos, no archivados, no eliminados, no spam
        filtered = filtered.filter(
          (e) => !e.isSent && !e.isRead && !e.isArchived && !e.isDeleted && !e.isSpam && !e.isDraft
        );
        break;
      case "starred":
        filtered = filtered.filter((e) => e.isStarred && !e.isDeleted);
        break;
      case "sent":
        filtered = filtered.filter((e) => e.isSent && !e.isDeleted && !e.isDraft);
        break;
      case "drafts":
        filtered = filtered.filter((e) => e.isDraft);
        break;
      case "trash":
        filtered = filtered.filter((e) => e.isDeleted);
        break;
      case "spam":
        filtered = filtered.filter((e) => e.isSpam && !e.isDeleted);
        break;
      case "important":
        filtered = filtered.filter((e) => e.isImportant && !e.isDeleted);
        break;
      case "all":
        // Todos los correos excepto eliminados permanentemente
        filtered = filtered.filter((e) => !e.isDeleted || activeSection === "trash");
        break;
      default:
        break;
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (email) =>
          email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEmails(filtered);
  };

  const loadMailbox = async (sync: boolean = false) => {
    try {
      setLoading(true);
      const [accounts, inbox] = await Promise.all([
        apiClient.getEmailAccounts(),
        apiClient.getInbox(accountId, sync),
      ]);
      const currentAccount = accounts.find((acc) => acc.id === accountId);
      setAccount(currentAccount || null);
      setEmails(inbox);
      if (sync) {
        toast.success("Correos sincronizados");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el buzón");
      toast.error("Error al cargar el buzón");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      // Obtener el contenido HTML del editor
      const htmlContent = messageEditorRef.current?.innerHTML || formData.message;
      
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      formDataToSend.append("emailAccountId", account.id.toString());
      formDataToSend.append("to", formData.to);
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("message", htmlContent);
      
      // Agregar archivos adjuntos
      attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/mailbox/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar el correo");
      }

      const result = await response.json();
      setSuccess("Correo enviado exitosamente");
      setFormData({ to: "", subject: "", message: "" });
      setMessageHtml("");
      setAttachments([]);
      setShowCompose(false);
      setComposeMinimized(false);
      toast.success("Correo enviado exitosamente");
      await loadMailbox();
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo");
      toast.error(err.message || "Error al enviar el correo");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertText = (text: string) => {
    if (messageEditorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        messageEditorRef.current.innerHTML += text;
      }
      setFormData({ ...formData, message: messageEditorRef.current.innerText });
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (messageEditorRef.current) {
      setFormData({ ...formData, message: messageEditorRef.current.innerText });
    }
  };

  const insertLink = () => {
    const url = prompt("Ingresa la URL:");
    if (url) {
      formatText("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Ingresa la URL de la imagen:");
    if (url) {
      formatText("insertImage", url);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isToday(dateObj)) {
      return format(dateObj, "HH:mm");
    } else if (isYesterday(dateObj)) {
      return "Ayer";
    } else {
      return format(dateObj, "dd/MM/yyyy");
    }
  };

  const getEmailPreview = (body: string) => {
    const text = body.replace(/<[^>]*>/g, "");
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };

  // Función para obtener el avatar del remitente
  const getSenderAvatar = (from: string, subject?: string) => {
    const fromLower = from.toLowerCase();
    // Normalizar el asunto: quitar tildes y convertir a minúsculas para mejor detección
    const subjectNormalized = (subject || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " "); // Reemplazar caracteres especiales con espacios
    
    // Si es mensaje de bienvenida, mostrar logo2.png (prioridad más alta)
    // Buscar variaciones de bienvenida sin tildes después de normalizar
    if (
      subjectNormalized.includes("bienvenida") || 
      subjectNormalized.includes("bienvenido") ||
      subjectNormalized.includes("welcome")
    ) {
      return (
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-200 shadow-sm">
          <img
            src="/logo2.png"
            alt="Fylo Mail"
            className="w-full h-full object-contain p-1.5"
            onError={(e) => {
              // Fallback si logo2.png no existe
              console.error("Error cargando logo2.png");
              e.currentTarget.src = "/ln.png";
            }}
          />
        </div>
      );
    }
    
    // Si es noreply o similar, mostrar logo de Fylo
    if (fromLower.includes("noreply") || fromLower.includes("no-reply") || fromLower.includes("fylomail") || fromLower.includes("@fylomail.es")) {
      return (
        <div className="w-12 h-12 rounded-full bg-[#14b4a1] flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src="/ln.png"
            alt="Fylo Mail"
            className="w-10 h-10 object-contain"
          />
        </div>
      );
    }
    // Para otros remitentes, mostrar iniciales
    const name = from.split("@")[0];
    const initial = name.charAt(0).toUpperCase();
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
        {initial}
      </div>
    );
  };

  const getSectionCount = (section: MailSection) => {
    switch (section) {
      case "inbox":
        return emails.filter((e) => !e.isSent && !e.isRead).length;
      case "sent":
        return emails.filter((e) => e.isSent).length;
      default:
        return 0;
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cuenta de correo no encontrada</p>
          <Button onClick={() => {
            // Para usuarios "personas", intentar redirigir a su buzón, sino a emails
            if (isPersonas) {
              apiClient.getEmailAccounts().then((accounts) => {
                if (accounts.length > 0) {
                  router.push(`/mailbox/${accounts[0].id}`);
                } else {
                  router.push("/emails");
                }
              }).catch(() => {
                router.push("/emails");
              });
            } else {
              router.push("/emails");
            }
          }}>
            {isPersonas ? "Volver al Buzón" : "Volver"}
          </Button>
        </div>
      </div>
    );
  }

  const unreadCount = emails.filter((e) => !e.isSent && !e.isRead).length;

  return (
    <>
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(20, 180, 161, 0.3);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(20, 180, 161, 0.5);
          background-clip: padding-box;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(20, 180, 161, 0.3) rgba(0, 0, 0, 0.05);
        }
      `}</style>
      <div className="min-h-screen bg-white flex relative">
      {/* Overlay para móvil cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Estilo Proton (oscuro) que se extiende hasta arriba */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 border-r border-gray-200 bg-[#1a1a1a] flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo en el sidebar negro */}
        <div className="px-4 py-6 border-b border-gray-700 relative">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center group cursor-pointer">
              <img
                src="/ln.png"
                alt="Fylo Mail Logo"
                className="h-16 lg:h-24 w-auto object-contain transition-all duration-300 group-hover:opacity-80"
              />
            </div>
          </div>
          {/* Botones posicionados absolutamente */}
          <div className="absolute left-4 top-6 flex items-center gap-2">
            {!isPersonas && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/emails")}
                className="hover:bg-gray-800 text-gray-300 lg:flex hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hover:bg-gray-800 text-gray-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Contenido del sidebar */}
        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <div className="p-4">
            {/* Botón Nuevo mensaje estilo Proton */}
            <Button
              onClick={() => setShowCompose(true)}
              className="w-full mb-6 bg-[#14b4a1] hover:bg-[#0f9d8a] text-white h-11 rounded-lg shadow-sm hover:shadow-md transition-all font-semibold"
            >
              <Send className="w-5 h-5 mr-2" />
              Nuevo mensaje
            </Button>

            {/* Secciones principales estilo Proton */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setActiveSection("inbox");
                  setSidebarOpen(false); // Cerrar sidebar en móvil al cambiar sección
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                  activeSection === "inbox"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Inbox className={`w-5 h-5 ${activeSection === "inbox" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                <span className="flex-1 text-left">Bandeja de entrada</span>
                {getSectionCount("inbox") > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    activeSection === "inbox"
                      ? "bg-[#14b4a1] text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {getSectionCount("inbox")}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveSection("starred");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                  activeSection === "starred"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === "starred" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                <span className="flex-1 text-left">Destacados</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection("snoozed");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                  activeSection === "snoozed"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === "snoozed" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                <span className="flex-1 text-left">Pospuestos</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection("sent");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                  activeSection === "sent"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Send className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === "sent" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                <span className="flex-1 text-left">Enviados</span>
                {getSectionCount("sent") > 0 && (
                  <span className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded ${
                    activeSection === "sent"
                      ? "bg-[#14b4a1] text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {getSectionCount("sent")}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveSection("drafts");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                  activeSection === "drafts"
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === "drafts" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                <span className="flex-1 text-left">Borradores</span>
              </button>
            </div>

            {/* Sección "Más" estilo Proton */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowMore(!showMore)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
              >
                {showMore ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <span className="flex-1 text-left">Más</span>
              </button>

              {showMore && (
                <div className="mt-1 space-y-0.5">
                  <button
                    onClick={() => setActiveSection("important")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      activeSection === "important"
                        ? "bg-gray-800 text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <AlertCircle className={`w-5 h-5 ${activeSection === "important" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Importantes</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("scheduled")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      activeSection === "scheduled"
                        ? "bg-gray-800 text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Calendar className={`w-5 h-5 ${activeSection === "scheduled" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Programados</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("all")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      activeSection === "all"
                        ? "bg-gray-800 text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Mail className={`w-5 h-5 ${activeSection === "all" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Todos</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("spam")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      activeSection === "spam"
                        ? "bg-gray-800 text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <AlertCircle className={`w-5 h-5 ${activeSection === "spam" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Spam</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("trash")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      activeSection === "trash"
                        ? "bg-gray-800 text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Trash2 className={`w-5 h-5 ${activeSection === "trash" ? "text-[#14b4a1]" : "text-gray-400"}`} />
                    <span className="flex-1 text-left">Papelera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Secciones adicionales estilo Proton */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Carpetas
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all">
                <Folder className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-left">Nueva carpeta</span>
                <span className="text-gray-500">+</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Etiquetas
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-left">Nueva etiqueta</span>
                <span className="text-gray-500">+</span>
              </button>
            </div>

            {/* Información de la cuenta estilo Proton */}
            <div className="mt-auto pt-6 border-t border-gray-700 px-3 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[#14b4a1]" />
                <span className="text-xs font-medium text-gray-300 truncate">
                  {account.address}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {unreadCount > 0 ? (
                  <span className="font-semibold text-[#14b4a1]">{unreadCount} sin leer</span>
                ) : (
                  "Todo leído"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área principal con header y contenido */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Header - Barra superior estilo Proton (solo búsqueda y acciones) */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="px-3 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Botón hamburguesa para móvil */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden hover:bg-gray-100 text-gray-600 flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Buscador centrado estilo Proton */}
              <div className="relative flex-1 max-w-2xl mx-auto">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Buscar mensajes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-lg h-9 sm:h-10 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#14b4a1] focus:ring-1 focus:ring-[#14b4a1] transition-all"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => loadMailbox(true)}
                  disabled={loading}
                  className="flex-shrink-0 hover:bg-gray-100 text-gray-600 h-9 w-9 sm:h-10 sm:w-10"
                  title="Sincronizar correos"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                {user && (
                  <div className="relative flex items-center gap-2 ml-1 sm:ml-2">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] flex items-center justify-center text-white font-semibold text-xs sm:text-sm hover:ring-2 hover:ring-[#14b4a1]/50 transition-all cursor-pointer"
                    >
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </button>
                    
                    {/* Menú desplegable del usuario */}
                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] flex items-center justify-center text-white font-semibold">
                                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {user.name || user.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-2">
                            {/* Plan actual */}
                            <div className="px-3 py-2 mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-500">Plan actual</span>
                                {loadingPlan ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                ) : null}
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {currentPlan ? currentPlan.name : "Gratis"}
                              </p>
                            </div>
                            
                            {/* Botón Mejorar plan */}
                            <button
                              onClick={() => {
                                setUserMenuOpen(false);
                                router.push("/plans");
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#14b4a1] hover:bg-[#14b4a1]/10 rounded-lg transition-colors mb-1"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Mejorar plan</span>
                            </button>
                            
                            <div className="border-t border-gray-200 my-2" />
                            
                            {/* Ayuda y comentarios */}
                            <button
                              onClick={() => {
                                setUserMenuOpen(false);
                                router.push("/help");
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                              <span>Ayuda y comentarios</span>
                            </button>
                            
                            <div className="border-t border-gray-200 my-2" />
                            
                            {/* Cerrar sesión */}
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Cerrar sesión</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de correos - Columna central estilo Proton */}
          <div
            className={`${
              selectedEmail ? "hidden lg:block lg:w-80 xl:w-96" : "w-full lg:w-80 xl:w-96"
            } border-r border-gray-200 bg-white overflow-y-auto flex flex-col flex-shrink-0 custom-scrollbar`}
          >
          {/* Header con título y filtros estilo Proton */}
          <div className="border-b border-gray-200 bg-white sticky top-0 z-10 px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {activeSection === "inbox" ? "Bandeja de entrada" : 
                 activeSection === "sent" ? "Enviados" :
                 activeSection === "starred" ? "Destacados" :
                 activeSection === "drafts" ? "Borradores" :
                 activeSection === "trash" ? "Papelera" :
                 activeSection === "spam" ? "Spam" : "Correos"}
              </h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 hover:text-gray-600 flex-shrink-0">
                <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
            {/* Filtros estilo Proton - Scroll horizontal en móvil */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
              <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
                Todas
              </button>
              <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
                Leído
              </button>
              <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
                Sin leer
              </button>
              <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
                Tiene adjuntos
              </button>
            </div>
          </div>

          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery
                  ? "No se encontraron correos"
                  : activeSection === "inbox"
                  ? "No hay correos nuevos"
                  : "No hay correos en esta sección"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isUnread = !email.isRead;
                return (
                  <div
                    key={email.id}
                    onClick={async () => {
                      setSelectedEmail(email);
                      // Marcar como leído cuando se selecciona
                      if (!email.isRead) {
                        // Actualizar estado local inmediatamente
                        setEmails(prevEmails =>
                          prevEmails.map(e =>
                            e.id === email.id ? { ...e, isRead: true } : e
                          )
                        );
                        // Marcar como leído en el backend
                        try {
                          await apiClient.markEmailAsRead(email.id);
                        } catch (err) {
                          console.error("Error marcando email como leído:", err);
                          // Revertir el cambio local si falla
                          setEmails(prevEmails =>
                            prevEmails.map(e =>
                              e.id === email.id ? { ...e, isRead: false } : e
                            )
                          );
                        }
                      }
                    }}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all group border-l-4 ${
                      isSelected
                        ? "bg-gray-50 border-l-[#14b4a1]"
                        : isUnread
                        ? "bg-white border-l-[#14b4a1] hover:bg-gray-50"
                        : "border-l-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Indicador de estado */}
                      <div className="flex-shrink-0 mt-1">
                        {email.isRead ? (
                          <Circle className="w-4 h-4 text-gray-300 group-hover:text-[#14b4a1] transition-colors" />
                        ) : (
                          <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-[#14b4a1]" />
                          </div>
                        )}
                      </div>
                      
                      {/* Contenido del correo */}
                      <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                        {/* Remitente y fecha */}
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <span
                            className={`text-xs sm:text-sm truncate ${
                              isUnread
                                ? "text-gray-900 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            {email.from}
                          </span>
                          <span className={`text-[10px] sm:text-xs flex-shrink-0 font-medium ${
                            isUnread
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}>
                            {formatDate(email.receivedAt)}
                          </span>
                        </div>
                        
                        {/* Asunto */}
                        <div
                          className={`text-xs sm:text-sm truncate ${
                            isUnread
                              ? "text-gray-900 font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          {email.subject || (
                            <span className="text-gray-400 italic">(Sin asunto)</span>
                          )}
                        </div>
                        
                        {/* Vista previa del mensaje - Oculto en móvil muy pequeño */}
                        <div className={`text-[10px] sm:text-xs line-clamp-2 hidden sm:block ${
                          isUnread ? "text-gray-600" : "text-gray-500"
                        }`}>
                          {getEmailPreview(email.body) || (
                            <span className="italic">Sin contenido</span>
                          )}
                        </div>
                        
                        {/* Indicadores de estado y adjuntos */}
                        <div className="flex items-center gap-2 pt-1">
                          {/* Indicadores de estado */}
                          <div className="flex items-center gap-1">
                            {email.isStarred && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current" title="Destacado" />
                            )}
                            {email.isImportant && (
                              <AlertCircle className="w-3 h-3 text-[#14b4a1]" title="Importante" />
                            )}
                            {email.isSpam && (
                              <AlertCircle className="w-3 h-3 text-orange-500" title="Spam" />
                            )}
                            {email.isArchived && (
                              <Archive className="w-3 h-3 text-gray-400" title="Archivado" />
                            )}
                          </div>
                          
                          {/* Adjuntos */}
                          {email.attachments && email.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3.5 h-3.5 text-[#14b4a1]" />
                              <span className="text-xs text-[#14b4a1] font-medium">
                                {email.attachments.length} adjunto
                                {email.attachments.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vista del correo seleccionado - Columna derecha estilo Proton */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white absolute lg:static inset-0 lg:inset-auto z-30 lg:z-auto">
            {/* Header del correo estilo Proton */}
            <div className="border-b border-gray-200 bg-white px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden hover:bg-[#14b4a1]/20 hover:text-[#14b4a1] transition-all duration-300 h-8 w-8 flex-shrink-0"
                      onClick={() => setSelectedEmail(null)}
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                      {selectedEmail.subject || "(Sin asunto)"}
                    </h2>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 mt-2 sm:mt-3">
                    {/* Avatar del remitente */}
                    {getSenderAvatar(selectedEmail.from, selectedEmail.subject)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-semibold text-xs sm:text-sm truncate">
                          {selectedEmail.from}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 text-[10px] sm:text-xs">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {format(
                            new Date(selectedEmail.receivedAt),
                            "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm",
                            {
                              locale: es,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={selectedEmail.isStarred ? "Quitar destacado" : "Destacar"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(selectedEmail.id);
                    }}
                    className={`h-8 w-8 sm:h-10 sm:w-10 ${
                      selectedEmail.isStarred
                        ? "text-yellow-500 hover:bg-yellow-50"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedEmail.isStarred ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Responder"
                    className="hover:bg-gray-100 text-gray-600 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Reply className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={selectedEmail.isArchived ? "Desarchivar" : "Archivar"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleArchive(selectedEmail.id);
                    }}
                    className="hover:bg-gray-100 text-gray-600 h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
                  >
                    <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  {selectedEmail.isDeleted ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Restaurar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreEmail(selectedEmail.id);
                        }}
                        className="hover:bg-green-50 text-gray-600 hover:text-green-600 h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Eliminar permanentemente"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDelete(selectedEmail.id);
                        }}
                        className="hover:bg-red-50 text-gray-600 hover:text-red-600 h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEmail(selectedEmail.id);
                      }}
                      className="hover:bg-red-50 text-gray-600 hover:text-red-600 h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title={selectedEmail.isSpam ? "No es spam" : "Marcar como spam"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSpam(selectedEmail.id);
                    }}
                    className="hover:bg-orange-50 text-gray-600 hover:text-orange-600 h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
                  >
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={selectedEmail.isImportant ? "Quitar importante" : "Marcar como importante"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleImportant(selectedEmail.id);
                    }}
                    className={`h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex ${
                      selectedEmail.isImportant
                        ? "text-[#14b4a1] hover:bg-[#14b4a1]/10"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Contenido del correo estilo Proton */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 bg-gray-50 custom-scrollbar">
              <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-4 sm:p-6">
                {selectedEmail.htmlBody ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-900"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.htmlBody) }}
                  />
                ) : selectedEmail.body ? (
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.body}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    Este correo no tiene contenido.
                  </div>
                )}

                {/* Adjuntos estilo Proton */}
                {selectedEmail.attachments &&
                  selectedEmail.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Adjuntos
                      </h3>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-[#14b4a1] transition-all"
                          >
                            <Paperclip className="w-5 h-5 text-[#14b4a1]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(attachment.fileSize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="hover:bg-[#14b4a1] hover:text-white text-gray-600">
                              Descargar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

          {/* Vista vacía cuando no hay correo seleccionado en desktop estilo Proton */}
          {!selectedEmail && filteredEmails.length > 0 && (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-white">
              <div className="text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  Selecciona un correo para verlo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email - Flotante estilo Gmail */}
      {showCompose && (
        <div
          className={`fixed ${
            composeMinimized ? "bottom-0 right-0 w-80" : "bottom-4 left-4 w-[600px] max-w-[calc(100vw-2rem)]"
          } bg-white border border-gray-300 rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-300`}
          style={{
            height: composeMinimized ? "auto" : "600px",
            maxHeight: composeMinimized ? "auto" : "calc(100vh - 2rem)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-700">Nuevo mensaje</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-200"
                onClick={() => setComposeMinimized(!composeMinimized)}
                title={composeMinimized ? "Maximizar" : "Minimizar"}
              >
                {composeMinimized ? (
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-gray-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-200"
                onClick={() => {
                  setShowCompose(false);
                  setComposeMinimized(false);
                  setFormData({ to: "", subject: "", message: "" });
                  setMessageHtml("");
                  setAttachments([]);
                }}
                title="Cerrar"
              >
                <X className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>

          {!composeMinimized && (
            <form onSubmit={handleSend} className="flex flex-col flex-1 overflow-hidden">
              {/* Campos del formulario */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Desde */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-16 flex-shrink-0">Desde</span>
                  <span className="text-gray-900 font-medium">{account?.address || ""}</span>
                </div>

                {/* Para */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="text-gray-500 text-sm w-16 flex-shrink-0">Para</span>
                  <Input
                    type="email"
                    placeholder="Destinatarios"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    className="flex-1 border-0 px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:outline-none font-medium"
                    required
                  />
                </div>

                {/* Asunto */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="text-gray-500 text-sm w-16 flex-shrink-0">Asunto</span>
                  <Input
                    type="text"
                    placeholder="Asunto"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="flex-1 border-0 px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:outline-none font-medium"
                    required
                  />
                </div>

                {/* Editor de mensaje */}
                <div className="flex-1 min-h-[200px] mt-2">
                  <div
                    ref={messageEditorRef}
                    contentEditable
                    className="w-full min-h-[200px] p-2 text-sm text-gray-900 focus:outline-none border border-gray-200 rounded"
                    style={{ whiteSpace: "pre-wrap" }}
                    onInput={(e) => {
                      if (messageEditorRef.current) {
                        setFormData({ ...formData, message: messageEditorRef.current.innerText });
                        // Sanitizar HTML antes de guardar
                        const sanitized = DOMPurify.sanitize(messageEditorRef.current.innerHTML);
                        setMessageHtml(sanitized);
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(messageHtml) }}
                  />
                </div>

                {/* Archivos adjuntos */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-xs"
                      >
                        <Paperclip className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Errores y éxito */}
                {error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-xs text-[#14b4a1] bg-[#14b4a1]/10 p-2 rounded border border-[#14b4a1]/20">
                    {success}
                  </div>
                )}
              </div>

              {/* Barra de herramientas inferior */}
              <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Enviar */}
                  <Button
                    type="submit"
                    disabled={sending}
                    size="sm"
                    className="bg-[#14b4a1] hover:bg-[#0f9d8a] text-white h-8 px-4 text-xs font-medium"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </>
                    )}
                  </Button>

                  {/* Negritas */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={() => formatText("bold")}
                    title="Negrita"
                  >
                    <Bold className="w-4 h-4 text-gray-600" />
                  </Button>

                  {/* Adjuntar archivo */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="w-4 h-4 text-gray-600" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Insertar link */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={insertLink}
                    title="Insertar link"
                  >
                    <LinkIcon className="w-4 h-4 text-gray-600" />
                  </Button>

                  {/* Emojis */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={() => insertText("😀")}
                    title="Insertar emoji"
                  >
                    <Smile className="w-4 h-4 text-gray-600" />
                  </Button>

                  {/* Insertar desde Drive */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={() => toast.info("Funcionalidad de Drive próximamente")}
                    title="Insertar desde Drive"
                  >
                    <HardDrive className="w-4 h-4 text-gray-600" />
                  </Button>

                  {/* Insertar imagen */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={insertImage}
                    title="Insertar imagen"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                  </Button>

                  {/* Más opciones */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-200"
                    title="Más opciones"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>

                {/* Botón cancelar */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-600 hover:bg-gray-200"
                  onClick={() => {
                    setShowCompose(false);
                    setComposeMinimized(false);
                    setFormData({ to: "", subject: "", message: "" });
                    setMessageHtml("");
                    setAttachments([]);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
      </div>
    </>
  );
}
