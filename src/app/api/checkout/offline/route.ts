import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createOrderWithReservation } from "@/server/services/order-service";

const schema = z.object({
  // locale artık zorunlu değil
  locale: z.string().min(2).optional(),

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

  paymentMethod: z.enum(["iban", "cash_on_installation"]),
});

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Failed";
}

function inferLocale(req: Request): string {
  // 1) custom header (istersen client’ta gönderirsin)
  const headerLocale = req.headers.get("x-app-locale");
  if (headerLocale && headerLocale.trim().length >= 2) return headerLocale.trim();

  // 2) accept-language -> "tr-TR,tr;q=0.9,en;q=0.8" gibi gelir
  const al = req.headers.get("accept-language");
  if (al) {
    const first = al.split(",")[0]?.trim(); // tr-TR
    const lang = first?.split("-")[0]?.trim(); // tr
    if (lang && lang.length >= 2) return lang;
  }

  // 3) en güvenlisi default
  return "en";
}

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth();
    const body = await req.json();
    const parsed = schema.parse(body);

    const locale = parsed.locale ?? inferLocale(req);

    const customerName = `${parsed.customer.firstName} ${parsed.customer.lastName}`.trim();

    const now = new Date();
    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const paymentStatus = parsed.paymentMethod === "iban" ? "awaiting_payment" : "remaining_due";
    const paymentDueAt = parsed.paymentMethod === "iban" ? due : null;

    const created = await createOrderWithReservation({
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
      paymentMethod: parsed.paymentMethod,
      paymentStatus,
      depositPercent: 0,
      paymentDueAt,
    });

    return NextResponse.json({
      orderId: created.orderId,
      paymentMethod: parsed.paymentMethod,
      paymentStatus,
      paymentDueAt: paymentDueAt ? paymentDueAt.toISOString() : null,
      locale,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: toMessage(e) }, { status: 400 });
  }
}