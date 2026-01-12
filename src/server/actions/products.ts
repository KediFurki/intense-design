"use server";

import { db } from "@/server/db";
import { products, productVariants } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// DÜZELTME: any yerine tam şema tanımı
const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().min(0).default(0),
  images: z.array(z.string()).optional().default([]),
  modelUrl: z.string().optional().nullable(),
  color: z.string().optional().default(""),
  colorCode: z.string().optional().default(""),
  size: z.string().optional().default(""),
  material: z.string().optional().default(""),
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().default(""),
  longDescription: z.string().optional().default(""),
  price: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  stock: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  categoryId: z.string().optional().nullable().transform(v => v === "" ? null : v),
  images: z.array(z.string()).optional().default([]),
  modelUrl: z.string().optional().nullable(),
  maskImage: z.string().optional().nullable(),
  width: z.preprocess((val) => Number(val) || null, z.number().nullable()),
  height: z.preprocess((val) => Number(val) || null, z.number().nullable()),
  depth: z.preprocess((val) => Number(val) || null, z.number().nullable()),
  variants: z.array(variantSchema).optional().default([]) // DÜZELTME: any[] yerine variantSchema[]
});

export async function createProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const images = rawData.images ? JSON.parse(rawData.images as string) : [];
  const variants = rawData.variants ? JSON.parse(rawData.variants as string) : [];

  const validatedFields = productSchema.safeParse({ ...rawData, images, variants });

  if (!validatedFields.success) {
    console.error("❌ CREATE ERROR:", validatedFields.error.flatten());
    return { success: false, error: "Validation failed" };
  }

  const { variants: variantList, ...productData } = validatedFields.data;

  try {
    const [newProduct] = await db.insert(products).values(productData).returning();
    if (variantList.length > 0) {
      // DÜZELTME: v: any kaldırıldı, Zod tipi kullanılıyor
      await db.insert(productVariants).values(variantList.map((v) => ({
          productId: newProduct.id,
          name: [v.color, v.size].filter(Boolean).join(" / ") || "Standard",
          price: (Number(v.price) || 0) * 100,
          stock: Number(v.stock) || 0,
          images: v.images || [],
          modelUrl: v.modelUrl || null,
          attributes: { color: v.color, colorCode: v.colorCode, size: v.size, material: v.material }
      })));
    }
    revalidatePath("/admin/products");
  } catch (error) {
    console.error("DB Error:", error);
    return { success: false, error: "DB Error" };
  }
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const images = rawData.images ? JSON.parse(rawData.images as string) : [];
  const variants = rawData.variants ? JSON.parse(rawData.variants as string) : [];

  const validatedFields = productSchema.safeParse({ ...rawData, images, variants });

  if (!validatedFields.success) {
    console.error("❌ UPDATE ERROR:", validatedFields.error.flatten());
    return { success: false, error: "Validation failed" };
  }

  const { variants: variantList, ...productData } = validatedFields.data;

  try {
    await db.update(products).set({ ...productData, updatedAt: new Date() }).where(eq(products.id, id));
    await db.delete(productVariants).where(eq(productVariants.productId, id));

    if (variantList.length > 0) {
      // DÜZELTME: v: any kaldırıldı
      await db.insert(productVariants).values(variantList.map((v) => ({
          productId: id,
          name: [v.color, v.size].filter(Boolean).join(" / ") || "Standard",
          price: (Number(v.price) || 0) * 100,
          stock: Number(v.stock) || 0,
          images: v.images || [],
          modelUrl: v.modelUrl || null,
          attributes: { color: v.color, colorCode: v.colorCode, size: v.size, material: v.material }
      })));
    }
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/product/${productData.slug}`);
  } catch (error) {
    console.error("DB Update Error:", error);
    return { success: false, error: "Update failed" };
  }
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/admin/products");
        return { success: true };
    } catch { return { success: false, error: "Delete failed" }; }
}