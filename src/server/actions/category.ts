"use server";

import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  };

  const validated = categorySchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, error: "Invalid data. Check slug format." };
  }

  try {
    await db.insert(categories).values({
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description || "",
    });

    revalidatePath("/admin/categories");
    revalidatePath("/"); // Header'daki menü güncellensin
    return { success: true };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { success: false, error: "Category creation failed. Slug might be duplicate." };
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete category." };
  }
}