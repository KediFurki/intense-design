import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProductCard } from "@/components/shop/product-card";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import Header from "@/components/layout/header"; // Global Header eklendi

export default async function Home() {
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
      
      {/* NOT: Global Header artık layout.tsx içinde olduğu için 
          buradan <header> kısmını SİLDİK. Böylece çift header olmuyor.
      */}

      {/* HERO SECTION (Karşılama Alanı) */}
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

      {/* PRODUCT GRID (Ürün Listesi) */}
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