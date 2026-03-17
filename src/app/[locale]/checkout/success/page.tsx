import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type RouteParams = { locale: string };
type SuccessSearchParams = { oid?: string };

type OrderRow = {
  id: string;
  status: string | null;
  paymentMethod: "stripe" | "iban" | "cash_on_installation" | null;
  paymentStatus: "awaiting_payment" | "paid" | "deposit_paid" | "remaining_due" | "cancelled" | null;
  totalAmount: number | null;
  depositPercent: number | null;
  remainingAmount: number | null;
};

function formatMoneyEUR(locale: string, cents: number): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(
    (cents ?? 0) / 100
  );
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SuccessSearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const oid = sp?.oid;

  const t = await getTranslations("CheckoutSuccess");

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

  const order = (await db.query.orders.findFirst({
    where: eq(orders.id, oid),
    columns: {
      id: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      totalAmount: true,
      depositPercent: true,
      remainingAmount: true,
    },
  })) as OrderRow | undefined;

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

  const hasDeposit = order.paymentMethod === "stripe" && (order.depositPercent ?? 0) > 0;
  const paidLabel = hasDeposit ? t("depositPaid") : t("paid");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="text-slate-700">{t("successIntro")}</div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="capitalize">{String(order.status ?? "")}</Badge>
              <Badge variant="outline" className="capitalize">
                {String(order.paymentStatus ?? "")}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {String(order.paymentMethod ?? "")}
              </Badge>
            </div>

            <div className="text-slate-700">
              {t("orderId")} <b>{order.id}</b>
            </div>

            <Separator />

            <div className="bg-slate-50 border rounded-xl p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">{t("total")}</span>
                <b>{formatMoneyEUR(locale, order.totalAmount ?? 0)}</b>
              </div>

              {hasDeposit ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{t("paidNow")}</span>
                    <b>{paidLabel}</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{t("remaining")}</span>
                    <b>{formatMoneyEUR(locale, order.remainingAmount ?? 0)}</b>
                  </div>
                </>
              ) : null}
            </div>

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

            <p className="text-xs text-slate-500">{t("nextStepsHint")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}