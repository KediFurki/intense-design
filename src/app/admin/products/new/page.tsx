import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { ProductForm } from "@/components/admin/product-form"; // Yeni bileşeni import et

export default async function NewProductPage() {
  // Server Side: Kategorileri çek
  const categoryList = await db.select().from(categories);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground">Add a new furniture item to your catalog.</p>
      </div>

      {/* Logic artık bu bileşenin içinde */}
      <ProductForm categories={categoryList} />
    </div>
  );
}