"use server";

import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
  };

  const validated = categorySchema.safeParse(rawData);
  if (!validated.success) return { success: false, error: "Invalid data" };

  try {
    await db.insert(categories).values({
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description || "",
      image: validated.data.image || null,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    return { success: false, error: "Creation failed" };
  }
}

// YENİ: GÜNCELLEME AKSİYONU
export async function updateCategory(id: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
  };

  const validated = categorySchema.safeParse(rawData);
  if (!validated.success) return { success: false, error: "Invalid data" };

  try {
    await db.update(categories)
      .set({
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description || "",
        image: validated.data.image || null,
      })
      .where(eq(categories.id, id));
      
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Deletion failed" };
  }
}