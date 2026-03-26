"use server";

import { db } from "@/server/db";
import { products, productVariants } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

/* ─── Zod Schemas ─── */
const localizedSchema = z.object({
  en: z.string(),
  tr: z.string(),
  de: z.string(),
  bg: z.string(),
});

const variantInputSchema = z.object({
  id: z.string().optional(),
  names: z.object({
    en: z.string(),
    tr: z.string(),
    de: z.string(),
    bg: z.string(),
  }),
  price: z.number().min(0),
  stock: z.number().min(0),
  images: z.array(z.string()),
  attributes: z.object({
    color: z.string().regex(/^#/, "Must be a hex color"),
  }).passthrough(),
});

const productInputSchema = z.object({
  name: localizedSchema.extend({ en: z.string().min(1) }),
  description: localizedSchema,
  longDescription: localizedSchema,
  slug: z.string().min(1),
  price: z.number().min(0),
  stock: z.number().min(0),
  categoryId: z.string().min(1),
  type: z.enum(["furniture", "sofa", "bed", "kitchen", "lighting", "decoration"]),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  depth: z.number().nullable().optional(),
  images: z.array(z.string()),
  modelUrl: z.string().nullable().optional(),
  maskImage: z.string().nullable().optional(),
  variants: z.array(variantInputSchema),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export async function createProduct(input: ProductInput) {
  const validated = productInputSchema.safeParse(input);
  if (!validated.success) {
    console.error("Validation Error:", validated.error.issues);
    return { success: false, error: "Validation failed" };
  }
  const data = validated.data;

  try {
    const [newProduct] = await db.insert(products).values({
      name: data.name as Record<string, string>,
      description: data.description as Record<string, string>,
      longDescription: data.longDescription as Record<string, string>,
      slug: data.slug,
      price: Math.round(data.price * 100),
      stock: data.stock,
      categoryId: data.categoryId,
      type: data.type,
      width: data.width ?? null,
      height: data.height ?? null,
      depth: data.depth ?? null,
      images: data.images,
      modelUrl: data.modelUrl ?? null,
      maskImage: data.maskImage ?? null,
    }).returning();

    if (data.variants.length > 0) {
      await db.insert(productVariants).values(
        data.variants.map((v) => ({
          productId: newProduct.id,
          name: v.names as Record<string, string>,
          price: Math.round(v.price * 100),
          stock: v.stock,
          images: v.images,
          attributes: v.attributes,
        }))
      );
    }
    revalidatePath("/admin/products");
  } catch (error) {
    console.error("DB Error:", error);
    return { success: false, error: "DB Error" };
  }
  redirect("/admin/products");
}

export async function updateProduct(id: string, input: ProductInput) {
  const validated = productInputSchema.safeParse(input);
  if (!validated.success) return { success: false, error: "Validation failed" };
  const data = validated.data;

  try {
    await db.update(products).set({
      name: data.name as Record<string, string>,
      description: data.description as Record<string, string>,
      longDescription: data.longDescription as Record<string, string>,
      slug: data.slug,
      price: Math.round(data.price * 100),
      stock: data.stock,
      categoryId: data.categoryId,
      type: data.type,
      width: data.width ?? null,
      height: data.height ?? null,
      depth: data.depth ?? null,
      images: data.images,
      modelUrl: data.modelUrl ?? null,
      maskImage: data.maskImage ?? null,
      updatedAt: new Date(),
    }).where(eq(products.id, id));

    await db.delete(productVariants).where(eq(productVariants.productId, id));

    if (data.variants.length > 0) {
      await db.insert(productVariants).values(
        data.variants.map((v) => ({
          productId: id,
          name: v.names as Record<string, string>,
          price: Math.round(v.price * 100),
          stock: v.stock,
          images: v.images,
          attributes: v.attributes,
        }))
      );
    }
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/product/${data.slug}`);
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Update failed" };
  }
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { success: false, error: "Delete failed" };
  }
}