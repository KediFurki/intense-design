import type {
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    OrderUiInput,
  } from "@/lib/orders/types";
  
  function isOrderStatus(v: unknown): v is OrderStatus {
    return (
      v === "pending" ||
      v === "processing" ||
      v === "shipped" ||
      v === "delivered" ||
      v === "cancelled" ||
      v === "expired"
    );
  }
  
  function isPaymentStatus(v: unknown): v is PaymentStatus {
    return (
      v === "awaiting_payment" ||
      v === "paid" ||
      v === "deposit_paid" ||
      v === "remaining_due" ||
      v === "cancelled"
    );
  }
  
  function isPaymentMethod(v: unknown): v is PaymentMethod {
    return v === "stripe" || v === "iban" || v === "cash_on_installation";
  }
  
  export function normalizeOrderUiInput(raw: {
    status: unknown;
    paymentStatus: unknown;
    paymentMethod: unknown;
    paymentDueAt: unknown;
    remainingAmount: unknown;
    depositPercent: unknown;
  }): OrderUiInput {
    const status: OrderStatus = isOrderStatus(raw.status) ? raw.status : "pending";
    const paymentStatus: PaymentStatus = isPaymentStatus(raw.paymentStatus)
      ? raw.paymentStatus
      : "awaiting_payment";
    const paymentMethod: PaymentMethod = isPaymentMethod(raw.paymentMethod)
      ? raw.paymentMethod
      : "stripe";
  
    const paymentDueAt =
      raw.paymentDueAt instanceof Date ? raw.paymentDueAt : null;
  
    const remainingAmount =
      typeof raw.remainingAmount === "number" ? raw.remainingAmount : 0;
  
    const depositPercent =
      typeof raw.depositPercent === "number" ? raw.depositPercent : 0;
  
    return {
      status,
      paymentStatus,
      paymentMethod,
      paymentDueAt,
      remainingAmount,
      depositPercent,
    };
  }  