import { db } from "@/server/db";
import { orders, orderItems, products, productVariants, addresses } from "@/server/db/schema";
import { and, lt, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";

export type CartItemInput = {
  id: string; // productId
  variantId?: string;
  variantName?: string;
  price: number; // cents
  quantity: number;
};

export type CustomerInput = {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  invoiceType?: "individual" | "corporate";
  taxId?: string | null;
  companyName?: string | null;
  taxOffice?: string | null;
};

export type CreateOrderArgs = {
  customer: CustomerInput;
  items: CartItemInput[];
  paymentMethod: "stripe" | "iban" | "cash_on_installation";
  paymentStatus: "awaiting_payment" | "paid" | "deposit_paid" | "remaining_due" | "cancelled";
  depositPercent?: number; // 0 or 30
  paymentDueAt?: Date | null;

  // NEW
  saveAddress?: boolean;
};

export async function createOrderWithReservation(args: CreateOrderArgs) {
  const totalAmount = args.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const depositPercent = args.depositPercent ?? 0;
  const depositAmount = Math.round(totalAmount * (depositPercent / 100));
  const remainingAmount = Math.max(0, totalAmount - depositAmount);

  const created = await db.transaction(async (tx) => {
    // stock check + reserve
    for (const item of args.items) {
      if (item.variantId) {
        const v = await tx.query.productVariants.findFirst({ where: eq(productVariants.id, item.variantId) });
        if (!v || v.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK_VARIANT");
        await tx
          .update(productVariants)
          .set({ stock: v.stock - item.quantity })
          .where(eq(productVariants.id, item.variantId));
      } else {
        const p = await tx.query.products.findFirst({ where: eq(products.id, item.id) });
        if (!p || p.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK_PRODUCT");
        await tx.update(products).set({ stock: p.stock - item.quantity }).where(eq(products.id, item.id));
      }
    }

    const [newOrder] = await tx
      .insert(orders)
      .values({
        userId: args.customer.userId ?? null,
        customerName: args.customer.customerName,
        customerEmail: args.customer.customerEmail,
        customerPhone: args.customer.customerPhone,
        country: args.customer.country,
        state: args.customer.state || "",
        city: args.customer.city,
        address: args.customer.address,
        zipCode: args.customer.zipCode,

        invoiceType: args.customer.invoiceType ?? "individual",
        taxId: args.customer.taxId ?? null,
        companyName: args.customer.companyName ?? null,
        taxOffice: args.customer.taxOffice ?? null,

        totalAmount,
        status: "pending",

        paymentMethod: args.paymentMethod,
        paymentStatus: args.paymentStatus,
        depositPercent,
        remainingAmount,
        paymentDueAt: args.paymentDueAt ?? null,

        stockReserved: true,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      args.items.map((item) => ({
        orderId: newOrder.id,
        productId: item.id,
        variantId: item.variantId ?? null,
        variantName: item.variantName ?? null,
        price: item.price,
        quantity: item.quantity,
      }))
    );

    // Save address to profile (if logged in + saveAddress true)
    const shouldSaveAddress = args.saveAddress !== false; // default true
    if (args.customer.userId && shouldSaveAddress) {
      // Dedupe: aynı adres zaten kayıtlıysa yeniden ekleme
      const existing = await tx.query.addresses.findFirst({
        where: and(
          eq(addresses.userId, args.customer.userId),
          eq(addresses.address, args.customer.address),
          eq(addresses.city, args.customer.city),
          eq(addresses.state, args.customer.state || ""),
          eq(addresses.zipCode, args.customer.zipCode),
          eq(addresses.country, args.customer.country)
        ),
        columns: { id: true },
      });

      if (!existing) {
        await tx.insert(addresses).values({
          userId: args.customer.userId,
          title: "Checkout Address",
          address: args.customer.address,
          city: args.customer.city,
          state: args.customer.state || "",
          zipCode: args.customer.zipCode,
          country: args.customer.country,
        });
      }
    }

    return { orderId: newOrder.id, totalAmount, depositAmount, remainingAmount };
  });

  return created;
}

export async function restockAndCancelOrder(orderId: string) {
  return db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { id: true, stockReserved: true, paymentStatus: true },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (order.stockReserved) {
      const items = await tx.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
        columns: { productId: true, variantId: true, quantity: true },
      });

      for (const it of items) {
        if (it.variantId) {
          const v = await tx.query.productVariants.findFirst({ where: eq(productVariants.id, it.variantId) });
          if (v) await tx.update(productVariants).set({ stock: v.stock + it.quantity }).where(eq(productVariants.id, it.variantId));
        } else {
          const p = await tx.query.products.findFirst({ where: eq(products.id, it.productId) });
          if (p) await tx.update(products).set({ stock: p.stock + it.quantity }).where(eq(products.id, it.productId));
        }
      }

      await tx.update(orders).set({ stockReserved: false }).where(eq(orders.id, orderId));
    }

    await tx.update(orders).set({ paymentStatus: "cancelled", status: "cancelled" }).where(eq(orders.id, orderId));
    return { ok: true };
  });
}

export async function expireOverdueIbanOrders(now: Date = new Date()): Promise<{ expired: number }> {
  const overdue = await db.query.orders.findMany({
    where: and(
      eq(orders.paymentMethod, "iban"),
      eq(orders.paymentStatus, "awaiting_payment"),
      lt(orders.paymentDueAt, now)
    ),
    columns: { id: true },
  });

  if (overdue.length === 0) return { expired: 0 };

  const ids = overdue.map((o) => o.id);

  for (const id of ids) {
    await restockAndCancelOrder(id);
  }

  return { expired: ids.length };
}