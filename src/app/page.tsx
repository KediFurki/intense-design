import { auth } from "@/auth";
import { db } from "@/server/db";
import { products, categories, favorites } from "@/server/db/schema"; // favorites eklendi
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/product-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // 1. Ürünleri Çek
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

  // 2. Kullanıcının Favorilerini Çek (Eğer giriş yapmışsa)
  let userFavorites: string[] = [];
  if (session?.user) {
    const favs = await db.select({ pid: favorites.productId }).from(favorites).where(eq(favorites.userId, session.user.id));
    userFavorites = favs.map(f => f.pid);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* HERO SECTION */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000')] bg-cover bg-center" />
        <div className="container mx-auto px-4 py-32 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Redefine Your Space</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">Premium furniture designed for modern living.</p>
          <div className="flex justify-center gap-4">
            <Link href="/category/all"><Button size="lg" className="text-lg px-8 py-6 rounded-full cursor-pointer">Shop Now</Button></Link>
            <Link href="/about"><Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full bg-transparent text-white border-white hover:bg-white hover:text-slate-900 cursor-pointer">Our Story</Button></Link>
          </div>
        </div>
      </section>

      {/* KATEGORİLER */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allCategories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200 block cursor-pointer">
                    {cat.image && <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${cat.image})`}} />}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-xl tracking-wide group-hover:scale-110 transition-transform">{cat.name}</span>
                    </div>
                </Link>
            ))}
        </div>
      </section>

      {/* YENİ GELENLER */}
      <main className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">New Arrivals</h2>
            <Link href="/category/new" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">View All <ArrowRight size={16} /></Link>
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
                isFavorited={userFavorites.includes(product.id)} // <-- ARTIK GÖNDERİLİYOR
                description={product.description}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 bg-slate-100 rounded-xl">No products found.</div>
        )}
      </main>
    </div>
  );
}