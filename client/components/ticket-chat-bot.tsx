"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, type Ticket, type TicketMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useTicketChatStore } from "@/store/ticket-chat-store";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function TicketChatBot() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { isOpen, isMinimized, selectedTicketId, openChat, closeChat, toggleMinimize, setSelectedTicket: setSelectedTicketId } = useTicketChatStore();
  
  // Detectar si estamos en el mailbox
  const isInMailbox = pathname?.includes("/mailbox");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadTickets();
    }
  }, [isAuthenticated, isOpen]);

  // Sincronizar selectedTicketId del store con selectedTicket local y cargar mensajes
  useEffect(() => {
    if (selectedTicketId && tickets.length > 0 && isOpen) {
      const ticket = tickets.find((t) => t.id === selectedTicketId);
      if (ticket) {
        setSelectedTicket(ticket);
        loadMessages(ticket.id);
        // Polling para nuevos mensajes cada 5 segundos
        const interval = setInterval(() => {
          loadMessages(ticket.id);
        }, 5000);
        return () => clearInterval(interval);
      }
    } else if (!selectedTicketId) {
      setSelectedTicket(null);
      setMessages([]);
    }
  }, [selectedTicketId, tickets, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getUserTickets();
      setTickets(data);
      // Si hay tickets y hay un selectedTicketId, seleccionar ese ticket
      if (data.length > 0) {
        if (selectedTicketId) {
          const ticket = data.find((t) => t.id === selectedTicketId);
          if (ticket) {
            setSelectedTicket(ticket);
          } else if (!selectedTicket) {
            setSelectedTicket(data[0]);
            setSelectedTicketId(data[0].id);
          }
        } else if (!selectedTicket) {
          setSelectedTicket(data[0]);
        }
      }
    } catch (error: any) {
      console.error("Error loading tickets:", error);
      toast.error("Error al cargar los tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: number) => {
    try {
      const data = await apiClient.getTicketMessages(ticketId);
      setMessages(data);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sentMessage = await apiClient.sendTicketMessage(selectedTicket.id, messageText);
      setMessages((prev) => [...prev, sentMessage]);
      // Recargar tickets para actualizar el último mensaje
      await loadTickets();
    } catch (error: any) {
      toast.error(`Error al enviar mensaje: ${error.message || "Intenta nuevamente"}`);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Abierto";
      case "in_progress":
        return "En progreso";
      case "resolved":
        return "Resuelto";
      case "closed":
        return "Cerrado";
      default:
        return status;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => {
            openChat();
            loadTickets();
          }}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group ${
            isInMailbox
              ? "bg-[#14b4a1] text-white hover:bg-[#0f9d8a]"
              : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
          }`}
          aria-label="Abrir chat de tickets"
        >
          <MessageSquare className="w-6 h-6" />
          {tickets.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length}
            </span>
          )}
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col transition-all ${
            isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-foreground/5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Soporte</h3>
              {tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleMinimize}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={closeChat}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Lista de tickets */}
              {!selectedTicket ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-foreground/60" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tienes tickets abiertos</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setSelectedTicketId(ticket.id);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {ticket.subject}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {ticket.messages && ticket.messages.length > 0
                                ? ticket.messages[0].message.substring(0, 50) + "..."
                                : ticket.description.substring(0, 50) + "..."}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.updatedAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* Chat del ticket seleccionado */}
                  <div className="flex-1 flex flex-col">
                    {/* Header del ticket */}
                    <div className="p-3 border-b border-border bg-muted/30">
                      <button
                        onClick={() => {
                          setSelectedTicket(null);
                          setSelectedTicketId(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground mb-2"
                      >
                        ← Volver a tickets
                      </button>
                      <div className="font-medium text-sm text-foreground">
                        {selectedTicket.subject}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(
                            selectedTicket.status
                          )}`}
                        >
                          {getStatusLabel(selectedTicket.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedTicket.priority}
                        </span>
                      </div>
                    </div>

                    {/* Mensajes */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20"
                    >
                      {/* Mensaje inicial (descripción del ticket) */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="bg-card border border-border rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">
                              {user?.name || "Tú"}
                            </div>
                            <div className="text-sm text-foreground">{selectedTicket.description}</div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(selectedTicket.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mensajes del chat */}
                      {messages.map((message) => {
                        const isOwnMessage = message.userId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] ${
                                isOwnMessage
                                  ? "bg-foreground text-background"
                                  : "bg-card border border-border"
                              } rounded-lg p-3`}
                            >
                              {!isOwnMessage && (
                                <div className="text-xs text-muted-foreground mb-1">
                                  {message.user?.role === "admin" ? "Admin" : message.user?.name}
                                </div>
                              )}
                              <div className="text-sm">{message.message}</div>
                              <div className="text-xs opacity-70 mt-1">
                                {formatDistanceToNow(new Date(message.createdAt), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input de mensaje */}
                    <div className="p-3 border-t border-border bg-card">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          className="flex-1 bg-background border-border"
                          disabled={sending}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!newMessage.trim() || sending}
                          className="flex-shrink-0"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

