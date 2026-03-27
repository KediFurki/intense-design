import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendEmail, getAdminEmail, getFromEmail } from "@/server/email/mailer";
import { getLocaleValue, type LocalizedText } from "@/lib/i18n/get-locale-value";

type MoneyCents = number;

function eur(cents: MoneyCents): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function safeDate(d: Date | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function wrapEmail(title: string, bodyHtml: string): string {
  const brand = "Intense Design";
  const from = getFromEmail();

  return `
  <div style="background:#f8fafc;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <div style="padding:18px 22px;border-bottom:1px solid #e2e8f0;background:#0f172a;">
        <div style="color:#ffffff;font-weight:800;font-size:16px;letter-spacing:0.2px;">${brand}</div>
        <div style="color:#cbd5e1;font-size:12px;margin-top:4px;">${from}</div>
      </div>

      <div style="padding:22px;">
        <div style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:10px;">${title}</div>
        ${bodyHtml}
      </div>

      <div style="padding:16px 22px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;">
        If you did not place this order, please contact support.
      </div>
    </div>
  </div>
  `;
}

function paymentLabel(method: string): string {
  if (method === "iban") return "IBAN";
  if (method === "stripe") return "Card (Stripe)";
  if (method === "cash_on_installation") return "Cash on installation";
  return method;
}

function statusLabel(status: string): string {
  if (status === "awaiting_payment") return "Awaiting payment";
  if (status === "paid") return "Paid";
  if (status === "deposit_paid") return "Deposit paid";
  if (status === "remaining_due") return "Remaining due";
  if (status === "cancelled") return "Cancelled";
  return status;
}

type EnrichedItem = {
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

async function loadOrderSummary(orderId: string, locale: string) {
  const safeLocale = locale?.trim() ? locale.trim() : "en";

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      country: true,
      state: true,
      city: true,
      address: true,
      zipCode: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      depositPercent: true,
      remainingAmount: true,
      paymentDueAt: true,
      createdAt: true,
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
    columns: { productId: true, variantName: true, price: true, quantity: true },
  });

  // N+1 yerine toplu çek
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const productRows =
    productIds.length === 0
      ? []
      : await db
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(inArray(products.id, productIds));

  const nameById = new Map<string, LocalizedText | null>();
  for (const p of productRows) {
    nameById.set(p.id, (p.name ?? null) as unknown as LocalizedText | null);
  }

  const enriched: EnrichedItem[] = items.map((it) => {
    const lt = nameById.get(it.productId) ?? null;
    const productName = lt ? getLocaleValue(lt, safeLocale) : it.productId;

    return {
      productName,
      variantLabel: it.variantName || "",
      price: it.price,
      quantity: it.quantity,
    };
  });

  const addressLine = `${order.address}, ${order.zipCode} ${order.city}${order.state ? `, ${order.state}` : ""}, ${order.country}`;

  return { order, enriched, addressLine, locale: safeLocale };
}

function itemsTable(enriched: EnrichedItem[]) {
  const rows = enriched
    .map(
      (x) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:700;color:#0f172a;font-size:13px;">${x.productName}</div>
          ${x.variantLabel ? `<div style="color:#64748b;font-size:12px;margin-top:2px;">${x.variantLabel}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;text-align:right;">${x.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;text-align:right;">${eur(x.price)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="margin-top:18px;font-weight:800;color:#0f172a;">Items</div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr>
          <th style="text-align:left;color:#64748b;font-size:12px;padding:8px 0;border-bottom:1px solid #e2e8f0;">Product</th>
          <th style="text-align:right;color:#64748b;font-size:12px;padding:8px 0;border-bottom:1px solid #e2e8f0;">Qty</th>
          <th style="text-align:right;color:#64748b;font-size:12px;padding:8px 0;border-bottom:1px solid #e2e8f0;">Unit</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

async function safeSend(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tag: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log(`[email:${args.tag}] sending to ${args.to}...`);
    const res = await sendEmail({
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });

    if (!res.ok) {
      console.error(`[email:${args.tag}] failed:`, res.error);
      return { ok: false, error: res.error };
    }

    console.log(`[email:${args.tag}] sent successfully`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[email:${args.tag}] exception:`, msg);
    return { ok: false, error: msg };
  }
}

