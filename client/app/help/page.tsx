"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/auth-store";
import { useTicketChatStore } from "@/store/ticket-chat-store";
import { apiClient } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { 
  Mail, 
  Globe, 
  CreditCard, 
  MessageSquare, 
  Settings,
  AlertCircle,
  BookOpen,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Search,
  Send,
  X,
  Upload,
  XCircle,
  Image as ImageIcon,
  File,
  HelpCircle,
  Code,
  ChevronDown,
  Menu,
  Loader2
} from "lucide-react";

// Componente HelpDropdown
function HelpDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="relative px-6 py-2.5 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 rounded-full group flex items-center gap-1">
        <span className="relative z-10">Ayuda y soporte</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        <span className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm" />
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-3/4 transition-all duration-300 rounded-full" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 w-64 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="py-2">
              <Link
                href="/help"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors bg-[#14b4a1]/5"
              >
                <HelpCircle className="w-4 h-4 text-[#14b4a1]" />
                <span className="font-semibold">Centro de Ayuda</span>
              </Link>
              <Link
                href="/integration"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Code className="w-4 h-4 text-[#14b4a1]" />
                <span>Integración API</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lista de todas las preguntas frecuentes para búsqueda
const faqItems = [
  { id: "crear-correos", title: "¿Cómo crear una cuenta de correo electrónico?", content: "crear cuenta correo dominio verificar" },
  { id: "vincular-dominios", title: "¿Cómo vincular y verificar mi dominio?", content: "vincular dominio verificar DNS configuración" },
  { id: "enviar-correos", title: "¿Cómo enviar correos electrónicos?", content: "enviar correo mensaje buzón" },
  { id: "recibir-correos", title: "¿Cómo ver los correos recibidos?", content: "recibir correo ver leer mensaje" },
  { id: "planes-pagos", title: "¿Cómo funcionan los planes y pagos?", content: "plan pago suscripción facturación" },
  { id: "limites", title: "¿Cuáles son los límites de mi plan?", content: "límite plan cuenta dominio almacenamiento" },
  { id: "eliminar-cuentas", title: "¿Cómo eliminar una cuenta de correo?", content: "eliminar cuenta correo borrar" },
  { id: "seguridad", title: "¿Cómo mantener seguras mis cuentas de correo?", content: "seguridad contraseña protección" },
  { id: "problemas-comunes", title: "Problemas comunes y soluciones", content: "problema error solución ayuda" },
  { id: "contacto", title: "¿Necesito más ayuda?", content: "contacto soporte ayuda ticket" },
];

export default function HelpPage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openChat } = useTicketChatStore();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navbarScrolled, setNavbarScrolled] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setNavbarScrolled(currentScrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filtrar preguntas según búsqueda
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;
    const query = searchQuery.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para crear un ticket");
      router.push("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket = await apiClient.createTicket({
        ...ticketForm,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });
      toast.success("Ticket creado exitosamente. Abriendo chat...");
      setTicketForm({ subject: "", description: "", priority: "medium" });
      setSelectedFiles([]);
      setIsContactOpen(false);
      if (isAuthenticated) {
        openChat(newTicket.id);
      }
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      const errorMessage = error?.message || "Error al crear el ticket. Intenta nuevamente.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`El archivo ${file.name} es demasiado grande. Máximo 10MB.`);
          return false;
        }
        return true;
      });
      setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <style jsx global>{`
          .xstar-gradient {
            background: linear-gradient(135deg, #14b4a1 0%, #13282b 100%);
          }
          .xstar-gradient-animated {
            background: linear-gradient(-45deg, #14b4a1, #13282b, #14b4a1, #13282b);
            background-size: 400% 400%;
            animation: gradient-shift 8s ease infinite;
          }
          .xstar-gradient-reverse {
            background: linear-gradient(135deg, #13282b 0%, #14b4a1 100%);
          }
          .xstar-primary {
            color: #14b4a1;
          }
          .xstar-primary-bg {
            background-color: #14b4a1;
          }
          .xstar-secondary {
            color: #13282b;
          }
          .xstar-secondary-bg {
            background-color: #13282b;
          }
          .xstar-icon-primary {
            color: #14b4a1;
          }
          .xstar-icon-secondary {
            color: #13282b;
          }
          .xstar-icon-bg-primary {
            background-color: rgba(20, 180, 161, 0.1);
          }
          .xstar-icon-bg-secondary {
            background-color: rgba(19, 40, 43, 0.1);
          }
          .glow-effect {
            box-shadow: 0 0 20px rgba(20, 180, 161, 0.3), 0 0 40px rgba(20, 180, 161, 0.2);
          }
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }
          .glass-effect {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes morph {
            0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          }
          @keyframes float-enhanced {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            33% { transform: translateY(-20px) translateX(10px); }
            66% { transform: translateY(-10px) translateX(-10px); }
          }
          @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes scale-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes slide-down {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-morph {
            animation: morph 8s ease-in-out infinite;
          }
          .animate-float-enhanced {
            animation: float-enhanced 6s ease-in-out infinite;
          }
          .animate-rotate-slow {
            animation: rotate-slow 20s linear infinite;
          }
          .animate-glow-pulse {
            animation: pulse-glow 3s ease-in-out infinite;
          }
          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }
          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }
        `}</style>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 flex justify-center px-4 py-4 transition-all duration-500">
          <div className={`relative w-full max-w-5xl rounded-full backdrop-blur-2xl transition-all duration-500 ${
            navbarScrolled 
              ? "bg-black/95 border-2 border-white/30 shadow-2xl shadow-black/50" 
              : "bg-black/85 border-2 border-white/20 shadow-xl shadow-black/40"
          }`}>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
            
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/30 animate-float-enhanced blur-sm"
                style={{
                  left: `${30 + i * 20}%`,
                  top: '50%',
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '4s',
                  transform: `translateY(${Math.sin(scrollY * 0.02 + i) * 3}px)`,
                }}
              />
            ))}
            
            <div className="container mx-auto px-6 sm:px-8 relative">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center group relative z-10">
                  <div className="absolute -inset-5 bg-white/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src="/ln.png"
                    alt="Xstar Mail Logo"
                    className="h-20 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] relative z-10"
                  />
                </Link>
                
                <div className="hidden lg:flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
                  <Link 
                    href="/plans" 
                    className="relative px-6 py-2.5 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 rounded-full group"
                  >
                    <span className="relative z-10">Precios</span>
                    <span className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm" />
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-3/4 transition-all duration-300 rounded-full" />
                  </Link>
                  <HelpDropdown />
                </div>
                
                <div className="hidden md:flex items-center gap-3 relative z-10">
                  <Link href="/auth">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="px-5 h-10 text-sm font-bold text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-300 rounded-full group relative overflow-hidden"
                    >
                      <span className="relative z-10">Iniciar sesión</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button 
                      className="px-6 h-10 text-sm font-extrabold bg-white text-black hover:bg-white/90 border-0 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/30 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Obtener
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                  </Link>
                </div>
                
                <div className="md:hidden relative z-10">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`relative p-2.5 transition-all duration-300 rounded-full group ${
                      mobileMenuOpen 
                        ? "bg-white/20 border border-white/40" 
                        : "hover:bg-white/10 border border-transparent hover:border-white/20"
                    }`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    <div className={`transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`}>
                      {mobileMenuOpen ? (
                        <X className="w-6 h-6 text-white" />
                      ) : (
                        <Menu className="w-6 h-6 text-white/80" />
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            
            {mobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 right-0 mt-2 rounded-3xl bg-black/98 backdrop-blur-2xl border-2 border-white/30 shadow-2xl shadow-black/50 animate-slide-down overflow-hidden z-50">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
                
                <div className="px-6 py-6 space-y-4 relative">
                  <div className="flex items-center mb-4">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center group">
                      <img
                        src="/ln.png"
                        alt="Xstar Mail Logo"
                        className="h-12 w-auto object-contain transition-all duration-500 group-hover:scale-110"
                      />
                    </Link>
                  </div>
                  
                  <Link 
                    href="/plans" 
                    className="block px-6 py-3.5 text-base font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 border border-transparent hover:border-white/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Precios
                  </Link>
                  <div>
                    <button
                      onClick={() => setHelpMenuOpen(!helpMenuOpen)}
                      className="w-full flex items-center justify-between px-6 py-3.5 text-base font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 border border-transparent hover:border-white/20"
                    >
                      <span>Ayuda y soporte</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${helpMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {helpMenuOpen && (
                      <div className="pl-6 mt-2 space-y-2">
                        <Link
                          href="/help"
                          className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 bg-white/5"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Centro de Ayuda
                        </Link>
                        <Link
                          href="/integration"
                          className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Integración API
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 space-y-3 border-t border-white/20">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full h-12 text-base font-bold border border-white/40 bg-transparent hover:bg-white/10 hover:text-white text-white/80 transition-all duration-300 rounded-full"
                      >
                        Iniciar sesión
                      </Button>
                    </Link>
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        className="w-full h-12 text-base font-extrabold bg-white text-black hover:bg-white/90 border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/30 rounded-full relative overflow-hidden group"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Obtener
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden min-h-[70vh] flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-[#14b4a1]/3 to-[#13282b]/5" />
            
            <div 
              className="absolute w-[600px] h-[600px] bg-gradient-to-br from-[#14b4a1]/20 to-[#13282b]/15 animate-morph animate-glow-pulse"
              style={{
                left: `${mousePosition.x / 15 - 300}px`,
                top: `${mousePosition.y / 15 - 300}px`,
                transition: "all 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            />
            <div 
              className="absolute w-[500px] h-[500px] bg-gradient-to-br from-[#13282b]/15 to-[#14b4a1]/10 animate-morph animate-glow-pulse"
              style={{
                right: `${mousePosition.x / 20 - 250}px`,
                bottom: `${mousePosition.y / 20 - 250}px`,
                transition: "all 1s cubic-bezier(0.23, 1, 0.32, 1)",
                animationDelay: "1s"
              }}
            />
            
            <div className="absolute top-1/4 left-1/4 w-96 h-96 border-2 border-[#14b4a1]/10 rounded-full animate-rotate-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 border-2 border-[#13282b]/10 rounded-full animate-rotate-slow" style={{ animationDirection: "reverse", animationDuration: "25s" }} />
            
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `
                linear-gradient(to right, #14b4a1 1px, transparent 1px),
                linear-gradient(to bottom, #14b4a1 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }} />
            
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-[#14b4a1]/20 animate-float-enhanced blur-sm"
                style={{
                  width: `${4 + (i % 3) * 2}px`,
                  height: `${4 + (i % 3) * 2}px`,
                  left: `${10 + (i % 4) * 25}%`,
                  top: `${20 + Math.floor(i / 4) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${5 + (i % 3)}s`,
                  transform: `translateY(${scrollY * 0.1}px)`,
                }}
              />
            ))}
            
            {[...Array(3)].map((_, i) => (
              <div
                key={`line-${i}`}
                className="absolute w-px h-full bg-gradient-to-b from-transparent via-[#14b4a1]/20 to-transparent"
                style={{
                  left: `${25 + i * 25}%`,
                  animation: `pulse-glow ${3 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  transform: `translateX(${Math.sin(scrollY * 0.01 + i) * 10}px)`,
                }}
              />
            ))}
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-[#14b4a1]/30 shadow-lg animate-scale-in">
                  <div className="relative">
                    <HelpCircle className="w-5 h-5 text-[#14b4a1] animate-pulse" />
                    <div className="absolute inset-0 bg-[#14b4a1]/20 blur-xl" />
                  </div>
                  <span className="text-sm font-semibold text-[#14b4a1] tracking-wide">
                    CENTRO DE AYUDA
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.05] tracking-tight">
                  <span className="block mb-2 text-foreground">Encuentra respuestas</span>
                  <span className="block bg-gradient-to-r from-[#14b4a1] via-[#0f9d8a] to-[#13282b] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    a todas tus preguntas
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  Aprende a usar el sistema de manera eficiente y resuelve cualquier duda que tengas sobre Xstar Mail.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-24 sm:py-40 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Buscador */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar en el centro de ayuda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 h-14 text-base bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {filteredFaqs.length} resultado{filteredFaqs.length !== 1 ? "s" : ""} encontrado{filteredFaqs.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Sección de Contacto */}
              <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-2xl p-6 md:p-8 shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <MessageSquare className="w-6 h-6 text-[#14b4a1]" />
                      <span>Contactar Soporte</span>
                    </h2>
                    <p className="text-muted-foreground">
                      ¿No encuentras la respuesta que buscas? Crea un ticket y nuestro equipo te ayudará.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsContactOpen(!isContactOpen)}
                    className="shrink-0 bg-[#14b4a1] hover:bg-[#0f9d8a] text-white"
                  >
                    {isContactOpen ? (
                      <>
                        <X className="w-4 h-4" />
                        Cerrar
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Crear Ticket
                      </>
                    )}
                  </Button>
                </div>

                {isContactOpen && (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">
                        Asunto
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej: Problema con la verificación de dominio"
                        value={ticketForm.subject}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, subject: e.target.value })
                        }
                        required
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">
                        Prioridad
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: "low", label: "Baja", icon: "○" },
                          { value: "medium", label: "Media", icon: "◐" },
                          { value: "high", label: "Alta", icon: "◑" },
                          { value: "urgent", label: "Urgente", icon: "●" },
                        ].map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            onClick={() =>
                              setTicketForm({
                                ...ticketForm,
                                priority: priority.value as "low" | "medium" | "high" | "urgent",
                              })
                            }
                            className={`p-4 rounded-lg border transition-all ${
                              ticketForm.priority === priority.value
                                ? "bg-[#14b4a1] text-white border-[#14b4a1] shadow-md"
                                : "bg-card text-foreground border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-2xl">{priority.icon}</span>
                              <span className="text-xs font-medium">{priority.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">
                        Descripción
                      </label>
                      <Textarea
                        placeholder="Describe tu problema o consulta en detalle..."
                        value={ticketForm.description}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, description: e.target.value })
                        }
                        rows={6}
                        required
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">
                        Archivos adjuntos (Opcional)
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Seleccionar archivos</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf,.doc,.docx,.txt"
                              onChange={handleFileChange}
                              className="hidden"
                              disabled={selectedFiles.length >= 5}
                            />
                          </label>
                          <span className="text-xs text-muted-foreground">
                            Máximo 5 archivos, 10MB cada uno
                          </span>
                        </div>
                        {selectedFiles.length > 0 && (
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-muted/50 border rounded-lg"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {file.type.startsWith("image/") ? (
                                    <ImageIcon className="w-4 h-4 text-foreground flex-shrink-0" />
                                  ) : (
                                    <File className="w-4 h-4 text-foreground flex-shrink-0" />
                                  )}
                                  <span className="text-sm text-foreground truncate">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                                >
                                  <XCircle className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={isSubmitting} className="bg-[#14b4a1] hover:bg-[#0f9d8a] text-white">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Enviar Ticket
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsContactOpen(false);
                          setTicketForm({ subject: "", description: "", priority: "medium" });
                          setSelectedFiles([]);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Secciones principales */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#14b4a1]" />
                  <span>Guías Rápidas</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <HelpCard
                    icon={<Mail className="w-7 h-7" />}
                    title="Correos Electrónicos"
                    description="Aprende a crear, gestionar y usar tus cuentas de correo"
                  />
                  <HelpCard
                    icon={<Globe className="w-7 h-7" />}
                    title="Dominios"
                    description="Vincular y verificar tus dominios personalizados paso a paso"
                  />
                  <HelpCard
                    icon={<CreditCard className="w-7 h-7" />}
                    title="Pagos y Planes"
                    description="Información completa sobre suscripciones y facturación"
                  />
                  <HelpCard
                    icon={<MessageSquare className="w-7 h-7" />}
                    title="Enviar Correos"
                    description="Cómo enviar y recibir mensajes de forma segura"
                  />
                  <HelpCard
                    icon={<Settings className="w-7 h-7" />}
                    title="Configuración"
                    description="Ajusta las preferencias y opciones de tu cuenta"
                  />
                  <HelpCard
                    icon={<Shield className="w-7 h-7" />}
                    title="Seguridad"
                    description="Protege tus datos y mantén tus cuentas seguras"
                  />
                </div>
              </div>

              {/* Preguntas Frecuentes */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-[#14b4a1]" />
                    <span>Preguntas Frecuentes</span>
                  </h2>
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                    {10} preguntas
                  </span>
                </div>

                <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl overflow-hidden shadow-lg">
                  <Accordion 
                    type="single" 
                    collapsible 
                    className="w-full"
                  >
                    {(!searchQuery || filteredFaqs.some(f => f.id === "crear-correos")) && (
                    <AccordionItem value="crear-correos" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <Mail className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo crear una cuenta de correo electrónico?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Para crear una cuenta de correo electrónico en nuestro sistema, sigue estos pasos:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                          <li className="leading-relaxed">Primero, debes vincular un dominio a tu cuenta (ve a la sección "Dominios")</li>
                          <li className="leading-relaxed">Una vez que tu dominio esté verificado, ve a "Cuentas de Email"</li>
                          <li className="leading-relaxed">Haz clic en "Crear Cuenta de Email"</li>
                          <li className="leading-relaxed">Selecciona el dominio que deseas usar</li>
                          <li className="leading-relaxed">Ingresa la dirección de correo (ej: "contacto" para contacto@tudominio.com)</li>
                          <li className="leading-relaxed">Establece una contraseña segura</li>
                          <li className="leading-relaxed">Haz clic en "Crear"</li>
                        </ol>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Nota:</strong> El número máximo de cuentas de correo que puedes crear depende de tu plan de suscripción.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "vincular-dominios")) && (
                    <AccordionItem value="vincular-dominios" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <Globe className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo vincular y verificar mi dominio?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Para vincular un dominio personalizado:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                          <li className="leading-relaxed">Ve a la sección "Dominios" en tu dashboard</li>
                          <li className="leading-relaxed">Haz clic en "Vincular Dominio"</li>
                          <li className="leading-relaxed">Ingresa tu dominio (ej: "midominio.com" sin www)</li>
                          <li className="leading-relaxed">Obtendrás instrucciones de configuración DNS</li>
                          <li className="leading-relaxed">Ve al panel de control de tu proveedor de dominio</li>
                          <li className="leading-relaxed">Configura los registros DNS según las instrucciones proporcionadas</li>
                          <li className="leading-relaxed">Espera a que se verifique automáticamente (puede tardar hasta 48 horas)</li>
                        </ol>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Tip:</strong> Los cambios DNS pueden tardar en propagarse. Si después de 48 horas no se verifica, verifica que los registros DNS estén configurados correctamente.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {/* Resto de FAQs - Similar estructura */}
                    {(!searchQuery || filteredFaqs.some(f => f.id === "enviar-correos")) && (
                    <AccordionItem value="enviar-correos" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <MessageSquare className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo enviar correos electrónicos?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Para enviar correos desde tu cuenta:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                          <li className="leading-relaxed">Ve a la sección "Correos" o accede directamente a tu buzón</li>
                          <li className="leading-relaxed">Haz clic en la cuenta de correo desde la que deseas enviar</li>
                          <li className="leading-relaxed">En el buzón, haz clic en "Nuevo Correo" o "Enviar"</li>
                          <li className="leading-relaxed">Ingresa el destinatario en el campo "Para"</li>
                          <li className="leading-relaxed">Escribe el asunto del correo</li>
                          <li className="leading-relaxed">Redacta tu mensaje</li>
                          <li className="leading-relaxed">Ingresa la contraseña de la cuenta de correo para autenticación</li>
                          <li className="leading-relaxed">Haz clic en "Enviar"</li>
                        </ol>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Importante:</strong> Necesitas la contraseña de la cuenta de correo para enviar mensajes. Esta es una medida de seguridad.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "recibir-correos")) && (
                    <AccordionItem value="recibir-correos" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <Mail className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo ver los correos recibidos?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Para ver tus correos recibidos:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                          <li className="leading-relaxed">Accede a tu buzón desde la sección "Correos"</li>
                          <li className="leading-relaxed">Selecciona la cuenta de correo que deseas revisar</li>
                          <li className="leading-relaxed">Verás una lista de todos los correos recibidos</li>
                          <li className="leading-relaxed">Haz clic en cualquier correo para leerlo</li>
                          <li className="leading-relaxed">Los correos no leídos aparecerán destacados</li>
                        </ol>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Nota:</strong> Los correos se almacenan según el límite de almacenamiento de tu plan.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "planes-pagos")) && (
                    <AccordionItem value="planes-pagos" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <CreditCard className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo funcionan los planes y pagos?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Nuestro sistema ofrece diferentes planes de suscripción:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                          <div className="bg-muted/50 border rounded-lg p-4">
                            <div className="font-semibold text-foreground mb-2">Plan Gratis</div>
                            <div className="text-sm text-muted-foreground">1 cuenta, 1 dominio, 1GB</div>
                          </div>
                          <div className="bg-muted/50 border rounded-lg p-4">
                            <div className="font-semibold text-foreground mb-2">Plan Básico</div>
                            <div className="text-sm text-muted-foreground">5 cuentas, 2 dominios, 10GB</div>
                          </div>
                          <div className="bg-muted/50 border rounded-lg p-4">
                            <div className="font-semibold text-foreground mb-2">Plan Profesional</div>
                            <div className="text-sm text-muted-foreground">20 cuentas, 5 dominios, 50GB</div>
                          </div>
                          <div className="bg-muted/50 border rounded-lg p-4">
                            <div className="font-semibold text-foreground mb-2">Plan Empresarial</div>
                            <div className="text-sm text-muted-foreground">100 cuentas, 20 dominios, 500GB</div>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                          Para cambiar de plan:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                          <li className="leading-relaxed">Ve a la sección "Planes" en tu dashboard</li>
                          <li className="leading-relaxed">Revisa los planes disponibles y sus características</li>
                          <li className="leading-relaxed">Selecciona el plan que deseas</li>
                          <li className="leading-relaxed">Haz clic en "Suscribirse" o "Actualizar"</li>
                          <li className="leading-relaxed">Completa el proceso de pago</li>
                          <li className="leading-relaxed">Tu plan se actualizará automáticamente</li>
                        </ol>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Facturación:</strong> Los planes se facturan mensual o anualmente según tu elección. Puedes cancelar tu suscripción en cualquier momento.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "limites")) && (
                    <AccordionItem value="limites" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <AlertCircle className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cuáles son los límites de mi plan?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Cada plan tiene límites específicos:
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                            <Mail className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm text-foreground">Cuentas de correo</p>
                              <p className="text-sm text-muted-foreground">Número máximo de cuentas que puedes crear</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                            <Globe className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm text-foreground">Dominios</p>
                              <p className="text-sm text-muted-foreground">Número máximo de dominios que puedes vincular</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                            <Settings className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm text-foreground">Almacenamiento</p>
                              <p className="text-sm text-muted-foreground">Espacio total disponible para todos tus correos</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                          Puedes ver tus límites actuales y el uso en la sección "Planes" de tu dashboard.
                        </p>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Al alcanzar un límite:</strong> No podrás crear más recursos hasta que actualices tu plan o elimines recursos existentes.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "eliminar-cuentas")) && (
                    <AccordionItem value="eliminar-cuentas" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <Mail className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo eliminar una cuenta de correo?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Para eliminar una cuenta de correo:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                          <li className="leading-relaxed">Ve a la sección "Cuentas de Email"</li>
                          <li className="leading-relaxed">Encuentra la cuenta que deseas eliminar</li>
                          <li className="leading-relaxed">Haz clic en el botón de eliminar (ícono de basura)</li>
                          <li className="leading-relaxed">Confirma la eliminación</li>
                        </ol>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Advertencia:</strong> Esta acción no se puede deshacer. Todos los correos almacenados en esa cuenta se eliminarán permanentemente.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "seguridad")) && (
                    <AccordionItem value="seguridad" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <Shield className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Cómo mantener seguras mis cuentas de correo?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Recomendaciones de seguridad:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Usa contraseñas fuertes y únicas",
                            "No compartas tus contraseñas",
                            "Cambia contraseñas periódicamente",
                            "No hagas clic en enlaces sospechosos",
                            "Verifica siempre el remitente",
                            "Usa autenticación de dos factores"
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
                              <CheckCircle2 className="w-4 h-4 text-[#14b4a1] flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Importante:</strong> Si sospechas que tu cuenta ha sido comprometida, cambia la contraseña inmediatamente y contacta al soporte.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "problemas-comunes")) && (
                    <AccordionItem value="problemas-comunes" className="border-b">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <AlertCircle className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">Problemas comunes y soluciones</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20 flex-shrink-0">
                                <Mail className="w-5 h-5 text-[#14b4a1]" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 text-foreground">No puedo crear más cuentas de correo</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  Has alcanzado el límite de tu plan. Considera actualizar a un plan superior o eliminar cuentas que no uses.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20 flex-shrink-0">
                                <Globe className="w-5 h-5 text-[#14b4a1]" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 text-foreground">Mi dominio no se verifica</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  Verifica que los registros DNS estén configurados correctamente. Puede tardar hasta 48 horas en propagarse.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20 flex-shrink-0">
                                <MessageSquare className="w-5 h-5 text-[#14b4a1]" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 text-foreground">No puedo enviar correos</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  Asegúrate de estar usando la contraseña correcta de la cuenta de correo. Verifica que la cuenta esté activa.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20 flex-shrink-0">
                                <Mail className="w-5 h-5 text-[#14b4a1]" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1 text-foreground">No recibo correos</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  Verifica que el dominio esté correctamente verificado y que los registros DNS estén configurados.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}

                    {(!searchQuery || filteredFaqs.some(f => f.id === "contacto")) && (
                    <AccordionItem value="contacto">
                      <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-[#14b4a1]/10 p-2 rounded-lg border border-[#14b4a1]/20">
                            <Users className="w-5 h-5 text-[#14b4a1]" />
                          </div>
                          <span className="font-semibold">¿Necesito más ayuda?</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          Si no encuentras la respuesta que buscas:
                        </p>
                        <div className="space-y-3">
                          {[
                            "Revisa todas las secciones de este centro de ayuda",
                            "Verifica la documentación técnica si eres administrador",
                            "Contacta al soporte técnico a través del sistema"
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                              <ArrowRight className="w-4 h-4 text-[#14b4a1] flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#14b4a1]/10 border border-[#14b4a1]/20 rounded-lg p-4 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#14b4a1] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">
                            <strong className="font-semibold">Tip:</strong> Antes de contactar soporte, asegúrate de tener a mano información sobre tu problema, como capturas de pantalla o mensajes de error.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )}
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-16 bg-[#13282b] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="space-y-4">
                <Link href="/" className="flex items-center group">
                  <img
                    src="/ln.png"
                    alt="Xstar Mail Logo"
                    className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <p className="text-sm text-white/70">
                  Un Internet mejor comienza por la privacidad y la libertad.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-white">Producto</h4>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>
                    <Link href="/plans" className="hover:text-[#14b4a1] transition-colors">
                      Planes
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="hover:text-[#14b4a1] transition-colors">
                      Ayuda y soporte
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-white">Empresa</h4>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>
                    <a href="#" className="hover:text-[#14b4a1] transition-colors">
                      Sobre nosotros
                    </a>
                  </li>
                  <li>
                    <Link href="/feedback" className="hover:text-[#14b4a1] transition-colors">
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-white">Legal</h4>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>
                    <a href="#" className="hover:text-[#14b4a1] transition-colors">
                      Términos de Servicio
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#14b4a1] transition-colors">
                      Política de Privacidad
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 text-center text-sm text-white/60">
              <p>© {new Date().getFullYear()} Xstar Mail. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function HelpCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative border-2 border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-xl hover:border-[#14b4a1]/50">
      <div className="relative">
        <div className="inline-flex p-3 rounded-xl bg-[#14b4a1] mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <div className="text-white">
            {icon}
          </div>
        </div>
        <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-[#14b4a1] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
