import { create } from "zustand";

interface CartItem {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  size: string;
  gsm: string;
  quantity: number;
  addOns: string[];
  notes: string;
  total: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  addItem: (item: CartItem) =>
    set((state) => ({
      items: [item, ...state.items],
    })),
  removeItem: (id: string) =>
    set((state) => ({
      items: state.items.filter((item: CartItem) => item.id !== id),
    })),
  updateQuantity: (id: string, quantity: number) =>
    set((state) => ({
      items: state.items.map((item: CartItem) =>
        item.id === id ? { ...item, quantity } : item
      ),
    })),
  clear: () => set({ items: [] }),
}));
