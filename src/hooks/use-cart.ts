import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  categoryName?: string;
  quantity: number; // Miktar eklendi
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItem) => void;
  removeItem: (id: string) => void;
  decreaseItem: (id: string) => void; // Azaltma fonksiyonu
  removeAll: () => void;
}

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      
      addItem: (data: CartItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === data.id);

        if (existingItem) {
          // Varsa miktarını artır
          set({
            items: currentItems.map((item) =>
              item.id === data.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ),
          });
          toast.success("Item quantity updated 🛒");
        } else {
          // Yoksa yeni ekle (Miktar 1 olarak)
          set({ items: [...get().items, { ...data, quantity: 1 }] });
          toast.success("Item added to cart 🛒");
        }
      },

      decreaseItem: (id: string) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === id);

        if (existingItem && existingItem.quantity > 1) {
          set({
            items: currentItems.map((item) =>
              item.id === id 
                ? { ...item, quantity: item.quantity - 1 } 
                : item
            ),
          });
        } else {
          // 1 tane kaldıysa ve azaltılıyorsa sil
          set({ items: [...currentItems.filter((item) => item.id !== id)] });
        }
      },

      removeItem: (id: string) => {
        set({ items: [...get().items.filter((item) => item.id !== id)] });
        toast.success("Item removed.");
      },

      removeAll: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);