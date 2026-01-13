"use server";

import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Şema: İsim ve Açıklama artık JSON string olarak geliyor
const categorySchema = z.object({
  slug: z.string().min(2),
  image: z.string().optional(),
  // JSON.parse ile string'den objeye çeviriyoruz
  names: z.string().transform((str) => {
    try { return JSON.parse(str); } catch { return {}; }
  }),
  descriptions: z.string().transform((str) => {
    try { return JSON.parse(str); } catch { return {}; }
  }),
});

export async function createCategory(formData: FormData) {
  const rawData = {
    names: formData.get("names"),
    slug: formData.get("slug"),
    descriptions: formData.get("descriptions"),
    image: formData.get("image"),
  };

  const validated = categorySchema.safeParse(rawData);
  if (!validated.success) return { success: false, error: "Invalid data" };

  try {
    await db.insert(categories).values({
      name: validated.data.names,       // JSONB olarak kaydet
      description: validated.data.descriptions, // JSONB olarak kaydet
      slug: validated.data.slug,
      image: validated.data.image || null,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { success: false, error: "Creation failed" };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const rawData = {
    names: formData.get("names"),
    slug: formData.get("slug"),
    descriptions: formData.get("descriptions"),
    image: formData.get("image"),
  };

  const validated = categorySchema.safeParse(rawData);
  if (!validated.success) return { success: false, error: "Invalid data" };

  try {
    await db.update(categories)
      .set({
        name: validated.data.names,
        description: validated.data.descriptions,
        slug: validated.data.slug,
        image: validated.data.image || null,
      })
      .where(eq(categories.id, id));
      
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Update Category Error:", error);
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