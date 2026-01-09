"use server";

import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";

// 1. DOĞRULAMA ŞEMASI (ZOD)
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description is too short"),
  
  // "coerce" komutu, string gelen sayıyı (örn: "10.5") otomatik sayıya çevirir.
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  stock: z.coerce.number().default(0),
  
  // UUID kontrolü yapıyoruz ama boş gelirse hata mesajı veriyoruz.
  categoryId: z.string().min(1, "Please select a category"),
  
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  depth: z.coerce.number().optional(),
  
  // Resim ve Model URL'leri boş gelebilir, opsiyonel yapıyoruz.
  imageUrl: z.string().optional().or(z.literal("")),
  modelUrl: z.string().optional().or(z.literal("")),
});

export type State = {
  message?: string | null;
  errors?: {
    name?: string[];
    slug?: string[];
    description?: string[];
    price?: string[];
    stock?: string[];
    categoryId?: string[];
    imageUrl?: string[];
    modelUrl?: string[];
  };
};

// 2. CREATE PRODUCT ACTION
export async function createProduct(prevState: State, formData: FormData): Promise<State> {
  // Form verisini al
  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
    width: formData.get("width"),
    height: formData.get("height"),
    depth: formData.get("depth"),
    imageUrl: formData.get("imageUrl"),
    modelUrl: formData.get("modelUrl"),
  };

  // Konsola bas ki ne geldiğini görelim (Debugging için)
  console.log("Formdan Gelen Veri:", rawData);

  const validated = productSchema.safeParse(rawData);

  if (!validated.success) {
    // Hangi alanda hata olduğunu terminale yazdır
    console.error("Validation Hatası:", validated.error.flatten().fieldErrors);
    
    return {
      message: "Lütfen tüm zorunlu alanları doldurun.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await db.insert(products).values({
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description,
      // Fiyatı kuruşa çeviriyoruz (10.50 -> 1050)
      price: Math.round(validated.data.price * 100),
      stock: validated.data.stock,
      categoryId: validated.data.categoryId,
      width: validated.data.width || 0,
      height: validated.data.height || 0,
      depth: validated.data.depth || 0,
      // Tek gelen resim URL'sini diziye çevirip kaydediyoruz
      images: validated.data.imageUrl ? [validated.data.imageUrl] : [],
      modelUrl: validated.data.modelUrl || null,
    });

    revalidatePath("/admin/products");

  } catch (error) {
    console.error("Veritabanı Hatası:", error);
    return { message: "Veritabanı hatası: Ürün oluşturulamadı." };
  }

  redirect("/admin/products");
}

// 3. UPDATE PRODUCT ACTION
export async function updateProduct(id: string, prevState: State, formData: FormData): Promise<State> {
  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
    width: formData.get("width"),
    height: formData.get("height"),
    depth: formData.get("depth"),
    imageUrl: formData.get("imageUrl"),
    modelUrl: formData.get("modelUrl"),
  };

  const validated = productSchema.safeParse(rawData);

  if (!validated.success) {
    console.error("Validation Hatası:", validated.error.flatten().fieldErrors);
    return {
      message: "Doğrulama Hatası.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await db.update(products)
      .set({
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description,
        price: Math.round(validated.data.price * 100),
        stock: validated.data.stock,
        categoryId: validated.data.categoryId,
        width: validated.data.width || 0,
        height: validated.data.height || 0,
        depth: validated.data.depth || 0,
        images: validated.data.imageUrl ? [validated.data.imageUrl] : [],
        modelUrl: validated.data.modelUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);

  } catch (error) {
    console.error("Veritabanı Hatası:", error);
    return { message: "Veritabanı hatası: Ürün güncellenemedi." };
  }

  redirect("/admin/products");
}