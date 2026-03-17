import { auth, signOut } from "@/auth";
import { Link, redirect } from "@/lib/i18n/routing";
import { db } from "@/server/db";
import { orders, users, addresses } from "@/server/db/schema";
import {
  getOrderStatusBadges,
  getOrderStatusHint,
  type OrderStatusTranslator,
} from "@/lib/orders/status-ui";
import { normalizeOrderUiInput } from "@/lib/orders/normalize-order-ui";
import { eq, desc } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Heart, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { AddressDialog } from "@/components/account/address-dialog";
import { AddressCard } from "@/components/account/address-card";
import { ProductCard } from "@/components/shop/product-card";
import { getTranslations } from "next-intl/server";
import { getLocaleValue, type LocalizedText } from "@/lib/i18n/get-locale-value";

type RouteParams = { locale: string };

function formatMoneyEUR(locale: string, cents: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((cents ?? 0) / 100);
}

function formatDateTime(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

async function handleSignOut() {
  "use server";

  await signOut();
}

export default async function AccountPage({
  params,
}: Readonly<{
  params: Promise<RouteParams>;
}>) {
  const { locale } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
    return null;
  }

  if (!session.user.id) return null;

  const t = await getTranslations("Account");
  const orderStatusT = await getTranslations("OrderStatus");
  const tOrderStatus: OrderStatusTranslator = (key, values) => orderStatusT(key, values);

  const userProfile = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: {
      favorites: {
        with: {
          product: {
            with: { category: true },
          },
        },
      },
      orders: {
        orderBy: [desc(orders.createdAt)],
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!userProfile) return null;

  const userAddresses = await db.query.addresses.findMany({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.createdAt)],
    columns: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  });

  const customerName = userProfile.name || session.user.name || session.user.email || "";
  const customerInitial = customerName.charAt(0).toUpperCase() || "I";

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-[linear-gradient(135deg,#fffaf3_0%,#f7efe3_55%,#efe3d2_100%)] shadow-[0_32px_80px_-48px_rgba(120,91,60,0.45)]">
          <div className="flex flex-col gap-8 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-10">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                <UserRound className="size-3.5" />
                {t("title")}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-3 text-lg text-stone-700">
                {t("welcome")}, <span className="font-semibold text-stone-900">{customerName}</span>
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-end">
              <div className="flex items-center gap-4 rounded-[28px] border border-white/70 bg-white/85 px-5 py-4 shadow-sm backdrop-blur">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#f2e5d3] text-2xl font-semibold text-[#8b5e34]">
                  {customerInitial}
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-base font-semibold text-stone-900">{customerName}</p>
                  <p className="text-sm text-stone-600">{userProfile.email}</p>
                </div>
              </div>

              <form action={handleSignOut}>
                <Button type="submit" variant="outline" className="h-11 rounded-full border-stone-300 bg-white/90 px-5 text-stone-700 hover:bg-white">
                  <LogOut className="mr-2 size-4" />
                  {t("logout")}
                </Button>
              </form>
            </div>
          </div>
        </section>

        <Tabs defaultValue="orders" className="mt-8 space-y-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-[24px] border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <TabsTrigger value="orders" className="min-h-11 gap-2 rounded-full px-4 text-sm data-[state=active]:bg-stone-900 data-[state=active]:text-white data-[state=active]:shadow-none">
              <Package size={16} /> {t("orders")}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="min-h-11 gap-2 rounded-full px-4 text-sm data-[state=active]:bg-stone-900 data-[state=active]:text-white data-[state=active]:shadow-none">
              <Heart size={16} /> {t("tabFavorites")}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="min-h-11 gap-2 rounded-full px-4 text-sm data-[state=active]:bg-stone-900 data-[state=active]:text-white data-[state=active]:shadow-none">
              <MapPin size={16} /> {t("addresses")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="rounded-[28px] border border-stone-100 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{t("orders")}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{t("description")}</p>
              </div>

              {userProfile.orders.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center text-stone-500">
                  {t("noOrders")}
                </div>
              ) : (
                <div className="space-y-4">
                  {userProfile.orders.map((order) => {
                    const ui = normalizeOrderUiInput({
                      status: order.status,
                      paymentStatus: order.paymentStatus,
                      paymentMethod: order.paymentMethod,
                      paymentDueAt: order.paymentDueAt,
                      remainingAmount: order.remainingAmount,
                      depositPercent: order.depositPercent,
                    });

                    const badges = getOrderStatusBadges(ui, tOrderStatus, (date) => formatDateTime(locale, date));
                    const hint = getOrderStatusHint(
                      ui,
                      tOrderStatus,
                      (date) => formatDateTime(locale, date),
                      (cents) => formatMoneyEUR(locale, cents)
                    );

                    return (
                      <Card key={order.id} className="overflow-hidden rounded-[24px] border border-stone-100 bg-white shadow-sm">
                        <CardHeader className="border-b border-stone-100 bg-stone-50/80 px-5 py-5 sm:px-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                                {t("orderPrefix")} {order.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-stone-600">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString(locale) : ""}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {badges.map((badge) => (
                                  <Badge key={`${badge.variant}:${badge.label}`} variant={badge.variant} className="whitespace-nowrap">
                                    {badge.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 text-left lg:items-end lg:text-right">
                              <p className="text-xl font-semibold text-stone-900">
                                {formatMoneyEUR(locale, order.totalAmount)}
                              </p>
                              {hint ? (
                                <p className="max-w-sm text-sm leading-6 text-stone-500 lg:max-w-xs">
                                  {hint}
                                </p>
                              ) : null}
                              <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50">
                                <Link href={`/account/orders/${order.id}`}>
                                  {t("viewDetails")}
                                  <ArrowUpRight className="ml-2 size-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3 px-5 py-5 sm:px-6">
                          {order.items.map((item) => {
                            const productName = item.product?.name
                              ? getLocaleValue(item.product.name as LocalizedText, locale)
                              : t("unknownProduct");

                            return (
                              <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                                <span className="text-stone-700">
                                  {productName} <span className="text-stone-400">x{item.quantity}</span>
                                </span>
                                <span className="font-medium text-stone-900">
                                  {formatMoneyEUR(locale, item.price * item.quantity)}
                                </span>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <div className="rounded-[28px] border border-stone-100 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{t("tabFavorites")}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {userProfile.favorites.length === 0 ? t("noFavorites") : t("favoritesSummary", { count: userProfile.favorites.length })}
                </p>
              </div>

              {userProfile.favorites.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center text-stone-500">
                  {t("noFavorites")}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {userProfile.favorites.map((favorite) => {
                    const product = favorite.product;
                    if (!product) return null;

                    return (
                      <ProductCard
                        key={favorite.productId}
                        id={product.id}
                        name={product.name}
                        slug={product.slug}
                        description={product.description}
                        price={product.price}
                        stock={product.stock}
                        categoryName={product.category?.name ?? null}
                        imageUrl={product.images?.[0] || null}
                        isFavorited={true}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-4">
            <Card className="rounded-[28px] border border-stone-100 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-4 border-b border-stone-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-stone-900">{t("addresses")}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6 text-stone-600">{t("addressesDesc")}</CardDescription>
                </div>
                <AddressDialog />
              </CardHeader>

              <CardContent className="px-6 py-6">
                {userAddresses.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center text-stone-500">
                    {t("noAddresses")}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {userAddresses.map((addr) => (
                      <AddressCard
                        key={addr.id}
                        addr={{
                          id: addr.id,
                          title: addr.title,
                          address: addr.address,
                          city: addr.city,
                          state: addr.state ?? "",
                          zipCode: addr.zipCode,
                          country: addr.country,
                          firstName: addr.firstName ?? null,
                          lastName: addr.lastName ?? null,
                          email: addr.email ?? null,
                          phone: addr.phone ?? null,
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}