"use server";

import { db } from "@/server/db";
import { products, productVariants } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

type VariantInput = {
    id?: string;
    names: Record<string, string>;
    price: number;
    stock: number;
    images: string[];
    modelUrl?: string | null;
    attributes: Record<string, unknown>;
};

// DÜZELTME: Enum listesini Schema ile eşitledik
type ProductType = "furniture" | "sofa" | "bed" | "kitchen" | "lighting" | "decoration";

const variantSchema = z.object({
  id: z.string().optional(),
  names: z.any(), 
  price: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().min(0).default(0),
  images: z.array(z.string()).optional().default([]),
  modelUrl: z.string().optional().nullable(),
  attributes: z.any() 
});

const productSchema = z.object({
  slug: z.string().min(1),
  price: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  stock: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  categoryId: z.string().optional().nullable().transform(v => v === "" ? null : v),
  
  // DÜZELTME: Yeni tipleri ekledik
  type: z.enum(["furniture", "sofa", "bed", "kitchen", "lighting", "decoration"]).optional().default("furniture"),
  
  names: z.string().transform(str => JSON.parse(str)),
  descriptions: z.string().transform(str => JSON.parse(str)),
  longDescriptions: z.string().transform(str => JSON.parse(str)),
  
  images: z.string().transform(str => JSON.parse(str)),
  modelUrl: z.string().optional().nullable(),
  maskImage: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  width: z.preprocess((val) => Number(val) || null, z.number().nullable()),
  height: z.preprocess((val) => Number(val) || null, z.number().nullable()),
  depth: z.preprocess((val) => Number(val) || null, z.number().nullable()),
  
  variants: z.string().transform(str => JSON.parse(str))
});

export async function createProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validated = productSchema.safeParse(rawData);

  if (!validated.success) {
    console.error("Validation Error:", validated.error.issues);
    return { success: false, error: "Validation failed" };
  }
  const data = validated.data;

  try {
    const [newProduct] = await db.insert(products).values({
      name: data.names,
      description: data.descriptions || null,
      longDescription: data.longDescriptions || null,
      slug: data.slug,
      price: data.price * 100,
      stock: data.stock,
      categoryId: data.categoryId,
      type: data.type as ProductType, // Type Casting
      width: data.width || null,
      height: data.height || null,
      depth: data.depth || null,
      material: data.material || null,
      images: data.images || [],
      modelUrl: data.modelUrl || null,
      maskImage: data.maskImage || null
    }).returning();

    if (data.variants.length > 0) {
      await db.insert(productVariants).values(data.variants.map((v: VariantInput) => ({
          productId: newProduct.id,
          name: v.names,
          price: (Number(v.price) || 0) * 100,
          stock: Number(v.stock) || 0,
          images: v.images || [],
          attributes: v.attributes
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
  const validated = productSchema.safeParse(rawData);

  if (!validated.success) return { success: false, error: "Validation failed" };
  const data = validated.data;

  try {
    await db.update(products).set({
      name: data.names,
      description: data.descriptions || null,
      longDescription: data.longDescriptions || null,
      slug: data.slug,
      price: data.price * 100,
      stock: data.stock,
      categoryId: data.categoryId,
      type: data.type as ProductType,
      width: data.width || null,
      height: data.height || null,
      depth: data.depth || null,
      material: data.material || null,
      images: data.images || [],
      modelUrl: data.modelUrl || null,
      maskImage: data.maskImage || null,
      updatedAt: new Date()
    }).where(eq(products.id, id));

    await db.delete(productVariants).where(eq(productVariants.productId, id));

    if (data.variants.length > 0) {
      await db.insert(productVariants).values(data.variants.map((v: VariantInput) => ({
          productId: id,
          name: v.names,
          price: (Number(v.price) || 0) * 100,
          stock: Number(v.stock) || 0,
          images: v.images || [],
          attributes: v.attributes
      })));
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
    } catch { return { success: false, error: "Delete failed" }; }
}