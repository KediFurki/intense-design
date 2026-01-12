"use server";

import { db } from "@/server/db";
import { products, productVariants } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  modelUrl: z.string().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  depth: z.coerce.number().optional(),
  // GÜNCELLEME: Varyasyon yapısı detaylandırıldı
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(), // Artık opsiyonel, biz oluşturacağız
    price: z.coerce.number().min(0),
    stock: z.coerce.number().min(0),
    image: z.string().optional().nullable(),
    // YENİ: Ayrı özellikler
    color: z.string().optional(),
    size: z.string().optional(),
    material: z.string().optional(),
  })).optional()
});

export async function createProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const images = rawData.images ? JSON.parse(rawData.images as string) : [];
  const variants = rawData.variants ? JSON.parse(rawData.variants as string) : [];

  const validatedFields = productSchema.safeParse({
    ...rawData,
    images: images,
    variants: variants
  });

  if (!validatedFields.success) {
    return { success: false, error: "Invalid fields" };
  }

  const { variants: variantList, ...productData } = validatedFields.data;

  try {
    const [newProduct] = await db.insert(products).values({
      name: productData.name,
      slug: productData.slug,
      description: productData.description ?? "",
      price: productData.price * 100,
      stock: productData.stock,
      categoryId: productData.categoryId ?? null,
      images: productData.images ?? [],
      modelUrl: productData.modelUrl ?? null,
      width: productData.width ?? null,
      height: productData.height ?? null,
      depth: productData.depth ?? null,
    }).returning();

    if (variantList && variantList.length > 0) {
      await db.insert(productVariants).values(
        variantList.map((v) => {
          // Otomatik İsim Oluşturma: "Kırmızı - XL - Kadife"
          const parts = [v.color, v.size, v.material].filter(Boolean);
          const fullName = parts.length > 0 ? parts.join(" / ") : "Standard";

          return {
            productId: newProduct.id,
            name: fullName, // Sepette görünecek isim
            price: v.price * 100,
            stock: v.stock,
            image: v.image || null,
            // JSON sütununa detayları kaydediyoruz
            attributes: {
                color: v.color || "",
                size: v.size || "",
                material: v.material || ""
            }
          };
        })
      );
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create product" };
  }

  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const images = rawData.images ? JSON.parse(rawData.images as string) : [];
  const variants = rawData.variants ? JSON.parse(rawData.variants as string) : [];

  const validatedFields = productSchema.safeParse({
    ...rawData,
    images: images,
    variants: variants
  });

  if (!validatedFields.success) {
    return { success: false, error: "Invalid fields" };
  }

  const { variants: variantList, ...productData } = validatedFields.data;

  try {
    await db.update(products).set({
      name: productData.name,
      slug: productData.slug,
      description: productData.description ?? "",
      price: productData.price * 100,
      stock: productData.stock,
      categoryId: productData.categoryId ?? null,
      images: productData.images ?? [],
      modelUrl: productData.modelUrl ?? null,
      width: productData.width ?? null,
      height: productData.height ?? null,
      depth: productData.depth ?? null,
      updatedAt: new Date()
    }).where(eq(products.id, id));

    await db.delete(productVariants).where(eq(productVariants.productId, id));

    if (variantList && variantList.length > 0) {
      await db.insert(productVariants).values(
        variantList.map((v) => {
          // Otomatik İsim Oluşturma
          const parts = [v.color, v.size, v.material].filter(Boolean);
          const fullName = parts.length > 0 ? parts.join(" / ") : "Standard";

          return {
            productId: id,
            name: fullName,
            price: v.price * 100,
            stock: v.stock,
            image: v.image || null,
            attributes: {
                color: v.color || "",
                size: v.size || "",
                material: v.material || ""
            }
          };
        })
      );
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/product/${productData.slug}`);
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update product" };
  }

  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/admin/products");
        return { success: true };
    } catch {
        return { success: false, error: "Failed to delete" };
    }
}