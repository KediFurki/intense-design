"use server";

import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';
import { OrderReceiptEmail } from "@/components/emails/order-receipt";
import { OrderUpdateEmail } from "@/components/emails/order-update";
import { auth } from "@/auth"; // <-- EKLENDİ: Oturum kontrolü için

const resend = new Resend(process.env.RESEND_API_KEY);

const orderSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email(),
  phone: z.string().min(6, "Phone number is too short"),
  address: z.string().min(5, "Address is required"),
  country: z.string().min(2),
  state: z.string().optional(),
  city: z.string().min(2),
  zipCode: z.string().min(2),
  invoiceType: z.enum(["individual", "corporate"]),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
  taxOffice: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).min(1),
});

type OrderInput = z.infer<typeof orderSchema>;

export async function createOrder(data: OrderInput) {
  const session = await auth(); // <-- EKLENDİ: Kullanıcı oturumunu al

  const validation = orderSchema.safeParse(data);
  if (!validation.success) return { success: false, error: "Invalid data." };

  const { 
    firstName, lastName, email, phone, 
    country, state, address, city, zipCode, 
    invoiceType, taxId, companyName, taxOffice,
    items 
  } = validation.data;

  // İsim Formatlama
  const formatName = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  const fullName = `${formatName(firstName)} ${formatName(lastName)}`;

  // Dil Belirleme (Basit Mantık)
  let locale: "en" | "tr" | "de" | "bg" = "en";
  if (country === "Turkey" || country === "TR") locale = "tr";
  else if (country === "Germany" || country === "DE") locale = "de";
  else if (country === "Bulgaria" || country === "BG") locale = "bg";

  if (invoiceType === 'corporate' && (!companyName || !taxId)) {
      return { success: false, error: "Company details missing." };
  }

  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const emailItems: { name: string; quantity: number; price: number }[] = [];
  let newOrderId = "";

  try {
    await db.transaction(async (tx) => {
      // 1. Stok Kontrol & Hazırlık
      for (const item of items) {
        const product = await tx.query.products.findFirst({ where: eq(products.id, item.id) });
        
        if (!product || (product.stock < item.quantity)) {
          throw new Error(`Insufficient stock for product: ${product?.name || 'Unknown'}`);
        }
        
        emailItems.push({ name: product.name, quantity: item.quantity, price: item.price });

        await tx.update(products)
          .set({ stock: product.stock - item.quantity })
          .where(eq(products.id, item.id));
      }

      // 2. Sipariş Kaydı (userId EKLENDİ)
      const [newOrder] = await tx.insert(orders).values({
        userId: session?.user?.id || null, // <-- KRİTİK: Siparişi kullanıcıya bağlar
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        country, state: state || "", address, city, zipCode,
        totalAmount,
        status: "pending",
        invoiceType,
        taxId: taxId || null, companyName: companyName || null, taxOffice: taxOffice || null,
      }).returning({ id: orders.id });

      newOrderId = newOrder.id;

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

    // 3. Email Gönderimi (Çok Dilli)
    try {
        await resend.emails.send({
            from: 'InstantDesign <onboarding@resend.dev>',
            to: email,
            subject: `Order Confirmation #${newOrderId.slice(0,8)}`,
            react: OrderReceiptEmail({
                orderId: newOrderId,
                date: new Date(),
                customerName: fullName,
                items: emailItems,
                totalAmount: totalAmount,
                shippingAddress: {
                    address: address,
                    city: city,
                    country: country,
                    zipCode: zipCode
                },
                locale: locale // <-- Dili gönderiyoruz
            }),
        });
        console.log("Professional Email sent!");
    } catch (emailError) {
        console.error("Email failed:", emailError);
    }

    revalidatePath("/admin");
    return { success: true };

  } catch (error) {
    console.error("Order Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Order failed";
    return { success: false, error: errorMessage };
  }
}

// ... Diğer fonksiyonlar (deleteOrder, updateOrderStatus) AYNI KALACAK ...
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
      const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
          columns: { id: true, customerEmail: true, customerName: true }
      });

      if (!order) return { success: false, message: "Order not found" };

      await db.update(orders).set({ status }).where(eq(orders.id, orderId));
      
      try {
          await resend.emails.send({
              from: 'InstantDesign <onboarding@resend.dev>',
              to: order.customerEmail,
              subject: `Update: ${status.toUpperCase()}`,
              react: OrderUpdateEmail({
                  orderId: order.id,
                  customerName: order.customerName,
                  newStatus: status
              }),
          });
      } catch (emailError) { console.error(emailError); }

      revalidatePath("/admin/orders");
      return { success: true, message: "Status updated" };
    } catch (error) {
      return { success: false, message: "Failed to update status" };
    }
}