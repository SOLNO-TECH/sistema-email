import { create } from "zustand";

interface TicketChatState {
  isOpen: boolean;
  isMinimized: boolean;
  selectedTicketId: number | null;
  openChat: (ticketId?: number) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
  setSelectedTicket: (ticketId: number | null) => void;
}

export const useTicketChatStore = create<TicketChatState>((set) => ({
  isOpen: false,
  isMinimized: false,
  selectedTicketId: null,
  openChat: (ticketId) => {
    set({
      isOpen: true,
      isMinimized: false,
      selectedTicketId: ticketId || null,
    });
  },
  closeChat: () => {
    set({
      isOpen: false,
      isMinimized: false,
      selectedTicketId: null,
    });
  },
  toggleMinimize: () => {
    set((state) => ({
      isMinimized: !state.isMinimized,
    }));
  },
  setSelectedTicket: (ticketId) => {
    set({ selectedTicketId: ticketId });
  },
}));

