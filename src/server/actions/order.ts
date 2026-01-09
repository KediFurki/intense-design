"use server";

import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Form Doğrulama Şeması
const orderSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(2),
  zipCode: z.string().min(2),
  items: z.array(z.object({
    id: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).min(1),
});

type OrderInput = z.infer<typeof orderSchema>;

// 1. SİPARİŞ OLUŞTURMA & STOK DÜŞME
export async function createOrder(data: OrderInput) {
  const validation = orderSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: "Invalid data" };
  }

  const { firstName, lastName, email, address, city, zipCode, items } = validation.data;
  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  try {
    await db.transaction(async (tx) => {
      
      // STOK KONTROLÜ VE GÜNCELLEME
      for (const item of items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.id),
        });

        if (!product) {
          throw new Error(`Product ${item.id} not found`);
        }

        // HATA DÜZELTMESİ 1: Stok 'null' ise 0 olarak kabul et (Null Coalescing ??)
        const currentStock = product.stock ?? 0;

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Stoğu düş (currentStock kullanarak)
        await tx.update(products)
          .set({ stock: currentStock - item.quantity })
          .where(eq(products.id, item.id));
      }

      // SİPARİŞİ OLUŞTUR
      const [newOrder] = await tx.insert(orders).values({
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        address,
        city,
        zipCode,
        totalAmount,
        status: "pending",
      }).returning({ id: orders.id });

      // KALEMLERİ EKLE
      if (newOrder) {
        await tx.insert(orderItems).values(
          items.map((item) => ({
            orderId: newOrder.id,
            productId: item.id,
            price: item.price,
            quantity: item.quantity,
          }))
        );
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    return { success: true };

  } catch (error) {
    // HATA DÜZELTMESİ 2: 'any' yerine type-checking yapıyoruz
    console.error("Order Creation Error:", error);
    
    // Hata mesajını güvenli bir şekilde alıyoruz
    const errorMessage = error instanceof Error ? error.message : "Order failed";
    
    return { success: false, error: errorMessage };
  }
}

// 2. SİPARİŞ SİLME
export async function deleteOrder(orderId: string) {
  try {
    await db.delete(orders).where(eq(orders.id, orderId));
    revalidatePath("/admin/orders");
    return { success: true, message: "Order deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete order" };
  }
}

// 3. SİPARİŞ DURUMU GÜNCELLEME
export async function updateOrderStatus(orderId: string, status: "pending" | "processing" | "shipped" | "delivered" | "cancelled") {
  try {
    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));
    
    revalidatePath("/admin/orders");
    return { success: true, message: "Status updated" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to update status" };
  }
}