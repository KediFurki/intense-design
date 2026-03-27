import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { XCircle, ArrowLeft, Home, ShoppingCart } from "lucide-react";
import { getOrderStatusBadges } from "@/lib/orders/status-ui";
import { normalizeOrderUiInput } from "@/lib/orders/normalize-order-ui";

type RouteParams = { locale: string };
type CancelSearchParams = { oid?: string };

export default async function CheckoutCancelPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<CancelSearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const oid = sp?.oid;

  const t = await getTranslations("CheckoutCancel");
  const orderStatusT = await getTranslations("OrderStatus");

  const order = oid
    ? await db.query.orders.findFirst({
        where: eq(orders.id, oid),
        columns: {
          id: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          paymentDueAt: true,
          remainingAmount: true,
          depositPercent: true,
        },
      })
    : null;

  const badges = order
    ? getOrderStatusBadges(
        normalizeOrderUiInput({
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          paymentDueAt: order.paymentDueAt,
          remainingAmount: order.remainingAmount,
          depositPercent: order.depositPercent,
        }),
        (k, values) => orderStatusT(k, values as Record<string, string | number>)
      )
    : [];

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Header icon */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg">
            <XCircle className="size-10 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#4e3629] sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-[#8b6a52]">{t("desc")}</p>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white shadow-lg">
          {oid && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfce] px-6 py-5">
              <div className="text-sm text-[#8b6a52]">
                {t("orderId")} <span className="font-semibold text-[#4e3629]">{oid}</span>
              </div>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, idx) => (
                    <Badge key={idx} variant={b.variant} className="whitespace-nowrap rounded-full">
                      {b.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {!oid && (
            <div className="border-b border-[#eadfce]/60 bg-[#fffaf3] px-6 py-4">
              <p className="text-sm text-[#8b6a52]">{t("missingOrderId")}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button asChild className="h-12 rounded-2xl bg-[#6f4e37] text-white shadow-sm hover:bg-[#5d412e]">
                <Link locale={locale} href="/checkout">
                  <ArrowLeft className="mr-2 size-4" />
                  {t("returnCheckout")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-12 rounded-2xl border-[#eadfce] text-[#5c4330] hover:bg-[#fff4e8]">
                <Link locale={locale} href="/category/all">
                  <ShoppingCart className="mr-2 size-4" />
                  {t("backHome")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-12 rounded-2xl border-[#eadfce] text-[#5c4330] hover:bg-[#fff4e8]">
                <Link locale={locale} href="/">
                  <Home className="mr-2 size-4" />
                  {t("continueShopping")}
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-[#b08f74]">{t("hint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}