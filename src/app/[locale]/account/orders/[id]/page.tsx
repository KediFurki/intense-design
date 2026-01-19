import { auth } from "@/auth";
import { redirect, Link } from "@/lib/i18n/routing";
import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { getLocaleValue, type LocalizedText } from "@/lib/i18n/get-locale-value";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  getOrderStatusBadges,
  getOrderStatusHint,
  type OrderStatusTranslator,
} from "@/lib/orders/status-ui";
import { normalizeOrderUiInput } from "@/lib/orders/normalize-order-ui";

type RouteParams = { locale: string; id: string };

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

function paymentLabel(method: string, t: (k: string) => string): string {
  if (method === "iban") return t("payIban");
  if (method === "stripe") return t("payStripe");
  if (method === "cash_on_installation") return t("payInstall");
  return method;
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<RouteParams> | RouteParams;
}) {
  const { locale, id } = await Promise.resolve(params);

  const session = await auth();
  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations("OrderDetails");
  const orderStatusT = await getTranslations("OrderStatus");

  const tOrderStatus: OrderStatusTranslator = (key, values) =>
    orderStatusT(key, values);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    columns: {
      id: true,
      userId: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      country: true,
      state: true,
      city: true,
      address: true,
      zipCode: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      totalAmount: true,
      depositPercent: true,
      remainingAmount: true,
      paymentDueAt: true,
      createdAt: true,
    },
  });

  if (!order || order.userId !== session.user.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border rounded-lg p-6">
          {t("notFound")}
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

  const badges = getOrderStatusBadges(
    ui,
    tOrderStatus,
    (d) => formatDateTime(locale, d)
  );

  const hint = getOrderStatusHint(
    ui,
    tOrderStatus,
    (d) => formatDateTime(locale, d),
    (cents) => formatMoneyEUR(cents)
  );

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, order.id),
    columns: {
      id: true,
      productId: true,
      variantName: true,
      price: true,
      quantity: true,
    },
  });

  // N+1 bitti: ürünleri toplu çekiyoruz
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const productRows =
    productIds.length === 0
      ? []
      : await db
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(inArray(products.id, productIds));

  const nameById = new Map<string, LocalizedText | null>();
  for (const p of productRows) {
    // Drizzle JSON tipini burada LocalizedText olarak kullanıyoruz (any yok).
    nameById.set(p.id, (p.name ?? null) as unknown as LocalizedText | null);
  }

  const enriched = items.map((it) => {
    const lt = nameById.get(it.productId) ?? null;
    const name = lt ? getLocaleValue(lt, locale) : it.productId;
    return {
      id: it.id,
      name,
      variantName: it.variantName ?? "",
      quantity: it.quantity,
      unitPrice: it.price,
      lineTotal: it.price * it.quantity,
    };
  });

  const beneficiary =
    process.env.NEXT_PUBLIC_COMPANY_BENEFICIARY || "Intense Design";
  const iban = process.env.NEXT_PUBLIC_COMPANY_IBAN || "IBAN_NOT_SET";

  const addressLine = `${order.address}, ${order.zipCode} ${order.city}${
    order.state ? `, ${order.state}` : ""
  }, ${order.country}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>

            <div className="text-slate-600 text-sm">
              {t("orderId")} <span className="font-semibold">{order.id}</span>
            </div>

            {order.createdAt ? (
              <div className="text-slate-500 text-xs">
                {t("createdAt")} {formatDateTime(locale, order.createdAt)}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {badges.map((b) => (
                <Badge
                  key={`${b.variant}:${b.label}`}
                  variant={b.variant}
                  className="whitespace-nowrap"
                >
                  {b.label}
                </Badge>
              ))}
              <Badge variant="outline">
                {paymentLabel(String(order.paymentMethod), t)}
              </Badge>
            </div>

            {hint ? (
              <div className="text-xs text-slate-500 pt-1">{hint}</div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:min-w-[420px]">
            <Button asChild variant="outline" className="w-full">
              <Link href="/account" locale={locale}>
                {t("backAccount")}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/account" locale={locale}>
                {t("myOrders")}
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/" locale={locale}>
                {t("continueShopping")}
              </Link>
            </Button>
          </div>
        </div>

        {/* ADDRESS + CONTACT */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("deliveryAddress")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              <div className="font-medium">{addressLine}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("contact")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-1">
              <div className="font-medium">{order.customerName}</div>
              <div className="text-slate-600">{order.customerEmail}</div>
              <div className="text-slate-600">{order.customerPhone}</div>
            </CardContent>
          </Card>
        </div>

        {/* ITEMS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("items")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enriched.map((x) => (
              <div key={x.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {x.name}
                    </div>
                    {x.variantName ? (
                      <div className="text-xs text-slate-500 mt-1">
                        {x.variantName}
                      </div>
                    ) : null}
                    <div className="text-xs text-slate-500 mt-2">
                      {t("qty")} {x.quantity}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm text-slate-600">
                      {formatMoneyEUR(x.unitPrice)}
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {formatMoneyEUR(x.lineTotal)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{t("total")}</span>
              <span>{formatMoneyEUR(order.totalAmount)}</span>
            </div>

            {/* PAYMENT BLOCKS */}
            {String(order.paymentMethod) === "iban" ? (
              <div className="mt-2 rounded-xl border bg-slate-50 p-4 text-sm space-y-1">
                <div className="font-semibold text-slate-900">
                  {t("ibanBlockTitle")}
                </div>
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
                  <b>{t("amount")}:</b> {formatMoneyEUR(order.totalAmount)}
                </div>
                {order.paymentDueAt ? (
                  <div>
                    <b>{t("due")}:</b> {formatDateTime(locale, order.paymentDueAt)}
                  </div>
                ) : null}
              </div>
            ) : String(order.paymentMethod) === "cash_on_installation" ? (
              <div className="mt-2 rounded-xl border bg-slate-50 p-4 text-sm space-y-1">
                <div className="font-semibold text-slate-900">
                  {t("installBlockTitle")}
                </div>
                <div>
                  <b>{t("remaining")}:</b> {formatMoneyEUR(order.remainingAmount ?? 0)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}