export async function sendOrderCreatedEmails(args: { orderId: string; locale: string }): Promise<{ customerOk: boolean; adminOk: boolean; errors: string[] }> {
  const { orderId, locale } = args;

  const { order, enriched, addressLine } = await loadOrderSummary(orderId, locale);

  const paymentBlock =
    order.paymentMethod === "iban"
      ? `
        <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;">IBAN Payment</div>
          <div style="color:#334155;font-size:13px;line-height:1.6;">
            Please complete the bank transfer within <b>3 days</b>.
          </div>
          <div style="margin-top:10px;font-size:13px;color:#0f172a;">
            <div><b>Beneficiary:</b> ${process.env.NEXT_PUBLIC_COMPANY_BENEFICIARY || "Intense Design"}</div>
            <div><b>IBAN:</b> ${process.env.NEXT_PUBLIC_COMPANY_IBAN || "IBAN_NOT_SET"}</div>
            <div><b>Reference:</b> INTENSE-${order.id}</div>
            <div><b>Amount:</b> ${eur(order.totalAmount)}</div>
            <div><b>Due:</b> ${safeDate(order.paymentDueAt ?? null)}</div>
          </div>
        </div>
      `
      : order.paymentMethod === "stripe"
      ? `
        <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;">Card Payment (Stripe)</div>
          <div style="color:#334155;font-size:13px;line-height:1.6;">
            Payment will be confirmed automatically after checkout.
          </div>
        </div>
      `
      : `
        <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;">Pay at Installation</div>
          <div style="color:#334155;font-size:13px;line-height:1.6;">
            Remaining will be paid during installation (link / IBAN / cash).
          </div>
          <div style="margin-top:10px;font-size:13px;color:#0f172a;">
            <div><b>Remaining:</b> ${eur(order.remainingAmount)}</div>
          </div>
        </div>
      `;

  const body = `
    <div style="color:#334155;font-size:13px;line-height:1.65;">
      Thank you. We received your order. You can use the details below to track payment and delivery.
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:180px;">Order ID</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${order.id}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Created</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${safeDate(order.createdAt ?? null)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Delivery</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${addressLine}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Payment</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${paymentLabel(order.paymentMethod)} — ${statusLabel(order.paymentStatus)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Total</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${eur(order.totalAmount)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Deposit</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${order.depositPercent}%</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Remaining</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${eur(order.remainingAmount)}</td></tr>
    </table>

    ${itemsTable(enriched)}
    ${paymentBlock}
  `;

  const errors: string[] = [];

  const customerResult = await safeSend({
    to: order.customerEmail,
    subject: `Order received: ${order.id}`,
    html: wrapEmail("Order received", body),
    tag: "order_created_customer",
  });
  if (!customerResult.ok && customerResult.error) errors.push(`customer: ${customerResult.error}`);

  const adminResult = await safeSend({
    to: getAdminEmail(),
    subject: `New order: ${order.id}`,
    html: wrapEmail("New order created", body),
    replyTo: order.customerEmail,
    tag: "order_created_admin",
  });
  if (!adminResult.ok && adminResult.error) errors.push(`admin: ${adminResult.error}`);

  return { customerOk: customerResult.ok, adminOk: adminResult.ok, errors };
}

export async function sendPaymentUpdatedEmails(args: { orderId: string; locale: string }): Promise<void> {
  const { orderId, locale } = args;

  const { order, enriched, addressLine } = await loadOrderSummary(orderId, locale);

  const title =
    order.paymentStatus === "paid"
      ? "Payment confirmed"
      : order.paymentStatus === "deposit_paid"
      ? "Deposit confirmed"
      : "Payment updated";

  const body = `
    <div style="color:#334155;font-size:13px;line-height:1.65;">
      Your payment status has been updated.
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:180px;">Order ID</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${order.id}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Payment</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${paymentLabel(order.paymentMethod)} — ${statusLabel(order.paymentStatus)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Total</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${eur(order.totalAmount)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Remaining</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${eur(order.remainingAmount)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Delivery</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${addressLine}</td></tr>
    </table>

    ${itemsTable(enriched)}
  `;

  await safeSend({
    to: order.customerEmail,
    subject: `${title}: ${order.id}`,
    html: wrapEmail(title, body),
    tag: "payment_updated_customer",
  });

  await safeSend({
    to: getAdminEmail(),
    subject: `${title}: ${order.id}`,
    html: wrapEmail(title, body),
    replyTo: order.customerEmail,
    tag: "payment_updated_admin",
  });
}