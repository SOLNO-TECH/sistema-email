"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Code,
  Copy,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Zap,
  Shield,
  Globe,
  Key,
  FileText,
  ExternalLink,
  ChevronRight,
  Mail,
  Loader2,
  Menu,
  Sparkles,
  X,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// Componente HelpDropdown (igual que en landing)
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
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors bg-[#14b4a1]/5"
              >
                <Code className="w-4 h-4 text-[#14b4a1]" />
                <span className="font-semibold">Integración API</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = "html", id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
        <code className="whitespace-pre-wrap break-words sm:whitespace-pre">{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-1.5 sm:p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors"
        title="Copiar código"
      >
        {copiedCode === id ? (
          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
        )}
      </button>
    </div>
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
      `}</style>

      {/* Navigation - Exactamente igual que landing */}
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
                        className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Centro de Ayuda
                      </Link>
                      <Link
                        href="/integration"
                        className="block px-6 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 bg-white/5"
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

      {/* Hero Section - Mismo estilo pero con contenido de documentación */}
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
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#14b4a1] animate-pulse" />
                  <div className="absolute inset-0 bg-[#14b4a1]/20 blur-xl" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#14b4a1] tracking-wide">
                  API DE INTEGRACIÓN
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extrabold leading-[1.1] sm:leading-[1.05] tracking-tight px-4">
                <span className="block mb-2 text-foreground">Integra "Iniciar sesión</span>
                <span className="block bg-gradient-to-r from-[#14b4a1] via-[#0f9d8a] to-[#13282b] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  con Xstar Mail"
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4">
                Integración súper simple tipo Google OAuth. Solo agrega un script y listo. 
                Tu aplicación estará lista en menos de 5 minutos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-white shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Inicio Rápido (30 segundos)</h2>
                  <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">
                    Agrega estas dos líneas a tu HTML y el botón aparecerá automáticamente:
                  </p>
                  <CodeBlock
                    id="quick-start"
                    code={`<div data-xstar-oauth 
     data-client-id="tu-client-id"
     data-redirect-uri="https://tu-sitio.com/callback">
</div>

<script 
  src="https://xstarmail.es/xstar-oauth.js"
  data-client-id="tu-client-id"
  data-redirect-uri="https://tu-sitio.com/callback">
</script>`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#14b4a1]/5 via-transparent to-[#13282b]/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#14b4a1]/30 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12 md:mb-16">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center">
                  <span className="text-2xl sm:text-2xl md:text-3xl font-bold text-white">01</span>
                </div>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold">
                  Guía Paso a Paso
                </h2>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {/* Step 1 */}
              <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#14b4a1]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#14b4a1] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Registra tu Aplicación</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      Primero necesitas obtener tus credenciales OAuth. Inicia sesión en Xstar Mail y registra tu aplicación.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-foreground mb-2 sm:mb-3 font-semibold">Opción A: Desde la API</p>
                      <CodeBlock
                        id="register-api"
                        language="bash"
                        code={`POST /api/oauth/register
Authorization: Bearer YOUR_XSTAR_TOKEN
Content-Type: application/json

{
  "name": "Mi Aplicación",
  "description": "Descripción de mi app",
  "website": "https://mi-sitio.com",
  "redirectUris": [
    "https://mi-sitio.com/callback",
    "http://localhost:3000/callback"
  ]
}`}
                      />
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">
                        <strong>⚠️ IMPORTANTE:</strong> Guarda el <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded text-xs">clientSecret</code> de forma segura. 
                        Solo se muestra una vez y es necesario para intercambiar códigos por tokens.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#14b4a1]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#14b4a1] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Incluye el SDK en tu HTML</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      Agrega el script de Xstar OAuth en tu página. Puedes configurarlo de dos formas:
                    </p>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-foreground mb-2">Método 1: Configuración Automática (Recomendado)</p>
                        <CodeBlock
                          id="method1"
                          code={`<script 
  src="https://xstarmail.es/xstar-oauth.js"
  data-client-id="tu-client-id"
  data-redirect-uri="https://tu-sitio.com/callback"
  data-button-text="Iniciar sesión con Xstar Mail">
</script>

<!-- El botón aparecerá automáticamente aquí -->
<div data-xstar-oauth></div>`}
                        />
                      </div>

                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-foreground mb-2">Método 2: Configuración Manual</p>
                        <CodeBlock
                          id="method2"
                          code={`<script src="https://xstarmail.es/xstar-oauth.js"></script>
<script>
  XstarOAuth.init({
    clientId: 'tu-client-id',
    redirectUri: 'https://tu-sitio.com/callback'
  });
  
  XstarOAuth.renderButton('#mi-boton', {
    text: 'Iniciar sesión con Xstar Mail'
  });
</script>

<div id="mi-boton"></div>`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#14b4a1]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#14b4a1] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Maneja el Callback</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      Cuando el usuario autoriza tu aplicación, será redirigido a tu <code className="bg-muted px-1 rounded text-xs sm:text-sm">redirectUri</code> con un código.
                    </p>
                    <CodeBlock
                      id="callback"
                      code={`// En tu página de callback (ej: /callback)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Validar state (opcional pero recomendado)
const savedState = sessionStorage.getItem('xstar_oauth_state');
if (state !== savedState) {
  console.error('State mismatch - possible CSRF attack');
  return;
}

// ⚠️ IMPORTANTE: El intercambio de código por token DEBE hacerse en tu backend
// por seguridad. Nunca expongas tu client_secret en el frontend.

// Frontend: Envía el código a tu servidor
const response = await fetch('/api/auth/xstar-callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
});

const data = await response.json();
console.log('Usuario autenticado:', data);`}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#14b4a1]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-[#14b4a1] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Intercambia el Código por Token (Backend)</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      En tu servidor, intercambia el código de autorización por un token de acceso:
                    </p>
                    <CodeBlock
                      id="backend"
                      language="javascript"
                      code={`// Backend: Intercambiar código por token
app.post('/api/auth/xstar-callback', async (req, res) => {
  const { code } = req.body;
  
  const tokenResponse = await fetch('https://xstarmail.es/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.XSTAR_CLIENT_ID,
      client_secret: process.env.XSTAR_CLIENT_SECRET, // Seguro en el backend
      redirect_uri: process.env.XSTAR_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  const tokens = await tokenResponse.json();
  // tokens contiene: { access_token, token_type, expires_in, refresh_token }
  
  // Obtener información del usuario
  const userResponse = await fetch('https://xstarmail.es/api/oauth/userinfo', {
    headers: { 'Authorization': \`Bearer \${tokens.access_token}\` }
  });
  
  const userInfo = await userResponse.json();
  // userInfo contiene: { id, email, name }
  
  res.json({ user: userInfo, tokens });
});`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100 mb-2 sm:mb-3">⚠️ Seguridad Importante</h3>
                  <p className="text-red-800 dark:text-red-200 mb-2 sm:mb-3 text-base sm:text-lg">
                    <strong>NUNCA expongas tu <code className="bg-red-100 dark:bg-red-900/50 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">client_secret</code> en el frontend.</strong>
                  </p>
                  <p className="text-red-700 dark:text-red-300 text-sm sm:text-base">
                    El intercambio de código por token debe hacerse siempre en tu backend. 
                    El <code className="bg-red-100 dark:bg-red-900/50 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">client_secret</code> es como una contraseña y debe mantenerse segura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14b4a1]/3 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#14b4a1] flex-shrink-0" />
                <span>Referencia de API</span>
              </h2>
              
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">XstarOAuth.init(options)</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">Inicializa el SDK con las credenciales de tu aplicación.</p>
                  <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-foreground mb-2 font-semibold">Parámetros:</p>
                    <ul className="text-xs sm:text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li><code className="bg-muted px-1 rounded text-xs">clientId</code> (string, requerido): Tu Client ID</li>
                      <li><code className="bg-muted px-1 rounded text-xs">redirectUri</code> (string, requerido): URI de redirección después de la autorización</li>
                      <li><code className="bg-muted px-1 rounded text-xs">state</code> (string, opcional): Estado para prevenir CSRF</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">XstarOAuth.login()</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Inicia el flujo de autenticación OAuth.</p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">XstarOAuth.renderButton(selector, options)</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">Renderiza un botón de login estilizado.</p>
                  <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-foreground mb-2 font-semibold">Opciones:</p>
                    <ul className="text-xs sm:text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li><code className="bg-muted px-1 rounded text-xs">text</code> (string): Texto del botón</li>
                      <li><code className="bg-muted px-1 rounded text-xs">className</code> (string): Clase CSS personalizada</li>
                      <li><code className="bg-muted px-1 rounded text-xs">noStyles</code> (boolean): Deshabilitar estilos por defecto</li>
                    </ul>
                  </div>
                </div>
              </div>
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">¿Listo para integrar?</h2>
              <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg">
                Obtén tus credenciales y comienza a integrar Xstar Mail en tu aplicación hoy mismo.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                <Link href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-[#14b4a1] hover:bg-white/90 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12">
                    Obtener Credenciales
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/help" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Ver Documentación Completa
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Exactamente igual que landing */}
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
