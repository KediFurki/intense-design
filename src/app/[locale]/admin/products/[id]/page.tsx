import ProductForm from "@/components/admin/product-form";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  // Ürünü ve Varyasyonlarını çek
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: true // <-- Varyasyonları dahil et
    }
  });
  
  const allCategories = await db.select().from(categories);

  return (
    <div>
       <ProductForm initialData={product} categories={allCategories} />
    </div>
  );
}