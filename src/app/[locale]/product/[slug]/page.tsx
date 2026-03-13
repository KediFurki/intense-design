import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/shop/product-details";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: Readonly<ProductPageProps>) {
  const { slug } = await params;

  // Ürünü, kategorisini ve varyasyonlarını çek
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { 
        category: true,
        variants: true 
    },
  });

  if (!product) notFound();

  // TIP DÜZELTMESİ:
  // 1. Veritabanından 'null' gelebilen category'yi 'undefined'a çeviriyoruz.
  // 2. 'variants' verisini ayırıp temiz bir product nesnesi oluşturuyoruz.
  const { variants, category, ...rest } = product;
  
  const formattedProduct = {
    ...rest,
    material: product.material || null,
    category: category || undefined, // null ise undefined yap
    // variants dizisi zaten aşağıda ayrı prop olarak gönderiliyor
  };

  return (
    <div className="container mx-auto px-4 py-10">
        <ProductDetails product={formattedProduct} variants={variants} />
    </div>
  );
}