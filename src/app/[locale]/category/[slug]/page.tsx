import { db } from "@/server/db";
import { products, categories, favorites } from "@/server/db/schema";
import { eq, and, gte, lte, gt, desc, asc, type SQL } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { auth } from "@/auth";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getLocaleValue, type LocalizedText } from "@/lib/i18n/get-locale-value";
import { getTranslations } from "next-intl/server";
import { SlidersHorizontal } from "lucide-react";

type RouteParams = { locale: string; slug: string };
type RouteSearchParams = Record<string, string | undefined>;

function resolveOrderBy(sort: string) {
  if (sort === "price_asc") return asc(products.price);
  if (sort === "price_desc") return desc(products.price);

  return desc(products.createdAt);
}

function filterVisibleProducts<T extends { name: LocalizedText; description: LocalizedText; slug: string }>(
  productsList: T[],
  locale: string,
  normalizedQuery: string,
) {
  if (!normalizedQuery) return productsList;

  return productsList.filter((product) => {
    const localizedName = getLocaleValue(product.name, locale).toLowerCase();
    const localizedDescription = getLocaleValue(product.description, locale).toLowerCase();

    return localizedName.includes(normalizedQuery) || localizedDescription.includes(normalizedQuery) || product.slug.toLowerCase().includes(normalizedQuery);
  });
}

function createPreservedParams(searchParams: RouteSearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.length > 0 && key !== "sort") {
      params.set(key, value);
    }
  }

  return params;
}

function createSortHref(searchParams: URLSearchParams, nextSort: string) {
  const params = new URLSearchParams(searchParams);
  params.set("sort", nextSort);

  return `?${params.toString()}`;
}

async function resolveCategoryContext(slug: string, locale: string, t: Awaited<ReturnType<typeof getTranslations>>) {
  if (slug === "all") {
    return { categoryId: undefined, categoryTitle: t("all") };
  }

  if (slug === "new") {
    return { categoryId: undefined, categoryTitle: t("new") };
  }

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) notFound();

  return {
    categoryId: category.id,
    categoryTitle: getLocaleValue(category.name, locale),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<RouteParams>;
  searchParams: Promise<RouteSearchParams>;
}>) {
  const { slug, locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("Category");

  const session = await auth();
  const { categoryId, categoryTitle } = await resolveCategoryContext(slug, locale, t);

  const sort = sp.sort || "newest";
  const rawQuery = sp.q?.trim() ?? "";
  const normalizedQuery = rawQuery.toLowerCase();
  const minPrice = sp.min ? Number(sp.min) * 100 : 0;
  const maxPrice = sp.max ? Number(sp.max) * 100 : 1_000_000;
  const onlyInStock = sp.instock === "true";

  const whereConditions = [
    gte(products.price, minPrice),
    lte(products.price, maxPrice),
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    onlyInStock ? gt(products.stock, 0) : undefined,
  ].filter((item): item is SQL => item !== undefined);

  const orderBy = resolveOrderBy(sort);

  const productsList = await db.query.products.findMany({
    where: and(...whereConditions),
    orderBy,
    with: { category: true },
  });

  const visibleProducts = filterVisibleProducts(productsList, locale, normalizedQuery);
  const preservedParams = createPreservedParams(sp);
  const activeFilterCount = [sp.min || sp.max, sp.instock === "true"].filter(Boolean).length;

  const clearFiltersHref = rawQuery ? `/category/all?q=${encodeURIComponent(rawQuery)}` : "/category/all";

  let userFavorites: string[] = [];
  if (session?.user) {
    const favs = await db
      .select({ pid: favorites.productId })
      .from(favorites)
      .where(eq(favorites.userId, session.user.id));
    userFavorites = favs.map((f) => f.pid);
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:text-slate-900">
              {t("home")}
            </Link>{" "}
            / <span className="text-slate-900 font-medium capitalize">{slug}</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">{categoryTitle}</h1>
          <p className="text-slate-500">{t("productsFound", { count: visibleProducts.length })}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 rounded-full border-stone-300 bg-white text-slate-700 hover:bg-stone-50 lg:hidden">
                <SlidersHorizontal className="mr-2 size-4" />
                {t("openFilters")}
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-md overflow-y-auto bg-[#fffaf4] p-0">
              <SheetHeader className="border-b border-stone-200 px-6 py-5 text-left">
                <SheetTitle>{t("filterTitle")}</SheetTitle>
                <SheetDescription>{t("filterDescription")}</SheetDescription>
              </SheetHeader>
              <div className="p-4">
                <FilterSidebar />
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-sm text-slate-600">{t("sortBy")}</span>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <Link
              href={createSortHref(preservedParams, "newest")}
              className={`px-3 py-1 rounded-md transition-colors ${
                sort === "newest"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t("newest")}
            </Link>

            <Link
              href={createSortHref(preservedParams, "price_asc")}
              className={`px-3 py-1 rounded-md transition-colors ${
                sort === "price_asc"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t("priceAsc")}
            </Link>

            <Link
              href={createSortHref(preservedParams, "price_desc")}
              className={`px-3 py-1 rounded-md transition-colors ${
                sort === "price_desc"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t("priceDesc")}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="hidden lg:block">
          <FilterSidebar className="sticky top-24" />
        </div>

        <div className="lg:col-span-3">
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  stock={product.stock}
                  categoryName={product.category?.name ?? null}
                  imageUrl={product.images?.[0] || null}
                  isFavorited={userFavorites.includes(product.id)}
                  description={product.description}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50">
              <p className="text-slate-500 text-lg">{t("noProductsMatching")}</p>
              <Link href={clearFiltersHref}>
                <Button variant="link">{t("clearFilters")}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}