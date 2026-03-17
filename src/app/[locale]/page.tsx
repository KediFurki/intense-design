import { auth } from "@/auth";
import { db } from "@/server/db";
import { products, categories, favorites } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/product-card";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLocaleValue } from "@/lib/i18n/get-locale-value";

export default async function Home({
  params,
}: Readonly<{
  params: Promise<{ locale: string }> | { locale: string };
}>) {
  const { locale } = await Promise.resolve(params);

  const session = await auth();
  const t = await getTranslations("Home");

  const latestProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      image: products.images,
      categoryName: categories.name,
      description: products.description,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt))
    .limit(8);

  const allCategories = await db.select().from(categories);

  let userFavorites: string[] = [];
  if (session?.user) {
    const favs = await db.select({ pid: favorites.productId }).from(favorites).where(eq(favorites.userId, session.user.id));
    userFavorites = favs.map((f) => f.pid);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/85 via-stone-900/60 to-amber-950/35" />
        <div className="container relative z-10 mx-auto px-4 py-28 text-center sm:px-6 md:py-36">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-stone-50 md:text-7xl">{t("redefineSpace")}</h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-8 text-stone-200 md:text-xl">{t("heroSubtitle")}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/category/all"><Button size="lg" className="cursor-pointer rounded-full bg-stone-100 px-8 py-6 text-lg text-stone-900 hover:bg-stone-200">{t("shopCollection")}</Button></Link>
            <Link href="/category/all"><Button size="lg" variant="outline" className="cursor-pointer rounded-full border-stone-200 bg-transparent px-8 py-6 text-lg text-white hover:bg-stone-100 hover:text-stone-900">{t("experience3D")}</Button></Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="mb-8 text-2xl font-bold text-stone-900">{t("featuredProducts")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative block aspect-4/3 overflow-hidden rounded-2xl bg-stone-200 shadow-[0_20px_40px_-24px_rgba(68,64,60,0.55)] cursor-pointer"
            >
              {cat.image && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cat.image})` }} />}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-xl tracking-wide group-hover:scale-110 transition-transform">
                  {getLocaleValue(cat.name, locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <main className="container mx-auto px-4 pb-24 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900">{t("newArrivals")}</h2>
          <Link href="/category/new" className="flex items-center gap-1 font-medium text-amber-800 transition-colors hover:text-amber-900">
            {t("viewAll")} <ArrowRight size={16} />
          </Link>
        </div>

        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                stock={product.stock}
                categoryName={product.categoryName}
                imageUrl={product.image ? product.image[0] : null}
                isFavorited={userFavorites.includes(product.id)}
                description={product.description}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-stone-100 py-20 text-center text-stone-500">{t("noProductsFound")}</div>
        )}
      </main>
    </div>
  );
}