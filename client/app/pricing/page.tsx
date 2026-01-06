"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Menu,
  Sparkles,
  Zap,
  X,
  ChevronDown,
  HelpCircle,
  Code,
  Users,
  Building2,
  CreditCard,
  Shield,
  Globe,
  Award,
} from "lucide-react";
import { apiClient, type Plan } from "@/lib/api";
import { Toaster } from "sonner";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "personas";

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
                className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                  currentCategory === "personas" ? "bg-[#14b4a1]/5 font-semibold" : ""
                }`}
              >
                <Users className="w-4 h-4 text-[#14b4a1]" />
                <span>Para Personas</span>
              </Link>
              <Link
                href="/pricing?category=empresas"
                className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                  currentCategory === "empresas" ? "bg-[#14b4a1]/5 font-semibold" : ""
                }`}
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

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [pricingMenuOpen, setPricingMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const [pricingCategory, setPricingCategory] = useState<"personas" | "empresas">("personas");
  const [pricingPlans, setPricingPlans] = useState<Plan[]>([]);
  const [loadingPricingPlans, setLoadingPricingPlans] = useState(false);

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

  // Leer categoría de la URL
  useEffect(() => {
    const category = searchParams.get("category");
    if (category === "personas" || category === "empresas") {
      setPricingCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      setLoadingPricingPlans(true);
      const plans = await apiClient.getPlans();
      setPricingPlans(plans);
    } catch (err) {
      console.error("Error loading pricing plans:", err);
    } finally {
      setLoadingPricingPlans(false);
    }
  };

  const filteredPricingPlans = pricingPlans.filter(
    (plan) => plan.category === pricingCategory && plan.isActive
  );

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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-enhanced {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-10px) translateX(5px); }
          66% { transform: translateY(5px) translateX(-5px); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; filter: blur(20px); }
          50% { opacity: 0.8; filter: blur(30px); }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-enhanced {
          animation: float-enhanced 8s ease-in-out infinite;
        }
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .animate-morph {
          animation: morph 10s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-gradient {
          animation: gradient-shift 5s ease infinite;
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
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] relative z-10"
                />
              </Link>
              
              <div className="hidden lg:flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
                <PricesDropdown />
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

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32 overflow-hidden min-h-[85vh] sm:min-h-[90vh] md:min-h-[95vh] flex items-center">
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
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-[#14b4a1]/30 shadow-lg animate-scale-in">
                <div className="relative">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#14b4a1] animate-pulse" />
                  <div className="absolute inset-0 bg-[#14b4a1]/20 blur-xl" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#14b4a1] tracking-wide">
                  PLANES Y PRECIOS
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extrabold leading-[1.1] sm:leading-[1.05] tracking-tight px-4">
                <span className="block mb-2 text-foreground">Elige el plan</span>
                <span className="block bg-gradient-to-r from-[#14b4a1] via-[#0f9d8a] to-[#13282b] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  perfecto para ti
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4">
                Todos nuestros planes incluyen privacidad garantizada, cifrado de extremo a extremo 
                y acceso desde cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Selector Section */}
      <section className="py-12 sm:py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Category Dropdown */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center gap-2 p-1 bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-full">
                <button
                  onClick={() => {
                    setPricingCategory("personas");
                    router.push("/pricing?category=personas");
                  }}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    pricingCategory === "personas"
                      ? "bg-[#14b4a1] text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Para Personas
                </button>
                <button
                  onClick={() => {
                    setPricingCategory("empresas");
                    router.push("/pricing?category=empresas");
                  }}
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
            ) : filteredPricingPlans.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  No hay planes disponibles en esta categoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredPricingPlans.map((plan) => {
                  const isPopular = plan.name.toLowerCase().includes("pro") || 
                                   plan.name.toLowerCase().includes("recomendado") ||
                                   plan.name.toLowerCase().includes("business");
                  const isFree = plan.priceMonthly === 0;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border-2 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
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
                              {isFree ? "Gratis" : `€${plan.priceMonthly.toFixed(2)}`}
                            </span>
                            {!isFree && (
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
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#14b4a1] flex-shrink-0" />
                            <span className="text-sm">Cifrado de extremo a extremo</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#14b4a1] flex-shrink-0" />
                            <span className="text-sm">Soporte por email</span>
                          </li>
                        </ul>
                        <Link href={`/auth?plan=${plan.id}`}>
                          <Button
                            className={`w-full h-12 font-semibold ${
                              isPopular
                                ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]"
                                : isFree
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "bg-foreground text-background hover:bg-foreground/90"
                            }`}
                          >
                            {isFree ? "Crear cuenta gratis" : "Comprar ahora"}
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

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#14b4a1]/30 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">✓</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
                    Incluido en
                    <span className="block text-[#14b4a1]">todos los planes</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: "Cifrado de extremo a extremo", desc: "Solo tú puedes leer tus mensajes" },
                { icon: Globe, title: "Acceso desde cualquier dispositivo", desc: "Web, móvil y escritorio" },
                { icon: Award, title: "Sin anuncios", desc: "Nunca mostraremos publicidad" },
                { icon: Zap, title: "Sincronización instantánea", desc: "Tus correos siempre actualizados" },
                { icon: CheckCircle2, title: "Soporte incluido", desc: "Ayuda cuando la necesites" },
                { icon: CreditCard, title: "Sin compromiso", desc: "Cancela cuando quieras" },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover-lift hover:border-[#14b4a1]/50 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 xstar-icon-bg-primary">
                      <Icon className="w-7 h-7 xstar-icon-primary" />
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

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#14b4a1]/5 via-transparent to-[#13282b]/5" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-center text-white shadow-2xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">¿Listo para comenzar?</h2>
              <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg">
                Únete a millones de usuarios que confían en Xstar Mail para proteger sus comunicaciones.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                <Link href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-[#14b4a1] hover:bg-white/90 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12">
                    Crear cuenta gratuita
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/help" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Ver Ayuda
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
                  <Link href="/pricing" className="hover:text-[#14b4a1] transition-colors">
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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-[#13282b]/10">
        <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}

