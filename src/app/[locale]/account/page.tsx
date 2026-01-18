import { auth } from "@/auth";
import { redirect } from "@/lib/i18n/routing";
import { db } from "@/server/db";
import { orders, users, addresses } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package, MapPin, User, Heart } from "lucide-react";
import { AddressDialog } from "@/components/account/address-dialog";
import { AddressCard } from "@/components/account/address-card";
import { ProductCard } from "@/components/shop/product-card";
import { getTranslations } from "next-intl/server";
import { getLocaleValue, type LocalizedText } from "@/lib/i18n/get-locale-value";

type RouteParams = { locale: string };

export default async function AccountPage({
  params,
}: {
  params: Promise<RouteParams> | RouteParams;
}) {
  const { locale } = await Promise.resolve(params);

  const session = await auth();

  if (!session || !session.user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations("Account");

  if (!session.user.id) return null;

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

  // Addresses: ayrı query (sıralama garanti)
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
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500">{t("description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            {userProfile.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{userProfile.name}</p>
            <p className="text-sm text-slate-500">{userProfile.email}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <Package size={16} /> {t("tabOrders")}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart size={16} /> {t("tabFavorites")}
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2">
            <MapPin size={16} /> {t("tabAddresses")}
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User size={16} /> {t("tabProfile")}
          </TabsTrigger>
        </TabsList>

        {/* ORDERS */}
        <TabsContent value="orders" className="space-y-4">
          {userProfile.orders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {t("noOrders")}
              </CardContent>
            </Card>
          ) : (
            userProfile.orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="bg-slate-50/50 border-b py-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">
                        {t("orderPrefix")} {order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="capitalize mb-1">{order.status}</Badge>
                      <p className="font-bold">
                        €{(order.totalAmount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2">
                  {order.items.map((item) => {
                    const productName = item.product?.name
                      ? getLocaleValue(
                          item.product.name as LocalizedText,
                          locale
                        )
                      : t("unknownProduct");

                    return (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {productName}{" "}
                          <span className="text-slate-400">
                            x{item.quantity}
                          </span>
                        </span>
                        <span>
                          €{((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* FAVORITES */}
        <TabsContent value="favorites">
          {userProfile.favorites.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
              {t("noFavorites")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {userProfile.favorites.map((fav) => {
                const p = fav.product;
                if (!p) return null;

                return (
                  <ProductCard
                    key={fav.productId}
                    id={p.id}
                    name={p.name as LocalizedText}
                    slug={p.slug}
                    description={p.description as LocalizedText}
                    price={p.price}
                    stock={p.stock}
                    categoryName={(p.category?.name as LocalizedText) ?? null}
                    imageUrl={p.images?.[0] || null}
                    isFavorited={true}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ADDRESSES */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle>{t("savedAddresses")}</CardTitle>
                <CardDescription>{t("addressesDesc")}</CardDescription>
              </div>
              <AddressDialog />
            </CardHeader>

            <CardContent>
              {userAddresses.length === 0 ? (
                <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-xl">
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
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>{t("fullName")}</Label>
                <Input defaultValue={userProfile.name || ""} disabled />
              </div>
              <div className="grid gap-2">
                <Label>{t("email")}</Label>
                <Input defaultValue={userProfile.email ?? ""} disabled />
              </div>
              <Button>{t("saveChanges")}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}