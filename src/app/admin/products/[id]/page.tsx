import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/product-form";
import { notFound } from "next/navigation";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  // 1. Kategorileri Çek
  const categoryList = await db.select().from(categories);

  // 2. Ürünü Çek (findById)
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) {
    notFound(); // 404 Sayfası
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product details.</p>
      </div>

      {/* Formu "initialData" ile çağırıyoruz */}
      <ProductForm categories={categoryList} initialData={product} />
    </div>
  );
}