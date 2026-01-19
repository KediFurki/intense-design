export type OrderStatus =
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

export type OrderUiInput = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDueAt: Date | null;
  remainingAmount: number;
  depositPercent: number;
};