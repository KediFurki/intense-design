import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  variantId?: string; // <-- EKLENDİ: Varyasyon Kimliği
  variantName?: string; // <-- EKLENDİ: Varyasyon Adı (Örn: Kırmızı / XL)
  name: string;
  price: number;
  image?: string;
  slug: string;
  categoryName?: string;
  quantity: number;
  maxStock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItem) => void;
  removeItem: (id: string, variantId?: string) => void; // <-- Güncellendi
  decreaseItem: (id: string, variantId?: string) => void; // <-- Güncellendi
  removeAll: () => void;
}

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      
      addItem: (data: CartItem) => {
        const currentItems = get().items;
        // Hem Ürün ID'si hem de Varyasyon ID'si eşleşmeli (Ürün aynı olsa bile rengi farklıysa yeni satır olmalı)
        const existingItem = currentItems.find((item) => 
          item.id === data.id && item.variantId === data.variantId
        );

        if (existingItem) {
          // Stok Kontrolü
          if (existingItem.quantity >= data.maxStock) {
            toast.error(`Only ${data.maxStock} items left in stock!`);
            return;
          }

          set({
            items: currentItems.map((item) =>
              (item.id === data.id && item.variantId === data.variantId)
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ),
          });
          toast.success("Quantity updated");
        } else {
          if (data.maxStock < 1) {
             toast.error("Out of stock!");
             return;
          }
          set({ items: [...get().items, { ...data, quantity: 1 }] });
          toast.success("Added to cart 🛒");
        }
      },

      decreaseItem: (id: string, variantId?: string) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => 
          item.id === id && item.variantId === variantId
        );

        if (existingItem && existingItem.quantity > 1) {
          set({
            items: currentItems.map((item) =>
              (item.id === id && item.variantId === variantId)
                ? { ...item, quantity: item.quantity - 1 } 
                : item
            ),
          });
        } else {
          // Miktar 1 ise sil
          set({ items: [...currentItems.filter((item) => !(item.id === id && item.variantId === variantId))] });
        }
      },

      removeItem: (id: string, variantId?: string) => {
        set({ items: [...get().items.filter((item) => !(item.id === id && item.variantId === variantId))] });
        toast.success("Item removed");
      },

      removeAll: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);