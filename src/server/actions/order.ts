"use server";

import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Form Doğrulama Şeması - AVRUPA STANDARTLARI
const orderSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email(),
  phone: z.string().min(6, "Phone number is too short"), // Avrupa numaraları değişken olabilir
  address: z.string().min(5, "Address is required"),
  country: z.string().min(2),
  state: z.string().optional(), // Her ülkede state olmayabilir
  city: z.string().min(2),
  zipCode: z.string().min(2),
  
  // Fatura Alanları
  invoiceType: z.enum(["individual", "corporate"]),
  
  // Bireyselde ID yok. Kurumsalda Company ve VAT ID zorunlu.
  // Zod'un `refine` veya conditional validation özelliklerini kullanabiliriz
  // ama basitlik için optional bırakıp aşağıda mantıkla veya client-side required ile çözüyoruz.
  taxId: z.string().optional(),      // VAT Number
  companyName: z.string().optional(), 
  taxOffice: z.string().optional(),  // Avrupa'da genelde VAT yeterlidir, Office opsiyonel

  items: z.array(z.object({
    id: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).min(1),
});

type OrderInput = z.infer<typeof orderSchema>;

// 1. SİPARİŞ OLUŞTURMA
export async function createOrder(data: OrderInput) {
  const validation = orderSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: "Invalid data. Please check fields." };
  }

  const { 
    firstName, lastName, email, phone, 
    country, state, address, city, zipCode, 
    invoiceType, taxId, companyName, taxOffice,
    items 
  } = validation.data;
  
  // KURUMSAL KONTROLÜ (Backend Side Validation)
  if (invoiceType === 'corporate' && (!companyName || !taxId)) {
      return { success: false, error: "Company Name and VAT Number are required for corporate orders." };
  }

  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  try {
    await db.transaction(async (tx) => {
      
      // STOK KONTROLÜ
      for (const item of items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.id),
        });

        if (!product) {
          throw new Error(`Product not found`);
        }

        const currentStock = product.stock ?? 0;

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Stoğu düş
        await tx.update(products)
          .set({ stock: currentStock - item.quantity })
          .where(eq(products.id, item.id));
      }

      // SİPARİŞİ OLUŞTUR
      const [newOrder] = await tx.insert(orders).values({
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        country, 
        state: state || "", 
        address, 
        city, 
        zipCode,
        totalAmount,
        status: "pending",
        invoiceType,
        taxId: taxId || null,       // VAT Number buraya kaydedilecek
        companyName: companyName || null,
        taxOffice: taxOffice || null,
      }).returning({ id: orders.id });

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
    console.error("Order Creation Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Order failed";
    return { success: false, error: errorMessage };
  }
}

// ... (deleteOrder ve updateOrderStatus AYNI KALIYOR)
export async function deleteOrder(orderId: string) {
  try {
    await db.delete(orders).where(eq(orders.id, orderId));
    revalidatePath("/admin/orders");
    return { success: true, message: "Order deleted" };
  } catch (error) {
    return { success: false, message: "Failed to delete order" };
  }
}

export async function updateOrderStatus(orderId: string, status: "pending" | "processing" | "shipped" | "delivered" | "cancelled") {
  try {
    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));
    
    revalidatePath("/admin/orders");
    return { success: true, message: "Status updated" };
  } catch (error) {
    return { success: false, message: "Failed to update status" };
  }
}