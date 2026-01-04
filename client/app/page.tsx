"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuthStore } from "@/store/auth-store";
import { apiClient, type Plan } from "@/lib/api";
import { 
  Mail, 
  Shield, 
  Globe, 
  ArrowRight, 
  Loader2,
  EyeOff,
  Ban,
  Key,
  Clock,
  Server,
  Code,
  Award,
  CheckCircle2,
  Lock,
  Search,
  Star,
  Smartphone,
  Monitor,
  Menu,
  Sparkles,
  Zap,
  Layers,
  TrendingUp,
  Users,
  FileCheck,
  BadgeCheck,
  X,
  ChevronDown,
  HelpCircle,
  BookOpen,
  Building2
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
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[#14b4a1]" />
                <span>Centro de Ayuda</span>
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

// Componente PricesDropdown
function PricesDropdown() {
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
        <span className="relative z-10">Precios</span>
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
                href="/pricing?category=personas"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4 text-[#14b4a1]" />
                <span>Para Personas</span>
              </Link>
              <Link
                href="/pricing?category=empresas"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Building2 className="w-4 h-4 text-[#14b4a1]" />
                <span>Para Empresas</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [pricingMenuOpen, setPricingMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [pricingCategory, setPricingCategory] = useState<"personas" | "empresas">("personas");
  const [pricingPlans, setPricingPlans] = useState<Plan[]>([]);
  const [loadingPricingPlans, setLoadingPricingPlans] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      setLoadingPricingPlans(true);
      const plans = await apiClient.getPlans();
      setPricingPlans(plans);
    } catch (err: any) {
      console.error("Error loading pricing plans:", err);
      // No mostrar error al usuario si es un error de red (el servidor puede no estar corriendo)
      if (err?.isNetworkError) {
        console.warn("⚠️ Servidor no disponible. Los planes se cargarán cuando el servidor esté disponible.");
      }
    } finally {
      setLoadingPricingPlans(false);
    }
  };

  const filteredPricingPlans = pricingPlans.filter(
    (plan) => plan.category === pricingCategory && plan.isActive
  );

  useEffect(() => {
    const redirectToMailbox = async () => {
      if (!isLoading && isAuthenticated && !redirecting) {
        setRedirecting(true);
        try {
          // Obtener las cuentas de correo del usuario
          const accounts = await apiClient.getEmailAccounts();
          
          if (accounts.length > 0) {
            // Redirigir al buzón de la primera cuenta
            router.push(`/mailbox/${accounts[0].id}`);
          } else {
            // Si no hay cuentas, intentar asegurar una cuenta automáticamente
            try {
              const result = await apiClient.ensureEmailAccount();
              if (result.success && result.account) {
                router.push(`/mailbox/${result.account.id}`);
              } else {
                // Si no se puede crear, redirigir a emails para que el usuario cree una
                router.push("/emails");
              }
            } catch (error) {
              console.error("Error asegurando cuenta:", error);
              router.push("/emails");
            }
          }
        } catch (error) {
          console.error("Error obteniendo cuentas:", error);
          router.push("/emails");
        } finally {
          setRedirecting(false);
        }
      }
    };

    redirectToMailbox();
  }, [isAuthenticated, isLoading, router, redirecting]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
      </div>
    );
  }

  return (
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
      `}</style>

      {/* Navigation - Diseño Compacto, Centrado y Circular en Negro y Blanco */}
      <nav className="fixed top-0 w-full z-50 flex justify-center px-4 py-4 transition-all duration-500">
        {/* Fondo flotante compacto y centrado - Negro y Blanco */}
        <div className={`relative w-full max-w-5xl rounded-full backdrop-blur-2xl transition-all duration-500 ${
          navbarScrolled 
            ? "bg-black/95 border-2 border-white/30 shadow-2xl shadow-black/50" 
            : "bg-black/85 border-2 border-white/20 shadow-xl shadow-black/40"
        }`}>
          {/* Líneas de energía horizontales - Blanco */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
          
          {/* Partículas flotantes - Blanco */}
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
              {/* Logo */}
              <Link href="/" className="flex items-center group relative z-10">
                <div className="absolute -inset-5 bg-white/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src="/ln.png"
                  alt="Fylo Mail - Servicio de Correo Electrónico Profesional - Logo"
                  className="h-20 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] relative z-10"
                />
              </Link>
              
              {/* Navigation Links - Centrados */}
              <div className="hidden lg:flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
                {/* Precios con dropdown */}
                <PricesDropdown />
                {/* Ayuda y soporte con dropdown */}
                <HelpDropdown />
              </div>
              
              {/* Right Side Actions */}
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
              
              {/* Mobile Menu Button */}
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
          
          {/* Mobile Menu - Mejorado para Responsive - Fuera del contenedor principal */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-2 rounded-3xl bg-black/98 backdrop-blur-2xl border-2 border-white/30 shadow-2xl shadow-black/50 animate-slide-down overflow-hidden z-50">
              {/* Líneas de energía horizontales - Blanco */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
              
              <div className="px-6 py-6 space-y-4 relative">
                {/* Logo en el menú móvil */}
                <div className="flex items-center mb-4">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center group">
                    <img
                      src="/ln.png"
                      alt="Fylo Mail - Servicio de Correo Electrónico Profesional - Logo"
                      className="h-12 w-auto object-contain transition-all duration-500 group-hover:scale-110"
                    />
                  </Link>
                </div>
                
                {/* Precios con submenu en móvil */}
                <div>
                  <button
                    onClick={() => setPricingMenuOpen(!pricingMenuOpen)}
                    className="w-full flex items-center justify-between px-6 py-3.5 text-base font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 border border-transparent hover:border-white/20"
                  >
                    <span>Precios</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${pricingMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {pricingMenuOpen && (
                    <div className="pl-6 mt-2 space-y-2">
                      <Link
                        href="/pricing?category=personas"
                        className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Para Personas
                      </Link>
                      <Link
                        href="/pricing?category=empresas"
                        className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Para Empresas
                      </Link>
                    </div>
                  )}
                </div>
                {/* Ayuda y soporte con submenu en móvil */}
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
                        className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
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

      {/* Hero Section - Diseño Innovador y Dinámico */}
      <section ref={heroRef} className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden min-h-[95vh] flex items-center">
        {/* Background Innovador con Efectos Dinámicos */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradiente base */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-[#14b4a1]/3 to-[#13282b]/5" />
          
          {/* Formas morfológicas animadas */}
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
          
          {/* Círculos rotativos */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border-2 border-[#14b4a1]/10 rounded-full animate-rotate-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 border-2 border-[#13282b]/10 rounded-full animate-rotate-slow" style={{ animationDirection: "reverse", animationDuration: "25s" }} />
          
          {/* Grid pattern animado */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(to right, #14b4a1 1px, transparent 1px),
              linear-gradient(to bottom, #14b4a1 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
          
          {/* Partículas flotantes mejoradas */}
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
          
          {/* Líneas de energía animadas */}
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
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Contenido Principal */}
              <div className="text-center lg:text-left space-y-8">
                {/* Badge con efecto glassmorphism */}
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-[#14b4a1]/30 shadow-lg animate-scale-in">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-[#14b4a1] animate-pulse" />
                    <div className="absolute inset-0 bg-[#14b4a1]/20 blur-xl" />
                  </div>
                  <span className="text-sm font-semibold text-[#14b4a1] tracking-wide">
                    PRIVACIDAD REAL
                  </span>
                </div>
                
                {/* Título con efecto gradiente animado */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.05] tracking-tight">
                  <span className="block mb-2 text-foreground">Email seguro que</span>
                  <span className="block bg-gradient-to-r from-[#14b4a1] via-[#0f9d8a] to-[#13282b] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    protege su privacidad
                  </span>
                </h1>
                
                {/* Descripción */}
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl lg:max-w-none">
                  El único servicio de correo que realmente respeta tu privacidad. 
                  <span className="text-[#14b4a1] font-semibold"> Cifrado de extremo a extremo</span>, 
                  sin rastreadores, sin anuncios. 
                  <span className="text-[#14b4a1] font-semibold">100% privado.</span>
                </p>
                
                {/* Botones CTA con efectos */}
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-4">
                  <Link href="/auth">
                    <Button 
                      size="lg" 
                      className="group relative bg-[#14b4a1] text-white hover:bg-[#0f9d8a] border-0 text-base px-10 h-14 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b4a1]/50 font-semibold"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Crear cuenta gratuita
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                  </Link>
                  <Link href="/plans">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="text-base px-10 h-14 rounded-2xl border-2 border-[#14b4a1]/40 hover:border-[#14b4a1] hover:bg-[#14b4a1]/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 font-semibold"
                    >
                      Ver planes
                    </Button>
                  </Link>
                </div>

                {/* Stats con diseño único */}
                <div className="flex flex-wrap items-center gap-6 lg:gap-8 pt-8">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-sm border border-[#14b4a1]/20 hover:border-[#14b4a1]/40 transition-all hover:scale-105">
                    <div className="text-3xl font-bold text-[#14b4a1]">100M+</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Usuarios</div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-sm border border-[#14b4a1]/20 hover:border-[#14b4a1]/40 transition-all hover:scale-105">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">4.8/5</div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-sm border border-[#14b4a1]/20 hover:border-[#14b4a1]/40 transition-all hover:scale-105">
                    <Server className="w-5 h-5 text-[#14b4a1]" />
                    <div className="text-xs text-muted-foreground">España</div>
                  </div>
                </div>
              </div>

              {/* Visual Innovador - Lado Derecho */}
              <div className="relative hidden lg:block">
                <div className="relative">
                  {/* Círculo principal con efecto glassmorphism */}
                  <div className="relative w-full aspect-square rounded-full bg-gradient-to-br from-[#14b4a1]/20 via-[#13282b]/10 to-[#14b4a1]/20 backdrop-blur-2xl border-2 border-[#14b4a1]/30 flex items-center justify-center shadow-2xl animate-pulse-glow">
                    {/* Círculo interno rotativo */}
                    <div className="absolute inset-8 border-2 border-[#14b4a1]/20 rounded-full animate-rotate-slow" />
                    <div className="absolute inset-16 border border-[#13282b]/20 rounded-full animate-rotate-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }} />
                    
                    {/* Icono central */}
                    <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center shadow-xl">
                      <Mail className="w-16 h-16 text-white" />
                      <div className="absolute inset-0 bg-[#14b4a1]/20 blur-2xl animate-pulse-glow" />
                    </div>
                  </div>
                  
                  {/* Cards flotantes con glassmorphism */}
                  <div className="absolute -top-6 -right-6 w-56 p-5 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-[#14b4a1]/30 shadow-2xl animate-float hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-base">Cifrado E2E</div>
                        <div className="text-xs text-muted-foreground">100% seguro</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-6 -left-6 w-56 p-5 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-[#13282b]/30 shadow-2xl animate-float-delayed hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#13282b] to-[#14b4a1] flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-base">Acceso Cero</div>
                        <div className="text-xs text-muted-foreground">Ni nosotros leemos</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Partículas decorativas */}
                  <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-[#14b4a1]/40 animate-pulse" />
                  <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-[#13282b]/40 animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Encrypted Email Section - Diseño Único */}
      <section className="py-24 sm:py-40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header Único con Número */}
            <div className="mb-24">
              <div className="flex items-center gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">01</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                    Por qué tu privacidad
                    <span className="block text-[#14b4a1]">realmente importa</span>
                  </h2>
                </div>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl ml-24">
                La mayoría de los proveedores de correo analizan cada palabra que escribes. 
                Nosotros no. Simple y directo.
              </p>
            </div>
            
            <div className="space-y-24">
              {/* Privacy Section */}
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 animate-slide-up">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14b4a1]/10 border border-[#14b4a1]/20 mb-4">
                    <BadgeCheck className="w-4 h-4 text-[#14b4a1]" />
                    <span className="text-xs font-semibold text-[#14b4a1] uppercase tracking-wider">Seguridad</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold leading-tight">
                    Porque lo que hay en su correo electrónico es asunto suyo
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    La mayoría de los proveedores de correo electrónico populares, como Gmail, Outlook y Yahoo, 
                    analizan el contenido de sus correos electrónicos y utilizan su dirección de correo para 
                    crear un perfil detallado sobre usted, a fin de sacar beneficio de sus datos.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    El cifrado de extremo a extremo y el cifrado de acceso cero de Fylo Mail garantizan que 
                    solo usted pueda ver sus correos electrónicos. Ni siquiera Fylo Mail puede ver el contenido 
                    de sus correos electrónicos y archivos adjuntos.
                  </p>
                  <Link href="/auth">
                    <Button className="mt-4 bg-[#14b4a1] text-white hover:bg-[#0f9d8a] border-0 group">
                      <span>Obtenga su correo electrónico cifrado</span>
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/20 to-[#13282b]/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                  <div className="relative p-10 bg-card/50 backdrop-blur-xl border border-[#14b4a1]/20 rounded-3xl shadow-2xl hover-lift">
                    <div className="space-y-8">
                      <div className="flex items-start gap-5 group/item">
                        <div className="w-14 h-14 rounded-2xl xstar-icon-bg-primary flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Shield className="w-7 h-7 xstar-icon-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl mb-2">Cifrado de extremo a extremo</div>
                          <div className="text-sm text-muted-foreground">Solo usted puede leer sus mensajes</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-5 group/item">
                        <div className="w-14 h-14 rounded-2xl xstar-icon-bg-secondary flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Lock className="w-7 h-7 xstar-icon-secondary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl mb-2">Cifrado de acceso cero</div>
                          <div className="text-sm text-muted-foreground">Ni siquiera nosotros podemos leerlos</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-5 group/item">
                        <div className="w-14 h-14 rounded-2xl xstar-icon-bg-primary flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Key className="w-7 h-7 xstar-icon-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl mb-2">Control total</div>
                          <div className="text-sm text-muted-foreground">Usted controla sus datos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trackers Section */}
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="relative order-2 lg:order-1 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/20 to-[#13282b]/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                  <div className="relative p-10 bg-card/50 backdrop-blur-xl border border-[#14b4a1]/20 rounded-3xl shadow-2xl hover-lift">
                    <div className="space-y-8">
                      <div className="flex items-start gap-5 group/item">
                        <div className="w-14 h-14 rounded-2xl xstar-icon-bg-primary flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <EyeOff className="w-7 h-7 xstar-icon-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl mb-2">Sin rastreadores</div>
                          <div className="text-sm text-muted-foreground">Bloqueo automático de espías digitales</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-5 group/item">
                        <div className="w-14 h-14 rounded-2xl xstar-icon-bg-secondary flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Ban className="w-7 h-7 xstar-icon-secondary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl mb-2">Sin vigilancia</div>
                          <div className="text-sm text-muted-foreground">Protección contra empresas</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-5 group/item">
                        <div className="w-14 h-14 rounded-2xl xstar-icon-bg-primary flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Shield className="w-7 h-7 xstar-icon-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl mb-2">Privacidad garantizada</div>
                          <div className="text-sm text-muted-foreground">Sus datos están seguros</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 order-1 lg:order-2 animate-slide-up">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14b4a1]/10 border border-[#14b4a1]/20 mb-4">
                    <EyeOff className="w-4 h-4 text-[#14b4a1]" />
                    <span className="text-xs font-semibold text-[#14b4a1] uppercase tracking-wider">Privacidad</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold leading-tight">
                    Se acabaron los rastreadores en su bandeja de entrada
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Los rastreadores de correo electrónico informan a los remitentes y anunciantes de lo que lee 
                    y selecciona, y pueden seguirle en la web.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Fylo Mail le protege de estos espías digitales y evita la vigilancia de las empresas.
                  </p>
                  <Link href="/auth">
                    <Button variant="outline" className="mt-4 border-2 border-[#14b4a1]/30 hover:border-[#14b4a1] hover:bg-[#14b4a1]/5 group">
                      <span>Bloquee los rastreadores de correo electrónico</span>
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlights - Diseño Único en Zigzag */}
      <section className="py-24 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#14b4a1]/5 via-transparent to-[#13282b]/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#14b4a1]/30 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header con número */}
            <div className="mb-20">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">02</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
                    Lo que nos hace
                    <span className="block text-[#14b4a1]">diferentes</span>
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group relative p-10 rounded-3xl border-2 border-border/30 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl hover:border-[#14b4a1]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#14b4a1]/20 to-[#13282b]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">el 
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Ban className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-extrabold text-2xl mb-4 group-hover:text-[#14b4a1] transition-colors">Sin anuncios, siempre gratis</h4>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Impulsado por nuestra comunidad, no por el capitalismo de la vigilancia. 
                    Tu privacidad no es un producto.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-10 rounded-3xl border-2 border-border/30 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl hover:border-[#14b4a1]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#13282b]/20 to-[#14b4a1]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#13282b] to-[#14b4a1] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-extrabold text-2xl mb-4 group-hover:text-[#14b4a1] transition-colors">Privacidad garantizada</h4>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Con sede en España, protegido por las leyes de privacidad más estrictas del mundo. 
                    Tus datos están seguros aquí.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-10 rounded-3xl border-2 border-border/30 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl hover:border-[#14b4a1]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#14b4a1]/20 to-[#13282b]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-extrabold text-2xl mb-4 group-hover:text-[#14b4a1] transition-colors">Código abierto</h4>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Todo es transparente. Auditado independientemente. 
                    Millones confían en nuestras bibliotecas de cifrado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section - Mejorado */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,180,161,0.03),transparent_70%)]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Sus funciones favoritas además de privacidad
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Características diseñadas para hacer tu trabajo más eficiente y seguro.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Search, title: "Ponga orden en su bandeja de entrada", desc: "Consulte todas sus suscripciones de correo electrónico en un solo lugar, para que pueda decidir rápidamente qué merece la pena conservar y cancelar la suscripción al instante de lo que no.", color: "primary" },
                { icon: Shield, title: "A salvo del spam y la suplantación", desc: "PhishGuard bloquea los intentos de suplantación conocidos y le informa cuando un correo electrónico es sospechoso. La confirmación de enlaces evita que entre en sitios web maliciosos.", color: "secondary" },
                { icon: Lock, title: "Protección por contraseña", desc: "Establezca contraseñas y fechas de expiración en sus correos electrónicos para enviar información confidencial de forma segura a sus contactos, aunque no tengan Fylo Mail.", color: "primary" },
                { icon: EyeOff, title: "Alias de hide-my-email", desc: "Cree alias a la hora de registrarte en sitios web. Al ocultar su dirección de correo electrónico real, puede evitar los ataques de suplantación y reducir el spam.", color: "secondary" },
                { icon: Clock, title: "Programe correos electrónicos", desc: "Programe, deshaga o pause correos electrónicos para tener control total sobre sus comunicaciones.", color: "primary" },
                { icon: Globe, title: "Disponible en todas las plataformas", desc: "Disfrute de la facilidad y la seguridad de Fylo Mail en todos sus dispositivos con nuestras apps para web, escritorio, Android y iPhone.", color: "secondary" },
              ].map((feature, index) => {
                const Icon = feature.icon;
                const isPrimary = feature.color === "primary";
                return (
                  <div 
                    key={index} 
                    className="group p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover-lift hover:border-[#14b4a1]/50 transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                      isPrimary ? 'xstar-icon-bg-primary' : 'xstar-icon-bg-secondary'
                    }`}>
                      <Icon className={`w-7 h-7 ${isPrimary ? 'xstar-icon-primary' : 'xstar-icon-secondary'}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-4 group-hover:text-[#14b4a1] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Standard Section - Diseño Único con Split */}
      <section className="py-32 sm:py-48 bg-[#13282b] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#14b4a1]/5 to-transparent" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#13282b]/50 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14b4a1]/20 border border-[#14b4a1]/30 mb-8">
                  <Award className="w-5 h-5 text-[#14b4a1]" />
                  <span className="text-sm font-semibold text-[#14b4a1]">EL ESTÁNDAR</span>
                </div>
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-8">
                  Elegido por quienes
                  <span className="block text-[#14b4a1]">valoran la privacidad</span>
                </h2>
                <p className="text-xl text-white/80 leading-relaxed mb-8">
                  Salas de prensa, activistas, organizaciones internacionales, académicos, 
                  ganadores del Premio Nobel y celebridades confían en Fylo Mail.
                </p>
                <Link href="/auth">
                  <Button size="lg" className="bg-[#14b4a1] text-white hover:bg-[#0f9d8a] border-0 rounded-xl px-10 h-14 text-base font-semibold group hover:scale-105 transition-all hover:shadow-2xl hover:shadow-[#14b4a1]/50">
                    <span>Recupere el control</span>
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-4xl font-bold text-[#14b4a1] mb-2">100M+</div>
                    <div className="text-sm text-white/70">Usuarios activos</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-4xl font-bold text-[#14b4a1] mb-2">150+</div>
                    <div className="text-sm text-white/70">Países</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-4xl font-bold text-[#14b4a1] mb-2">99.9%</div>
                    <div className="text-sm text-white/70">Uptime</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-4xl font-bold text-[#14b4a1] mb-2">24/7</div>
                    <div className="text-sm text-white/70">Soporte</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Nueva Sección */}
      <section className="py-24 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#14b4a1]/30 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">04</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
                    Planes y
                    <span className="block text-[#14b4a1]">Precios</span>
                  </h2>
                </div>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Elige el plan perfecto para ti. Todos incluyen privacidad garantizada.
              </p>
            </div>

            {/* Category Dropdown */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center gap-2 p-1 bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-full">
                <button
                  onClick={() => setPricingCategory("personas")}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    pricingCategory === "personas"
                      ? "bg-[#14b4a1] text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Para Personas
                </button>
                <button
                  onClick={() => setPricingCategory("empresas")}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    pricingCategory === "empresas"
                      ? "bg-[#14b4a1] text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Para Empresas
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            {loadingPricingPlans ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredPricingPlans.map((plan) => {
                  const isPopular = plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("recomendado");
                  return (
                    <div
                      key={plan.id}
                      className={`relative border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                        isPopular
                          ? "border-[#14b4a1] bg-gradient-to-br from-[#14b4a1]/10 to-[#13282b]/10 shadow-xl"
                          : "border-border/50 bg-card/80 backdrop-blur-xl hover:border-[#14b4a1]/50"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="bg-[#14b4a1] text-white px-4 py-1 rounded-full text-xs font-bold">
                            Recomendado
                          </span>
                        </div>
                      )}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-foreground">
                              {plan.priceMonthly === 0 ? "Gratis" : `€${plan.priceMonthly.toFixed(2)}`}
                            </span>
                            {plan.priceMonthly > 0 && (
                              <span className="text-muted-foreground">/mes</span>
                            )}
                          </div>
                          {plan.priceYearly > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              €{plan.priceYearly.toFixed(2)}/año (ahorra {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%)
                            </p>
                          )}
                        </div>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#14b4a1] flex-shrink-0" />
                            <span className="text-sm">{plan.maxEmails} cuenta{plan.maxEmails !== 1 ? "s" : ""} de correo</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#14b4a1] flex-shrink-0" />
                            <span className="text-sm">{plan.maxDomains} dominio{plan.maxDomains !== 1 ? "s" : ""}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#14b4a1] flex-shrink-0" />
                            <span className="text-sm">{plan.maxStorageGB} GB de almacenamiento</span>
                          </li>
                        </ul>
                        <Link href={`/auth?plan=${plan.id}`}>
                          <Button
                            className={`w-full h-12 font-semibold ${
                              isPopular
                                ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]"
                                : "bg-foreground text-background hover:bg-foreground/90"
                            }`}
                          >
                            {plan.priceMonthly === 0 ? "Crear cuenta gratis" : "Comprar ahora"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Diseño Único y Impactante */}
      <section className="py-32 sm:py-48 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/10 via-[#13282b]/5 to-[#14b4a1]/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#14b4a1]/5 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-10">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#14b4a1]/20 to-[#13282b]/20 border border-[#14b4a1]/30 backdrop-blur-md mb-8">
                <Zap className="w-5 h-5 text-[#14b4a1]" />
                <span className="text-sm font-semibold text-[#14b4a1] uppercase tracking-wider">
                  Comienza ahora
                </span>
              </div>
              
              <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-tight">
                <span className="block">Tu privacidad</span>
                <span className="block bg-gradient-to-r from-[#14b4a1] via-[#0f9d8a] to-[#13282b] bg-clip-text text-transparent">
                  empieza aquí
                </span>
              </h2>
              
              <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Únete a más de 100 millones de personas que eligieron proteger sus comunicaciones. 
                <span className="text-[#14b4a1] font-semibold"> Gratis para siempre.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <Link href="/auth">
                  <Button 
                    size="lg" 
                    className="group relative bg-[#14b4a1] text-white hover:bg-[#0f9d8a] border-0 text-lg px-12 h-16 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b4a1]/50 font-bold"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Crear cuenta gratuita
                      <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                </Link>
                <Link href="/plans">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-12 h-16 rounded-2xl border-2 border-[#14b4a1]/40 hover:border-[#14b4a1] hover:bg-[#14b4a1]/10 transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    Ver planes
                  </Button>
                </Link>
              </div>
              
              <div className="pt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#14b4a1]" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#14b4a1]" />
                  <span>Configuración en 2 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#14b4a1]" />
                  <span>Cancelar cuando quieras</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section - Mejorado */}
      <section className="py-24 sm:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/20" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#14b4a1]/30 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header Mejorado */}
            <div className="text-center mb-20">
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">03</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
                    Preguntas
                    <span className="block text-[#14b4a1]">frecuentes</span>
                  </h2>
                </div>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Todo lo que necesitas saber sobre Fylo Mail y la privacidad de tu correo electrónico.
              </p>
            </div>
            
            {/* Accordion Mejorado */}
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  question: "¿Qué es Fylo Mail?",
                  answer: "Fylo Mail es el servicio de correo electrónico cifrado de extremo a extremo más grande del mundo. Fylo Mail se asegura de que nadie pueda acceder a sus correos electrónicos mediante el uso de cifrado de extremo a extremo y cifrado de acceso cero. Todo el cifrado de Fylo Mail ocurre en segundo plano, lo que significa que cualquiera puede usar el correo electrónico cifrado, independientemente de su capacidad técnica.",
                  icon: Mail
                },
                {
                  question: "¿Por qué necesito un correo electrónico privado?",
                  answer: "Al cambiar a un servicio de correo electrónico privado como Fylo Mail, todo el mundo se beneficia. Proteger sus correos electrónicos con cifrado de extremo a extremo y de acceso cero lo ayuda a recuperar el control de sus datos y actúa como un seguro para su seguridad online en caso de futuras vulneraciones de datos o cambios en la legislación. En una escala más amplia, usar un correo electrónico seguro como Fylo Mail ayuda a proteger la democracia y la libertad de expresión asegurándose de que puede ejercer su derecho a la privacidad dondequiera que esté.",
                  icon: Shield
                },
                {
                  question: "¿Cómo puedo obtener un correo electrónico privado?",
                  answer: "Para cambiar a un correo electrónico privado, regístrese en Fylo Mail sin costo o suscríbase a uno de nuestros planes de pago. Una vez que haya creado una cuenta de Fylo Mail, puede transferir sus contactos y mensajes existentes a su nueva bandeja de entrada segura usando nuestra herramienta Easy Switch. No necesita ninguna experiencia técnica para comenzar a usar el correo electrónico privado con Fylo Mail.",
                  icon: Key
                },
                {
                  question: "¿Fylo Mail es más seguro que Gmail?",
                  answer: "Sí. Fylo Mail es una alternativa a Gmail más segura porque, cuando lo usa, solo usted puede leer sus correos electrónicos. De hecho, ni siquiera Fylo Mail puede leerlos. Esto no es cierto en el caso de Gmail, que conserva las claves de descifrado de sus datos en los mismos servidores donde almacena sus mensajes. Esto significa que Gmail puede leer sus mensajes o entregarlos a las autoridades si así lo solicitan. Los servicios como Gmail que no almacenan sus datos con cifrado de acceso cero también lo exponen a un mayor riesgo en caso de una vulneración de datos. Fylo Mail almacena sus mensajes con cifrado de acceso cero, lo que agrega una capa adicional de resistencia contra las vulneraciones de datos.",
                  icon: Lock
                },
                {
                  question: "¿Fylo Mail es gratuito?",
                  answer: "Fylo Mail siempre ofrecerá un plan de correo electrónico seguro y gratuito que proporcione toda la funcionalidad básica que espera de su bandeja de entrada con el mismo nivel de seguridad que nuestros planes de pago. Si contrata cualquiera de nuestros planes de pago, disfrutará de características avanzadas tales como la posibilidad de añadir más de una dirección de correo electrónico, más espacio de almacenamiento, dominios personalizados y mensajes ilimitados. Además, contribuirá a nuestro objetivo de convertir Internet en un lugar mejor, con la privacidad por bandera.",
                  icon: CheckCircle2
                }
              ].map((faq, index) => {
                const Icon = faq.icon;
                return (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index + 1}`} 
                    className="group bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-2xl px-6 hover:border-[#14b4a1]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/10"
                  >
                    <AccordionTrigger className="text-left font-bold text-lg py-6 hover:text-[#14b4a1] transition-colors group-hover:bg-[#14b4a1]/5 rounded-xl px-4 -mx-2">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14b4a1]/20 to-[#13282b]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5 text-[#14b4a1]" />
                        </div>
                        <span className="flex-1">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6 leading-relaxed px-4 pt-2">
                      <div className="pl-14 border-l-2 border-[#14b4a1]/20">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            {/* CTA al final */}
            <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-[#14b4a1]/10 to-[#13282b]/10 border border-[#14b4a1]/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-3">¿Tienes más preguntas?</h3>
              <p className="text-muted-foreground mb-6">
                Nuestro equipo está aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/help">
                  <Button variant="outline" className="border-2 border-[#14b4a1]/40 hover:border-[#14b4a1] hover:bg-[#14b4a1]/10">
                    Ver ayuda y soporte
                  </Button>
                </Link>
                <Link href="/feedback">
                  <Button className="bg-[#14b4a1] text-white hover:bg-[#0f9d8a]">
                    Contactar soporte
                  </Button>
                </Link>
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
                  alt="Fylo Mail - Servicio de Correo Electrónico Profesional - Logo"
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
            <p>© {new Date().getFullYear()} Fylo Mail. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
      </div>
  );
}
