"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, type Email, type SendEmailRequest } from "@/lib/api";
import { Mail, Send, Loader2 } from "lucide-react";

export function EmailsSection() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<SendEmailRequest>({
    to: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEmails();
      setEmails(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar los correos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.sendEmail(formData);
      setSuccess(response.message);
      setFormData({ to: "", subject: "", message: "" });
      await loadEmails(); // Recargar la lista
    } catch (err) {
      setError("Error al enviar el correo");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Formulario para enviar correo */}
      <div className="border-2 border-[#14b4a1]/30 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card via-card/95 to-[#14b4a1]/5 shadow-xl hover:shadow-2xl hover:shadow-[#14b4a1]/20 transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#14b4a1]" />
          </div>
          <span className="bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">Enviar Correo</span>
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">
              Para
            </label>
            <Input
              id="to"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.to}
              onChange={(e) =>
                setFormData({ ...formData, to: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Asunto
            </label>
            <Input
              id="subject"
              type="text"
              placeholder="Asunto del correo"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Mensaje
            </label>
            <textarea
              id="message"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Escribe tu mensaje aquí..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              required
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
            disabled={sending}
            className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-bold shadow-lg shadow-[#14b4a1]/30 hover:shadow-xl hover:shadow-[#14b4a1]/50 transition-all duration-300"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Correo
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Lista de correos */}
      <div className="border-2 border-[#14b4a1]/30 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card via-card/95 to-[#13282b]/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#14b4a1]/25 to-[#14b4a1]/15 border border-[#14b4a1]/40">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#14b4a1]" />
            </div>
            <span className="bg-gradient-to-r from-[#14b4a1] to-white bg-clip-text text-transparent">Correos Enviados</span>
          </h2>
          <Button 
            variant="outline" 
            onClick={loadEmails} 
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
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay correos enviados aún
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="border-2 border-[#14b4a1]/20 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-card/50 to-[#14b4a1]/5 hover:border-[#14b4a1]/40 hover:bg-gradient-to-br hover:from-card hover:to-[#14b4a1]/10 transition-all duration-300 hover:shadow-lg hover:shadow-[#14b4a1]/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-bold text-[#14b4a1] mb-1">Para: <span className="text-white/90">{email.to}</span></div>
                    <div className="text-base sm:text-lg font-extrabold text-white mt-2 break-words">
                      {email.subject}
                    </div>
                  </div>
                  <div className="text-xs text-white/60 font-medium shrink-0 bg-[#14b4a1]/10 px-2 py-1 rounded-lg border border-[#14b4a1]/30">
                    {new Date(email.date).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm sm:text-base text-white/80 mt-3 break-words leading-relaxed">
                  {email.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

