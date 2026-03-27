import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { getOrderStatusBadges, getOrderStatusHint } from "@/lib/orders/status-ui";
import { normalizeOrderUiInput } from "@/lib/orders/normalize-order-ui";
import { CheckCircle2, Clock, CreditCard, FileText, Home, ShoppingBag } from "lucide-react";

type PendingSearchParams = { oid?: string };
type RouteParams = { locale: string };

function formatMoneyEUR(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format((cents ?? 0) / 100);
}

function formatDateTime(locale: string, d: Date): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export default async function CheckoutPendingPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<PendingSearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const oid = sp?.oid;

  const t = await getTranslations("CheckoutPending");
  const orderStatusT = await getTranslations("OrderStatus");

  if (!oid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf3] p-6">
        <div className="w-full max-w-lg rounded-3xl border border-[#eadfce] bg-white p-8 text-center shadow-lg">
          <Clock className="mx-auto mb-4 size-12 text-[#b08f74]" />
          <h1 className="text-xl font-bold text-[#4e3629]">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#8b6a52]">{t("missingOrderId")}</p>
        </div>
      </div>
    );
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, oid),
    columns: {
      id: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentDueAt: true,
      totalAmount: true,
      remainingAmount: true,
      depositPercent: true,
    },
  });

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf3] p-6">
        <div className="w-full max-w-lg rounded-3xl border border-[#eadfce] bg-white p-8 text-center shadow-lg">
          <Clock className="mx-auto mb-4 size-12 text-[#b08f74]" />
          <h1 className="text-xl font-bold text-[#4e3629]">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#8b6a52]">{t("orderNotFound")}</p>
        </div>
      </div>
    );
  }

  const ui = normalizeOrderUiInput({
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentDueAt: order.paymentDueAt,
    remainingAmount: order.remainingAmount,
    depositPercent: order.depositPercent,
  });

  const isOrderRequest = order.paymentMethod === "cash_on_installation";
  const isIban = order.paymentMethod === "iban";

  const badges = getOrderStatusBadges(ui, (k, values) =>
    orderStatusT(k, values as Record<string, string | number>)
  );

  const hint = getOrderStatusHint(
    ui,
    (k, values) => orderStatusT(k, values as Record<string, string | number>),
    (d) => formatDateTime(locale, d),
    (cents) => formatMoneyEUR(cents)
  );

  const iban = process.env.NEXT_PUBLIC_COMPANY_IBAN || "IBAN_NOT_SET";
  const beneficiary = process.env.NEXT_PUBLIC_COMPANY_BENEFICIARY || "Intense Design";

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Header icon */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#c8996d] via-[#b37a4c] to-[#6f4e37] shadow-lg">
            {isOrderRequest ? (
              <CheckCircle2 className="size-10 text-white" />
            ) : (
              <Clock className="size-10 text-white" />
            )}
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#4e3629] sm:text-3xl">
            {isOrderRequest ? t("orderRequestTitle") : t("title")}
          </h1>
          <p className="mt-2 text-sm text-[#8b6a52]">
            {isOrderRequest ? t("orderRequestDesc") : isIban ? t("ibanIntro") : t("installIntro")}
          </p>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white shadow-lg">
          {/* Order ID + badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfce] px-6 py-5">
            <div className="text-sm text-[#8b6a52]">
              {t("orderId")} <span className="font-semibold text-[#4e3629]">{order.id}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, idx) => (
                <Badge key={idx} variant={b.variant} className="whitespace-nowrap rounded-full">
                  {b.label}
                </Badge>
              ))}
            </div>
          </div>

          {hint && (
            <div className="border-b border-[#eadfce]/60 bg-[#fffaf3] px-6 py-3">
              <p className="text-xs text-[#8b6a52]">{hint}</p>
            </div>
          )}

          {/* IBAN details */}
          {isIban && (
            <div className="border-b border-[#eadfce] px-6 py-5">
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="size-4 text-[#9a5f2f]" />
                  <span className="text-sm font-semibold text-[#4e3629]">{t("ibanDetailsTitle")}</span>
                </div>
                <div className="space-y-2 text-sm text-[#5c4330]">
                  <div className="flex justify-between">
                    <span className="text-[#8b6a52]">{t("beneficiary")}</span>
                    <span className="font-medium">{beneficiary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b6a52]">{t("iban")}</span>
                    <span className="font-mono font-medium">{iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b6a52]">{t("reference")}</span>
                    <span className="font-medium">INTENSE-{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b6a52]">{t("amount")}</span>
                    <span className="font-semibold text-[#4e3629]">{formatMoneyEUR(order.totalAmount ?? 0)}</span>
                  </div>
                  {ui.paymentDueAt && (
                    <div className="flex justify-between">
                      <span className="text-[#8b6a52]">{t("due")}</span>
                      <span className="font-medium text-red-700">{formatDateTime(locale, ui.paymentDueAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cash / remaining info */}
          {!isIban && !isOrderRequest && (
            <div className="border-b border-[#eadfce] px-6 py-5">
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8b6a52]">{t("remaining")}</span>
                  <span className="font-semibold text-[#4e3629]">{formatMoneyEUR(order.remainingAmount ?? 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button asChild className="h-12 rounded-2xl bg-[#6f4e37] text-white shadow-sm hover:bg-[#5d412e]">
                <Link locale={locale} href={`/account/orders/${order.id}`}>
                  <FileText className="mr-2 size-4" />
                  {t("viewDetails")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-12 rounded-2xl border-[#eadfce] text-[#5c4330] hover:bg-[#fff4e8]">
                <Link locale={locale} href="/account">
                  <ShoppingBag className="mr-2 size-4" />
                  {t("myOrders")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-12 rounded-2xl border-[#eadfce] text-[#5c4330] hover:bg-[#fff4e8]">
                <Link locale={locale} href="/">
                  <Home className="mr-2 size-4" />
                  {t("continueShopping")}
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-[#b08f74]">{t("autoRedirectHint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}