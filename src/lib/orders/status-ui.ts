// src/lib/orders/status-ui.ts
export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export type OrderLike = {
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "expired";
  paymentStatus:
    | "awaiting_payment"
    | "paid"
    | "deposit_paid"
    | "remaining_due"
    | "cancelled";
  paymentMethod?: "stripe" | "iban" | "cash_on_installation" | string | null;
  paymentDueAt?: Date | string | null;
  remainingAmount?: number | null; // cents
  depositPercent?: number | null;
};

function asDate(d: OrderLike["paymentDueAt"]): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getOrderStatusBadges(
  order: OrderLike,
  t: (key: string, values?: Record<string, unknown>) => string
): Array<{ label: string; variant: BadgeVariant }> {
  const badges: Array<{ label: string; variant: BadgeVariant }> = [];

  // 1) Fulfillment badge (status)
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
      badges.push({ label: t("fulfillment.delivered"), variant: "default" });
      break;
  }

  // 2) Payment badge (paymentStatus + method context)
  const due = asDate(order.paymentDueAt);
  const depositPercent = order.depositPercent ?? 0;

  if (order.paymentStatus === "cancelled") {
    badges.push({ label: t("payment.cancelled"), variant: "destructive" });
  } else if (order.paymentStatus === "awaiting_payment") {
    if (order.paymentMethod === "iban") {
      badges.push({
        label: due
          ? t("payment.awaitingIbanDue", { /* UI sadece string ister */ })
          : t("payment.awaitingIban"),
        variant: "outline",
      });
    } else if (order.paymentMethod === "stripe") {
      badges.push({ label: t("payment.awaitingStripe"), variant: "outline" });
    } else {
      badges.push({ label: t("payment.awaiting"), variant: "outline" });
    }
  } else if (order.paymentStatus === "paid") {
    badges.push({ label: t("payment.paid"), variant: "default" });
  } else if (order.paymentStatus === "deposit_paid") {
    badges.push({
      label: t("payment.depositPaid", { percent: depositPercent || 30 }),
      variant: "default",
    });
  } else if (order.paymentStatus === "remaining_due") {
    if (order.paymentMethod === "cash_on_installation") {
      badges.push({ label: t("payment.payAtInstall"), variant: "outline" });
    } else {
      badges.push({ label: t("payment.remainingDue"), variant: "outline" });
    }
  }

  // 3) Payment method badge (optional but clean)
  const pm = String(order.paymentMethod || "");
  if (pm === "iban") badges.push({ label: t("method.iban"), variant: "secondary" });
  else if (pm === "stripe") badges.push({ label: t("method.card"), variant: "secondary" });
  else if (pm === "cash_on_installation") badges.push({ label: t("method.installment"), variant: "secondary" });

  return badges;
}

export function getOrderStatusHint(
  order: OrderLike,
  t: (key: string, values?: Record<string, unknown>) => string,
  formatDateTime?: (d: Date) => string,
  formatMoney?: (cents: number) => string
): string | null {
  // Kısa, tek satır açıklama.
  if (order.status === "cancelled") return t("hint.cancelled");
  if (order.status === "expired") return t("hint.expired");

  const due = asDate(order.paymentDueAt);

  if (order.paymentStatus === "awaiting_payment" && order.paymentMethod === "iban") {
    if (due && formatDateTime) return t("hint.ibanDue", { due: formatDateTime(due) });
    return t("hint.iban");
  }

  if (order.paymentStatus === "remaining_due" && order.paymentMethod === "cash_on_installation") {
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