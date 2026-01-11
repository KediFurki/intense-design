import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categoryList = await db.select().from(categories).orderBy(desc(categories.createdAt));

  return (
    <CategoryManager initialCategories={categoryList} />
  );
}