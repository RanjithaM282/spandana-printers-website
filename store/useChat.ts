import { create } from "zustand";

export type ChatMessage = {
  id: string;
  sender: "customer" | "admin";
  text: string;
  timestamp: number;
};

export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  open: () => void;
  close: () => void;
  addMessage: (message: ChatMessage) => void;
  clear: () => void;
}

export const useChat = create<ChatState>((set) => ({
  isOpen: false,
  messages: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clear: () => set({ messages: [] }),
}));
