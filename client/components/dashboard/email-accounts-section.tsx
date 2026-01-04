"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, type EmailAccount, type Domain } from "@/lib/api";
import { Mail, Plus, Loader2, Trash2, ExternalLink } from "lucide-react";

export function EmailAccountsSection() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadAccounts(selectedDomain);
    }
  }, [selectedDomain]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [domainsData, accountsData] = await Promise.all([
        apiClient.getDomains(),
        apiClient.getEmailAccounts(),
      ]);
      setDomains(domainsData);
      setAccounts(accountsData);
      if (domainsData.length > 0 && !selectedDomain) {
        setSelectedDomain(domainsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async (domainId: number) => {
    try {
      const data = await apiClient.getEmailAccounts(domainId);
      setAccounts(data);
    } catch (err: any) {
      console.error("Error loading accounts:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) {
      setError("Selecciona un dominio primero");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.createEmailAccount({
        domainId: selectedDomain,
        address: formData.address,
        password: formData.password,
      });
      setSuccess(`Cuenta ${formData.address}@${domains.find(d => d.id === selectedDomain)?.domainName} creada exitosamente`);
      setFormData({ address: "", password: "" });
      await loadAccounts(selectedDomain);
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear la cuenta de correo";
      if (err.code === "LIMIT_REACHED" || errorMessage.includes("límite")) {
        setError(
          errorMessage +
            " Ve a la sección de Planes para actualizar tu suscripción."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta de correo?")) return;

    try {
      await apiClient.deleteEmailAccount(id);
      setSuccess("Cuenta eliminada exitosamente");
      if (selectedDomain) {
        await loadAccounts(selectedDomain);
      }
    } catch (err: any) {
      setError(err.message || "Error al eliminar la cuenta");
    }
  };

  const selectedDomainData = domains.find(d => d.id === selectedDomain);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Formulario para crear cuenta */}
      <div className="border-2 border-[#14b4a1]/30 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card via-card/95 to-[#14b4a1]/5 shadow-xl hover:shadow-2xl hover:shadow-[#14b4a1]/20 transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#14b4a1]" />
          </div>
          <span className="bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">Crear Cuenta de Correo</span>
        </h2>

        {domains.length === 0 ? (
          <div className="text-center py-4 text-sm sm:text-base text-muted-foreground">
            Primero debes vincular un dominio para crear cuentas de correo
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium mb-1">
                Dominio
              </label>
              <select
                id="domain"
                value={selectedDomain || ""}
                onChange={(e) => setSelectedDomain(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domainName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-xs sm:text-sm font-medium mb-1">
                Nombre de la cuenta
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  id="address"
                  type="text"
                  placeholder="prueba"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="flex-1"
                />
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center px-2 sm:px-0">
                  @{selectedDomainData?.domainName || ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 break-words">
                La dirección completa será: {formData.address || "nombre"}@{selectedDomainData?.domainName || "dominio.com"}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
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
              disabled={creating}
              className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-bold shadow-lg shadow-[#14b4a1]/30 hover:shadow-xl hover:shadow-[#14b4a1]/50 transition-all duration-300"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Lista de cuentas */}
      <div className="border-2 border-[#14b4a1]/30 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card via-card/95 to-[#13282b]/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#14b4a1]" />
            </div>
            <span className="bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">Mis Cuentas de Correo</span>
          </h2>
          <Button 
            variant="outline" 
            onClick={() => selectedDomain && loadAccounts(selectedDomain)} 
            size="sm" 
            className="w-full sm:w-auto border-2 border-[#14b4a1]/40 hover:bg-[#14b4a1]/10 hover:text-[#14b4a1] hover:border-[#14b4a1] font-semibold"
          >
            Actualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-white/70 font-medium">
            No tienes cuentas de correo creadas. Crea una para comenzar.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="border-2 border-[#14b4a1]/20 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-card/50 to-[#14b4a1]/5 hover:border-[#14b4a1]/40 hover:bg-gradient-to-br hover:from-card hover:to-[#14b4a1]/10 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <div className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">{account.address}</div>
                    <div className="text-xs sm:text-sm text-white/60 font-medium mt-1.5">
                      Dominio: <span className="text-white/80">{account.domainName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/mailbox/${account.id}`}
                      className="border border-[#14b4a1]/30 hover:bg-[#14b4a1]/10 hover:text-[#14b4a1] hover:border-[#14b4a1] font-semibold"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Buzón
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

