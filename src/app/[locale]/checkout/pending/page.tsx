import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getOrderStatusBadges, getOrderStatusHint } from "@/lib/orders/status-ui";
import { normalizeOrderUiInput } from "@/lib/orders/normalize-order-ui";

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700">{t("missingOrderId")}</CardContent>
        </Card>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700">{t("orderNotFound")}</CardContent>
        </Card>
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
  const beneficiary =
    process.env.NEXT_PUBLIC_COMPANY_BENEFICIARY || "Intense Design";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-slate-700">
                {t("orderId")} <b>{order.id}</b>
              </div>

              <div className="flex flex-wrap gap-2">
                {badges.map((b, idx) => (
                  <Badge key={idx} variant={b.variant} className="whitespace-nowrap">
                    {b.label}
                  </Badge>
                ))}
              </div>
            </div>

            {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}

            <Separator />

            {String(ui.paymentMethod) === "iban" ? (
              <>
                <p className="text-slate-600">{t("ibanIntro")}</p>

                <div className="bg-slate-50 border rounded-xl p-4 text-sm space-y-1">
                  <div>
                    <b>{t("beneficiary")}:</b> {beneficiary}
                  </div>
                  <div>
                    <b>{t("iban")}:</b> {iban}
                  </div>
                  <div>
                    <b>{t("reference")}:</b> INTENSE-{order.id}
                  </div>
                  <div>
                    <b>{t("amount")}:</b> {formatMoneyEUR(order.totalAmount ?? 0)}
                  </div>
                  {ui.paymentDueAt ? (
                    <div>
                      <b>{t("due")}:</b> {formatDateTime(locale, ui.paymentDueAt)}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-600">{t("installIntro")}</p>
                <div className="bg-slate-50 border rounded-xl p-4 text-sm">
                  <div>
                    <b>{t("remaining")}:</b>{" "}
                    {formatMoneyEUR(order.remainingAmount ?? 0)}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button asChild className="w-full h-11">
                <Link locale={locale} href={`/account/orders/${order.id}`}>
                  {t("viewDetails")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-11">
                <Link locale={locale} href="/account">
                  {t("myOrders")}
                </Link>
              </Button>

              <Button asChild variant="secondary" className="w-full h-11">
                <Link locale={locale} href="/">
                  {t("continueShopping")}
                </Link>
              </Button>
            </div>

            <p className="text-xs text-slate-500">{t("autoRedirectHint")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}