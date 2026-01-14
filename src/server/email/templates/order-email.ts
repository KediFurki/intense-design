import type { LocalizedText } from "@/lib/i18n/get-locale-value";
import { getLocaleValue } from "@/lib/i18n/get-locale-value";

export type EmailOrderItem = {
  name: LocalizedText;
  variantName?: string | null;
  quantity: number;
  price: number; // cents
};

export type EmailOrderData = {
  orderId: string;
  locale: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;

  invoiceType: "individual" | "corporate";
  taxId?: string | null;
  companyName?: string | null;
  taxOffice?: string | null;

  totalAmount: number; // cents
  depositPercent: number;
  remainingAmount: number; // cents

  paymentMethod: "iban" | "cash_on_installation" | "stripe";
  paymentDueAt?: Date | null;

  items: EmailOrderItem[];
};

function moneyEUR(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toISOString();
  }
}

function baseLayout(opts: { title: string; preheader: string; content: string }): string {
  // Basit, güven veren, mobilde düzgün: inline CSS.
  const { title, preheader, content } = opts;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#f6f7fb;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7fb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="width:100%;max-width:640px;">
          <tr>
            <td style="padding:0 0 14px 0;">
              <div style="font-weight:800;letter-spacing:-0.02em;font-size:18px;color:#0f172a;">
                Intense Design
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">
                Premium furniture. Built to last.
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
              <div style="padding:22px 22px 10px 22px;">
                <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;">
                  ${escapeHtml(title)}
                </div>
              </div>

              <div style="padding:0 22px 22px 22px;">
                ${content}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 4px 0 4px;color:#94a3b8;font-size:12px;line-height:1.5;">
              <div>Need help? Reply to this email.</div>
              <div style="margin-top:6px;">© ${new Date().getFullYear()} Intense Design</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderItemsTable(items: EmailOrderItem[], locale: string): string {
  const rows = items
    .map((it) => {
      const name = getLocaleValue(it.name, locale);
      const variant = it.variantName ? ` <span style="color:#64748b;">(${escapeHtml(it.variantName)})</span>` : "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef2f7;">
            <div style="font-weight:700;">${escapeHtml(name)}${variant}</div>
            <div style="font-size:12px;color:#64748b;margin-top:3px;">Qty: ${it.quantity}</div>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eef2f7;font-weight:700;">
            ${moneyEUR(it.price * it.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;">
      <tr>
        <td style="font-size:12px;color:#64748b;padding-bottom:8px;">Items</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${rows}
    </table>
  `;
}

function renderAddressBlock(o: EmailOrderData): string {
  return `
    <div style="margin-top:14px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfdff;">
      <div style="font-weight:800;margin-bottom:6px;">Delivery details</div>
      <div style="font-size:13px;color:#0f172a;line-height:1.45;">
        <div><b>Name:</b> ${escapeHtml(o.customerName)}</div>
        <div><b>Phone:</b> ${escapeHtml(o.customerPhone)}</div>
        <div style="margin-top:6px;">
          <b>Address:</b> ${escapeHtml(o.address)}, ${escapeHtml(o.city)} ${escapeHtml(o.zipCode)}${o.state ? `, ${escapeHtml(o.state)}` : ""}, ${escapeHtml(o.country)}
        </div>
      </div>
    </div>
  `;
}

function renderInvoiceBlock(o: EmailOrderData): string {
  if (o.invoiceType !== "corporate") {
    return `
      <div style="margin-top:14px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="font-weight:800;margin-bottom:6px;">Invoice</div>
        <div style="font-size:13px;color:#334155;">Type: Individual</div>
      </div>
    `;
  }

  return `
    <div style="margin-top:14px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
      <div style="font-weight:800;margin-bottom:6px;">Invoice</div>
      <div style="font-size:13px;color:#0f172a;line-height:1.45;">
        <div><b>Type:</b> Corporate</div>
        <div><b>Company:</b> ${escapeHtml(o.companyName ?? "")}</div>
        <div><b>Tax ID:</b> ${escapeHtml(o.taxId ?? "")}</div>
        <div><b>Tax Office:</b> ${escapeHtml(o.taxOffice ?? "")}</div>
      </div>
    </div>
  `;
}

export function renderOrderCreatedEmail(o: EmailOrderData, opts: { appUrl: string; iban: string; beneficiary: string }): string {
  const { appUrl, iban, beneficiary } = opts;

  const heading =
    o.paymentMethod === "iban"
      ? "Order received — bank transfer required"
      : o.paymentMethod === "cash_on_installation"
        ? "Order received — remaining due at installation"
        : "Order received";

  const preheader =
    o.paymentMethod === "iban"
      ? "Please complete the bank transfer within 3 days to keep the reservation."
      : "We have received your order. We'll contact you for delivery & installation.";

  const dueLine =
    o.paymentMethod === "iban" && o.paymentDueAt
      ? `<div style="margin-top:6px;"><b>Due:</b> ${escapeHtml(formatDate(o.paymentDueAt, o.locale))}</div>`
      : "";

  const ibanBox =
    o.paymentMethod === "iban"
      ? `
      <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
        <div style="font-weight:900;margin-bottom:8px;">Bank transfer instructions</div>
        <div style="font-size:13px;color:#0f172a;line-height:1.6;">
          <div><b>Beneficiary:</b> ${escapeHtml(beneficiary)}</div>
          <div><b>IBAN:</b> ${escapeHtml(iban)}</div>
          <div><b>Reference:</b> <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">INTENSE-${escapeHtml(o.orderId)}</span></div>
          <div style="margin-top:6px;"><b>Amount:</b> ${moneyEUR(o.totalAmount)}</div>
          ${dueLine}
        </div>
        <div style="margin-top:10px;font-size:12px;color:#64748b;">
          Important: If we don't receive the transfer within <b>3 days</b>, the reservation is cancelled and stock is released.
        </div>
      </div>
    `
      : "";

  const remainingBox =
    o.paymentMethod === "cash_on_installation"
      ? `
      <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
        <div style="font-weight:900;margin-bottom:8px;">Payment</div>
        <div style="font-size:13px;color:#0f172a;line-height:1.6;">
          <div><b>Total:</b> ${moneyEUR(o.totalAmount)}</div>
          <div><b>Remaining due at installation:</b> ${moneyEUR(o.remainingAmount)}</div>
        </div>
      </div>
    `
      : "";

  const itemsTable = renderItemsTable(o.items, o.locale);

  const body = `
    <div style="font-size:14px;color:#334155;line-height:1.6;">
      <div style="margin-bottom:10px;">
        Hi <b>${escapeHtml(o.customerName)}</b>, your order has been created successfully.
      </div>

      <div style="padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:12px;color:#64748b;">Order ID</div>
            <div style="font-weight:900;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
              ${escapeHtml(o.orderId)}
            </div>
          </div>
          <div>
            <div style="font-size:12px;color:#64748b;">Total</div>
            <div style="font-weight:900;">${moneyEUR(o.totalAmount)}</div>
          </div>
        </div>
      </div>

      ${ibanBox}
      ${remainingBox}

      ${itemsTable}

      ${renderAddressBlock(o)}
      ${renderInvoiceBlock(o)}

      <div style="margin-top:16px;">
        <a href="${escapeHtml(appUrl)}/account"
           style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:12px;font-weight:800;">
          View your account
        </a>
        <span style="display:inline-block;width:10px;"></span>
        <a href="${escapeHtml(appUrl)}/checkout/pending?oid=${escapeHtml(o.orderId)}"
           style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;padding:10px 14px;border-radius:12px;font-weight:800;border:1px solid #e2e8f0;">
          View order
        </a>
      </div>
    </div>
  `;

  return baseLayout({ title: heading, preheader, content: body });
}

export function renderPaymentUpdatedEmail(o: EmailOrderData, opts: { appUrl: string }): string {
  const { appUrl } = opts;

  const heading =
    o.paymentMethod === "stripe" && o.depositPercent === 30 && o.remainingAmount > 0
      ? "Deposit received (30%)"
      : "Payment received";

  const preheader =
    o.depositPercent === 30 && o.remainingAmount > 0
      ? "Your deposit was received. Remaining amount is due at installation."
      : "Your payment was received. Thank you.";

  const body = `
    <div style="font-size:14px;color:#334155;line-height:1.6;">
      <div style="margin-bottom:10px;">
        Hi <b>${escapeHtml(o.customerName)}</b>, we received your payment update.
      </div>

      <div style="padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:12px;color:#64748b;">Order ID</div>
            <div style="font-weight:900;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
              ${escapeHtml(o.orderId)}
            </div>
          </div>
          <div>
            <div style="font-size:12px;color:#64748b;">Total</div>
            <div style="font-weight:900;">${moneyEUR(o.totalAmount)}</div>
          </div>
        </div>
      </div>

      ${
        o.depositPercent === 30 && o.remainingAmount > 0
          ? `
          <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
            <div style="font-weight:900;margin-bottom:8px;">Remaining payment</div>
            <div style="font-size:13px;color:#0f172a;line-height:1.6;">
              <div><b>Remaining due at installation:</b> ${moneyEUR(o.remainingAmount)}</div>
            </div>
          </div>
        `
          : ""
      }

      <div style="margin-top:16px;">
        <a href="${escapeHtml(appUrl)}/checkout/pending?oid=${escapeHtml(o.orderId)}"
           style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:12px;font-weight:800;">
          View order
        </a>
      </div>
    </div>
  `;

  return baseLayout({ title: heading, preheader, content: body });
}