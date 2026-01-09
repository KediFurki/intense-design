import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/product-card";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // Ürünleri çek (En yeniler en üstte)
  const latestProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      image: products.images,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. HEADER (Basit Üst Menü) */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900">
            Instant<span className="text-blue-600">Design</span>
          </Link>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-4">
                {session.user.role === "admin" && (
                   <Link href="/admin">
                     <Button variant="outline" size="sm">Admin Panel</Button>
                   </Link>
                )}
                <div className="flex items-center gap-2 text-sm font-medium">
                   <User size={16} />
                   {session.user.name}
                </div>
                <form action={async () => { "use server"; await signOut(); }}>
                  <Button variant="ghost" size="icon" title="Sign Out">
                    <LogOut size={18} />
                  </Button>
                </form>
              </div>
            ) : (
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (Karşılama Alanı) */}
      <section className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            Elevate Your Living Space
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Discover our handcrafted collection of premium furniture. 
            Designed for comfort, built for life.
          </p>
        </div>
      </section>

      {/* 3. PRODUCT GRID (Ürün Listesi) */}
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">New Arrivals</h2>
        
        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                categoryName={product.categoryName}
                imageUrl={product.image ? product.image[0] : null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            No products found. Please add some from the Admin Panel.
          </div>
        )}
      </main>
      
    </div>
  );
}