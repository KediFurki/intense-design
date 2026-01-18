import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { stripe } from "@/server/payments/stripe";
import { createOrderWithReservation } from "@/server/services/order-service";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  locale: z.string().min(2).optional().default("en"),
  saveAddress: z.boolean().optional().default(true),

  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
    country: z.string().min(1),
    state: z.string().optional().default(""),
    city: z.string().min(1),
    address: z.string().min(1),
    zipCode: z.string().min(1),
    invoiceType: z.enum(["individual", "corporate"]).default("individual"),
    taxId: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    taxOffice: z.string().optional().nullable(),
  }),

  items: z
    .array(
      z.object({
        id: z.string(),
        variantId: z.string().optional(),
        variantName: z.string().optional(),
        price: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),

  paymentType: z.enum(["full", "deposit"]),
});

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Failed";
}

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth();
    const body = await req.json();
    const parsed = schema.parse(body);

    const customerName = `${parsed.customer.firstName} ${parsed.customer.lastName}`.trim();
    const depositPercent = parsed.paymentType === "deposit" ? 30 : 0;

    const { orderId, totalAmount, depositAmount, remainingAmount } =
      await createOrderWithReservation({
        customer: {
          userId: sessionAuth?.user?.id ?? null,
          customerName,
          customerEmail: parsed.customer.email,
          customerPhone: parsed.customer.phone,
          country: parsed.customer.country,
          state: parsed.customer.state ?? "",
          city: parsed.customer.city,
          address: parsed.customer.address,
          zipCode: parsed.customer.zipCode,
          invoiceType: parsed.customer.invoiceType,
          taxId: parsed.customer.taxId ?? null,
          companyName: parsed.customer.companyName ?? null,
          taxOffice: parsed.customer.taxOffice ?? null,
        },
        items: parsed.items,
        paymentMethod: "stripe",
        paymentStatus: "awaiting_payment",
        depositPercent,
        paymentDueAt: null,
        saveAddress: parsed.saveAddress,
      });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const amountToCharge = parsed.paymentType === "deposit" ? depositAmount : totalAmount;

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/${parsed.locale}/checkout/success?oid=${orderId}`,
      cancel_url: `${appUrl}/${parsed.locale}/checkout/cancel?oid=${orderId}`,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: parsed.paymentType === "deposit" ? "Deposit (30%)" : "Order Payment",
            },
            unit_amount: amountToCharge,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId,
        paymentType: parsed.paymentType,
        depositPercent: String(depositPercent),
        remainingAmount: String(remainingAmount),
        locale: parsed.locale,
      },
    });

    await db
      .update(orders)
      .set({
        stripeCheckoutSessionId: stripeSession.id,
        paymentStatus: "awaiting_payment",
        paymentMethod: "stripe",
        depositPercent,
        remainingAmount,
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ url: stripeSession.url, orderId });
  } catch (e: unknown) {
    return NextResponse.json({ error: toMessage(e) }, { status: 400 });
  }
}