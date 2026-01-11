import { db } from "@/server/db";
import { products, categories, favorites } from "@/server/db/schema";
import { eq, and, gte, lte, gt, desc, asc, type SQL } from "drizzle-orm"; // gt (greater than) eklendi
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const session = await auth();

  // 1. Kategoriyi Bul
  let categoryId: string | undefined;
  let categoryName = "All Products";

  if (slug === "new") {
    categoryName = "New Arrivals";
  } else if (slug !== "all") {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    if (!category) notFound();
    categoryId = category.id;
    categoryName = category.name;
  }

  // 2. Filtreler
  const sort = search.sort || "newest";
  const minPrice = search.min ? Number(search.min) * 100 : 0;
  const maxPrice = search.max ? Number(search.max) * 100 : 1000000;
  const onlyInStock = search.instock === "true"; // Stok kontrolü

  // 3. Sorgu
  const whereConditions = [
    gte(products.price, minPrice),
    lte(products.price, maxPrice),
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    onlyInStock ? gt(products.stock, 0) : undefined, // <-- YENİ: Stok > 0
  ].filter((item): item is SQL => item !== undefined); 

  let orderBy;
  if (sort === "price_asc") orderBy = asc(products.price);
  else if (sort === "price_desc") orderBy = desc(products.price);
  else orderBy = desc(products.createdAt);

  const productsList = await db.query.products.findMany({
    where: and(...whereConditions),
    orderBy: orderBy,
    with: {
        category: true,
    }
  });

  // 4. Favoriler
  let userFavorites: string[] = [];
  if (session?.user) {
    const favs = await db.select({ pid: favorites.productId }).from(favorites).where(eq(favorites.userId, session.user.id));
    userFavorites = favs.map(f => f.pid);
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* ... (Header ve Diğer kısımlar AYNI KALIYOR) ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/" className="hover:text-slate-900">Home</Link> / <span className="text-slate-900 font-medium capitalize">{slug}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{categoryName}</h1>
            <p className="text-slate-500">{productsList.length} products found</p>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <div className="flex gap-2 text-sm font-medium">
                <Link href="?sort=newest" className={`px-3 py-1 rounded-md transition-colors ${sort === 'newest' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Newest</Link>
                <Link href="?sort=price_asc" className={`px-3 py-1 rounded-md transition-colors ${sort === 'price_asc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Price ↑</Link>
                <Link href="?sort=price_desc" className={`px-3 py-1 rounded-md transition-colors ${sort === 'price_desc' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Price ↓</Link>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="hidden lg:block">
            <FilterSidebar />
        </div>
        <div className="lg:col-span-3">
            {productsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productsList.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            name={product.name}
                            slug={product.slug}
                            price={product.price}
                            stock={product.stock}
                            categoryName={product.category?.name || ""}
                            imageUrl={product.images?.[0] || null}
                            isFavorited={userFavorites.includes(product.id)}
                            description={product.description}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50">
                    <p className="text-slate-500 text-lg">No products found matching your filters.</p>
                    <Link href="/category/all"><Button variant="link">Clear Filters</Button></Link>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}