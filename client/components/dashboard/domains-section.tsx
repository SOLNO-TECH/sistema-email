"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, type Domain } from "@/lib/api";
import { Globe, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function DomainsSection() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDomains();
      setDomains(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar los dominios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const domain = await apiClient.addDomain({ domainName: domainName.trim() });
      setSuccess(`Dominio ${domain.domainName} agregado exitosamente`);
      setDomainName("");
      await loadDomains();
    } catch (err: any) {
      const errorMessage = err.message || "Error al agregar el dominio";
      if (err.code === "LIMIT_REACHED" || errorMessage.includes("límite")) {
        setError(
          errorMessage +
            " Ve a la sección de Planes para actualizar tu suscripción."
        );
      } else if (errorMessage.includes("Domain exists")) {
        setError("Este dominio ya está registrado");
      } else {
        setError(errorMessage);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Formulario para agregar dominio */}
      <div className="border-2 border-[#14b4a1]/30 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card via-card/95 to-[#14b4a1]/5 shadow-xl hover:shadow-2xl hover:shadow-[#14b4a1]/20 transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#14b4a1]" />
          </div>
          <span className="bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">Vincular Dominio</span>
        </h2>
        
        <form onSubmit={handleAddDomain} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="domainName" className="block text-sm font-medium mb-1">
              Nombre del dominio
            </label>
            <Input
              id="domainName"
              type="text"
              placeholder="ejemplo.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ingresa el dominio que ya tienes para vincularlo a tu cuenta
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-[#14b4a1] bg-[#14b4a1]/10 border border-[#14b4a1]/30 p-3 rounded-xl font-medium">
              {success}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={adding}
            className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-bold shadow-lg shadow-[#14b4a1]/30 hover:shadow-xl hover:shadow-[#14b4a1]/50 transition-all duration-300"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Vincular Dominio
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Lista de dominios */}
      <div className="border-2 border-[#14b4a1]/30 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card via-card/95 to-[#13282b]/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#14b4a1]" />
            </div>
            <span className="bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">Mis Dominios</span>
          </h2>
          <Button 
            variant="outline" 
            onClick={loadDomains} 
            size="sm" 
            className="w-full sm:w-auto border-2 border-[#14b4a1]/40 hover:bg-[#14b4a1]/10 hover:text-[#14b4a1] hover:border-[#14b4a1] font-semibold"
          >
            Actualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tienes dominios vinculados. Agrega uno para comenzar.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="border-2 border-[#14b4a1]/20 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-card/50 to-[#14b4a1]/5 hover:border-[#14b4a1]/40 hover:bg-gradient-to-br hover:from-card hover:to-[#14b4a1]/10 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-3">
                      <span className="font-extrabold text-lg sm:text-xl break-words bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">{domain.domainName}</span>
                      {domain.dnsVerified ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#14b4a1]/20 border border-[#14b4a1]/40 text-[#14b4a1] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Verificado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-500 shrink-0">
                          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Pendiente
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/60 font-medium mb-3">
                      Agregado: {new Date(domain.createdAt).toLocaleDateString()}
                    </div>
                    
                    {!domain.dnsVerified && (
                      <div className="mt-3 p-3 sm:p-4 bg-yellow-500/10 rounded-xl border-2 border-yellow-500/30">
                        <h4 className="font-semibold text-xs sm:text-sm mb-2">Configuración DNS requerida</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Para usar este dominio, agrega estos registros DNS en tu proveedor de dominio:
                        </p>
                        <div className="space-y-2 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                          <div>
                            <span className="text-muted-foreground">Tipo:</span> MX
                            <br />
                            <span className="text-muted-foreground">Host:</span> @
                            <br />
                            <span className="text-muted-foreground">Valor:</span> mail.{domain.domainName}
                            <br />
                            <span className="text-muted-foreground">Prioridad:</span> 10
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground">Tipo:</span> A
                            <br />
                            <span className="text-muted-foreground">Host:</span> mail.{domain.domainName}
                            <br />
                            <span className="text-muted-foreground">Valor:</span> [IP del servidor de correo]
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground">Tipo:</span> TXT
                            <br />
                            <span className="text-muted-foreground">Host:</span> @
                            <br />
                            <span className="text-muted-foreground">Valor:</span> v=spf1 include:mail.{domain.domainName} ~all
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          ⚠️ Los cambios DNS pueden tardar hasta 48 horas en propagarse
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

