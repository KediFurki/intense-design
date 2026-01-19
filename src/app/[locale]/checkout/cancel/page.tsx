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
type CancelSearchParams = { oid?: string };

type OrderMiniRow = {
  id: string;
  status: string | null;
  paymentMethod: "stripe" | "iban" | "cash_on_installation" | null;
  paymentStatus: "awaiting_payment" | "paid" | "deposit_paid" | "remaining_due" | "cancelled" | null;
};

export default async function CheckoutCancelPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams> | RouteParams;
  searchParams: Promise<CancelSearchParams> | CancelSearchParams;
}) {
  const { locale } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams);
  const oid = sp?.oid;

  const t = await getTranslations("CheckoutCancel");

  const order: OrderMiniRow | null = oid
    ? (((await db.query.orders.findFirst({
        where: eq(orders.id, oid),
        columns: {
          id: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      })) as OrderMiniRow | undefined) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="text-slate-700">{t("cancelIntro")}</div>

            {oid ? (
              <>
                <div className="text-slate-700">
                  {t("orderId")} <b>{oid}</b>
                </div>

                {order ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="capitalize">{String(order.status ?? "")}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {String(order.paymentStatus ?? "")}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {String(order.paymentMethod ?? "")}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">{t("orderNotFoundHint")}</div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-500">{t("missingOrderId")}</div>
            )}

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button asChild className="w-full h-11">
                <Link locale={locale} href="/checkout">
                  {t("returnToCheckout")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-11">
                <Link locale={locale} href="/cart">
                  {t("backToCart")}
                </Link>
              </Button>

              <Button asChild variant="secondary" className="w-full h-11">
                <Link locale={locale} href="/">
                  {t("continueShopping")}
                </Link>
              </Button>
            </div>

            <p className="text-xs text-slate-500">{t("retryHint")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}