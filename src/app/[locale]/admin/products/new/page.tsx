import ProductForm from "@/components/admin/product-form";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";

export default async function NewProductPage() {
  const allCategories = await db.select().from(categories);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProductForm categories={allCategories} initialData={null} />
    </div>
  );
}