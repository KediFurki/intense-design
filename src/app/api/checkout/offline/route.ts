import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createOrderWithReservation } from "@/server/services/order-service";
import { sendOrderCreatedEmails } from "@/server/services/order-email-service";

const schema = z.object({
  locale: z.string().min(2).optional(),
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

  paymentMethod: z.enum(["iban", "cash_on_installation"]),
});

function inferLocale(req: Request): string {
  const headerLocale = req.headers.get("x-app-locale");
  if (headerLocale && headerLocale.trim().length >= 2) return headerLocale.trim();

  const al = req.headers.get("accept-language");
  if (al) {
    const first = al.split(",")[0]?.trim();
    const lang = first?.split("-")[0]?.trim();
    if (lang && lang.length >= 2) return lang;
  }

  return "en";
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Failed";
}

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth();

    const bodyUnknown: unknown = await req.json();
    const parsedResult = schema.safeParse(bodyUnknown);
    if (!parsedResult.success) {
      return NextResponse.json({ error: parsedResult.error.flatten() }, { status: 400 });
    }

    const parsed = parsedResult.data;
    const locale = parsed.locale ?? inferLocale(req);

    const customerName = `${parsed.customer.firstName} ${parsed.customer.lastName}`.trim();

    const now = new Date();
    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const paymentStatus = parsed.paymentMethod === "iban" ? "awaiting_payment" : "remaining_due";
    const paymentDueAt = parsed.paymentMethod === "iban" ? due : null;

    const created = await createOrderWithReservation({
      customer: {
        userId: sessionAuth?.user?.id ?? null,
        firstName: parsed.customer.firstName,
        lastName: parsed.customer.lastName,
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
      saveAddress: parsed.saveAddress,
    });

    let emailStatus = { customerOk: false, adminOk: false, errors: [] as string[] };
    try {
      emailStatus = await sendOrderCreatedEmails({
        orderId: created.orderId,
        locale,
      });
    } catch (mailErr: unknown) {
      const msg = toMessage(mailErr);
      console.error("[offline-checkout] email_failed", msg);
      emailStatus.errors.push(msg);
    }

    return NextResponse.json({
      orderId: created.orderId,
      paymentMethod: parsed.paymentMethod,
      paymentStatus,
      paymentDueAt: paymentDueAt ? paymentDueAt.toISOString() : null,
      emailSent: emailStatus.customerOk || emailStatus.adminOk,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: toMessage(e) }, { status: 400 });
  }
}