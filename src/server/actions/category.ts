"use server";

import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const localizedStringSchema = z.object({
  en: z.string().min(1, "English name is required"),
  tr: z.string().optional().default(""),
  de: z.string().optional().default(""),
  bg: z.string().optional().default(""),
});

const localizedDescriptionSchema = z.object({
  en: z.string().optional().default(""),
  tr: z.string().optional().default(""),
  de: z.string().optional().default(""),
  bg: z.string().optional().default(""),
});

const categoryInputSchema = z.object({
  name: localizedStringSchema,
  description: localizedDescriptionSchema,
  slug: z.string().min(2),
  image: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export async function createCategory(input: CategoryInput) {
  const validated = categoryInputSchema.safeParse(input);
  if (!validated.success) return { success: false, error: "Invalid data" };

  try {
    await db.insert(categories).values({
      name: validated.data.name as Record<string, string>,
      description: validated.data.description as Record<string, string>,
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

export async function updateCategory(id: string, input: CategoryInput) {
  const validated = categoryInputSchema.safeParse(input);
  if (!validated.success) return { success: false, error: "Invalid data" };

  try {
    await db.update(categories)
      .set({
        name: validated.data.name as Record<string, string>,
        description: validated.data.description as Record<string, string>,
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