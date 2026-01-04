"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import {
  MessageSquare,
  Send,
  Star,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Bug,
  Heart,
  Upload,
  XCircle,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";

type FeedbackType = "suggestion" | "bug" | "compliment" | "other";
type Rating = 1 | 2 | 3 | 4 | 5 | null;

export default function FeedbackPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [feedbackForm, setFeedbackForm] = useState({
    type: "suggestion" as FeedbackType,
    subject: "",
    message: "",
    rating: null as Rating,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.createTicket({
        subject: `[Feedback - ${feedbackForm.type}] ${feedbackForm.subject}`,
        description: `Tipo: ${feedbackForm.type}\nCalificación: ${feedbackForm.rating ? feedbackForm.rating + "/5" : "No especificada"}\n\n${feedbackForm.message}`,
        priority: feedbackForm.type === "bug" ? "high" : "medium",
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });

      toast.success("¡Gracias por tu feedback! Lo revisaremos pronto.");
      setSubmitted(true);
      setFeedbackForm({
        type: "suggestion",
        subject: "",
        message: "",
        rating: null,
      });
      setSelectedFiles([]);

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error(`Error al enviar feedback: ${error.message || "Intenta nuevamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-5 h-5" />;
      case "bug":
        return <Bug className="w-5 h-5" />;
      case "compliment":
        return <Heart className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getFeedbackTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case "suggestion":
        return "Sugerencia";
      case "bug":
        return "Reportar Error";
      case "compliment":
        return "Elogio";
      default:
        return "Otro";
    }
  };

  if (isLoading) {
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
                <p className="text-white/70 font-medium">Cargando...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated) {
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
            <div className="p-6 md:p-8 lg:p-12 max-w-4xl mx-auto w-full space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                    <MessageSquare className="w-7 h-7 text-white/90" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Comentarios
                      </h1>
                      <Sparkles className="w-6 h-6 text-[#14b4a1]" />
                    </div>
                    <p className="text-white/60 text-sm md:text-base">
                      Tu opinión es importante para nosotros. Comparte tus sugerencias, reporta problemas o envíanos un elogio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de Feedback */}
              {submitted ? (
                <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-8 md:p-12 shadow-xl">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] shadow-lg shadow-[#14b4a1]/20">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">¡Gracias por tu feedback!</h2>
                    <p className="text-white/60">
                      Hemos recibido tu mensaje y lo revisaremos pronto. Tu opinión nos ayuda a mejorar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 md:p-8 shadow-xl">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Feedback */}
                    <div>
                      <label className="text-sm font-medium mb-3 block text-white/70">
                        Tipo de Feedback
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(["suggestion", "bug", "compliment", "other"] as FeedbackType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFeedbackForm((prev) => ({ ...prev, type }))}
                            className={`p-4 rounded-xl border transition-all ${
                              feedbackForm.type === type
                                ? "bg-gradient-to-br from-[#14b4a1] to-[#0f9d8a] text-white border-[#14b4a1] shadow-lg shadow-[#14b4a1]/20"
                                : "bg-gray-800/40 text-white/70 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/50"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {getFeedbackTypeIcon(type)}
                              <span className="text-xs font-medium">{getFeedbackTypeLabel(type)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calificación */}
                    <div>
                      <label className="text-sm font-medium mb-3 block text-white/70">
                        ¿Cómo calificarías tu experiencia? (Opcional)
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() =>
                              setFeedbackForm((prev) => ({
                                ...prev,
                                rating: prev.rating === rating ? null : (rating as Rating),
                              }))
                            }
                            className={`p-2 rounded-lg border transition-all ${
                              feedbackForm.rating === rating
                                ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/20"
                                : feedbackForm.rating && feedbackForm.rating >= rating
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-gray-800/40 text-white/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/50"
                            }`}
                          >
                            <Star
                              className={`w-6 h-6 ${
                                feedbackForm.rating && feedbackForm.rating >= rating
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                          </button>
                        ))}
                        {feedbackForm.rating && (
                          <span className="text-sm text-white/60 ml-2 font-medium">
                            {feedbackForm.rating}/5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Asunto */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-white/70">
                        Asunto
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej: Me gustaría que agreguen..."
                        className="w-full bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30"
                        value={feedbackForm.subject}
                        onChange={(e) =>
                          setFeedbackForm((prev) => ({ ...prev, subject: e.target.value }))
                        }
                        required
                      />
                    </div>

                    {/* Mensaje */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-white/70">
                        Mensaje
                      </label>
                      <Textarea
                        placeholder="Describe tu feedback en detalle..."
                        rows={8}
                        className="w-full bg-gray-900/50 border-gray-700/50 text-white placeholder:text-white/30 resize-none"
                        value={feedbackForm.message}
                        onChange={(e) =>
                          setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))
                        }
                        required
                      />
                      <p className="text-xs text-white/50 mt-2">
                        {feedbackForm.message.length} caracteres
                      </p>
                    </div>

                    {/* Archivos adjuntos */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-white/70">
                        Archivos adjuntos (Opcional)
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 px-4 py-2 border border-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors bg-gray-900/50 text-white/70 hover:text-white">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Seleccionar archivos</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf,.doc,.docx,.txt"
                              onChange={(e) => {
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
                              }}
                              className="hidden"
                              disabled={selectedFiles.length >= 5}
                            />
                          </label>
                          <span className="text-xs text-white/50">
                            Máximo 5 archivos, 10MB cada uno
                          </span>
                        </div>
                        {selectedFiles.length > 0 && (
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/30"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {file.type.startsWith("image/") ? (
                                    <ImageIcon className="w-4 h-4 text-white/70 flex-shrink-0" />
                                  ) : (
                                    <File className="w-4 h-4 text-white/70 flex-shrink-0" />
                                  )}
                                  <span className="text-sm text-white/90 truncate">{file.name}</span>
                                  <span className="text-xs text-white/50">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                                  className="ml-2 p-1 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  <XCircle className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800/50">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFeedbackForm({
                            type: "suggestion",
                            subject: "",
                            message: "",
                            rating: null,
                          });
                          setSelectedFiles([]);
                        }}
                        className="border-gray-700/50 hover:bg-gray-800/50 hover:text-white hover:border-gray-600/50"
                      >
                        Limpiar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Información adicional */}
              <div className="rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                    <AlertCircle className="w-5 h-5 text-white/90 mt-0.5 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3">¿Qué tipo de feedback recibimos?</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 mt-0.5">
                          <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        </div>
                        <span className="text-white/70"><strong className="text-white">Sugerencias:</strong> Ideas para mejorar el sistema o nuevas funcionalidades.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 mt-0.5">
                          <Bug className="w-4 h-4 text-red-400 flex-shrink-0" />
                        </div>
                        <span className="text-white/70"><strong className="text-white">Errores:</strong> Reporta problemas técnicos o bugs que encuentres.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 mt-0.5">
                          <Heart className="w-4 h-4 text-pink-400 flex-shrink-0" />
                        </div>
                        <span className="text-white/70"><strong className="text-white">Elogios:</strong> Comparte lo que más te gusta del sistema.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 mt-0.5">
                          <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        </div>
                        <span className="text-white/70"><strong className="text-white">Otros:</strong> Cualquier otro comentario o sugerencia.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
