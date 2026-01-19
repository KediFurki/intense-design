// src/lib/orders/status-ui.ts

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired";

export type PaymentStatus =
  | "awaiting_payment"
  | "paid"
  | "deposit_paid"
  | "remaining_due"
  | "cancelled";

export type PaymentMethod = "stripe" | "iban" | "cash_on_installation";

export type OrderLike = {
  status: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | string | null;
  paymentDueAt?: Date | string | null;
  remainingAmount?: number | null; // cents
  depositPercent?: number | null;
};

/**
 * These are the ONLY keys this helper will request.
 * Exported so call sites can be typed with zero `any`.
 */
export type OrderStatusKey =
  // fulfillment
  | "fulfillment.pending"
  | "fulfillment.processing"
  | "fulfillment.shipped"
  | "fulfillment.delivered"
  | "fulfillment.cancelled"
  | "fulfillment.expired"
  // payment
  | "payment.cancelled"
  | "payment.awaiting"
  | "payment.awaitingStripe"
  | "payment.awaitingIban"
  | "payment.awaitingIbanDue"
  | "payment.paid"
  | "payment.depositPaid"
  | "payment.remainingDue"
  | "payment.payAtInstall"
  // method
  | "method.iban"
  | "method.card"
  | "method.installment"
  // hints
  | "hint.cancelled"
  | "hint.expired"
  | "hint.iban"
  | "hint.ibanDue"
  | "hint.remainingAtInstall"
  | "hint.remainingAtInstallWithAmount"
  | "hint.depositPaid"
  | "hint.depositPaidRemaining";

/**
 * Values allowed per key. Keeping it strict prevents accidental `any`.
 */
export type OrderStatusValues =
  | { percent: number }
  | { due: string }
  | { amount: string }
  | Record<string, never>;

export type OrderStatusTranslator = (key: OrderStatusKey, values?: OrderStatusValues) => string;

function asDate(d: OrderLike["paymentDueAt"]): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizePaymentMethod(pm: OrderLike["paymentMethod"]): PaymentMethod | null {
  if (!pm) return null;
  if (pm === "stripe" || pm === "iban" || pm === "cash_on_installation") return pm;
  return null;
}

export function getOrderStatusBadges(
  order: OrderLike,
  t: OrderStatusTranslator,
  formatDateTime?: (d: Date) => string
): Array<{ label: string; variant: BadgeVariant }> {
  const badges: Array<{ label: string; variant: BadgeVariant }> = [];

  // 1) Fulfillment badge
  switch (order.status) {
    case "cancelled":
      badges.push({ label: t("fulfillment.cancelled"), variant: "destructive" });
      break;
    case "expired":
      badges.push({ label: t("fulfillment.expired"), variant: "destructive" });
      break;
    case "pending":
      badges.push({ label: t("fulfillment.pending"), variant: "secondary" });
      break;
    case "processing":
      badges.push({ label: t("fulfillment.processing"), variant: "secondary" });
      break;
    case "shipped":
      badges.push({ label: t("fulfillment.shipped"), variant: "default" });
      break;
    case "delivered":
      badges.push({ label: t("fulfillment.delivered"), variant: "secondary" });
      break;
  }

  // 2) Payment badge
  const due = asDate(order.paymentDueAt);
  const depositPercent = order.depositPercent ?? 0;
  const pm = normalizePaymentMethod(order.paymentMethod);

  if (order.paymentStatus === "cancelled") {
    badges.push({ label: t("payment.cancelled"), variant: "destructive" });
  } else if (order.paymentStatus === "awaiting_payment") {
    if (pm === "iban") {
      if (due && formatDateTime) {
        badges.push({
          label: t("payment.awaitingIbanDue", { due: formatDateTime(due) }),
          variant: "outline",
        });
      } else {
        badges.push({ label: t("payment.awaitingIban"), variant: "outline" });
      }
    } else if (pm === "stripe") {
      badges.push({ label: t("payment.awaitingStripe"), variant: "outline" });
    } else {
      badges.push({ label: t("payment.awaiting"), variant: "outline" });
    }
  } else if (order.paymentStatus === "paid") {
    badges.push({ label: t("payment.paid"), variant: "secondary" });
  } else if (order.paymentStatus === "deposit_paid") {
    badges.push({
      label: t("payment.depositPaid", { percent: depositPercent || 30 }),
      variant: "secondary",
    });
  } else if (order.paymentStatus === "remaining_due") {
    if (pm === "cash_on_installation") {
      badges.push({ label: t("payment.payAtInstall"), variant: "outline" });
    } else {
      badges.push({ label: t("payment.remainingDue"), variant: "outline" });
    }
  }

  // 3) Payment method badge (optional)
  if (pm === "iban") badges.push({ label: t("method.iban"), variant: "outline" });
  else if (pm === "stripe") badges.push({ label: t("method.card"), variant: "outline" });
  else if (pm === "cash_on_installation")
    badges.push({ label: t("method.installment"), variant: "outline" });

  return badges;
}

export function getOrderStatusHint(
  order: OrderLike,
  t: OrderStatusTranslator,
  formatDateTime?: (d: Date) => string,
  formatMoney?: (cents: number) => string
): string | null {
  if (order.status === "cancelled") return t("hint.cancelled");
  if (order.status === "expired") return t("hint.expired");

  const pm = normalizePaymentMethod(order.paymentMethod);
  const due = asDate(order.paymentDueAt);

  if (order.paymentStatus === "awaiting_payment" && pm === "iban") {
    if (due && formatDateTime) return t("hint.ibanDue", { due: formatDateTime(due) });
    return t("hint.iban");
  }

  if (order.paymentStatus === "remaining_due" && pm === "cash_on_installation") {
    if (typeof order.remainingAmount === "number" && formatMoney) {
      return t("hint.remainingAtInstallWithAmount", { amount: formatMoney(order.remainingAmount) });
    }
    return t("hint.remainingAtInstall");
  }

  if (order.paymentStatus === "deposit_paid") {
    if (typeof order.remainingAmount === "number" && formatMoney) {
      return t("hint.depositPaidRemaining", { amount: formatMoney(order.remainingAmount) });
    }
    return t("hint.depositPaid");
  }

  return null;
}