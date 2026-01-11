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
  quantity: number;
  maxStock: number; // <-- YENİ
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItem) => void;
  removeItem: (id: string) => void;
  decreaseItem: (id: string) => void;
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
          // STOK KONTROLÜ
          if (existingItem.quantity >= data.maxStock) {
            toast.error(`Only ${data.maxStock} items left in stock!`);
            return;
          }

          set({
            items: currentItems.map((item) =>
              item.id === data.id 
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
          set({ items: [...currentItems.filter((item) => item.id !== id)] });
        }
      },

      removeItem: (id: string) => {
        set({ items: [...get().items.filter((item) => item.id !== id)] });
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