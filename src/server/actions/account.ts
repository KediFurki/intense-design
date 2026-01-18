"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

const addressSchema = z.object({
  title: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(2),
  country: z.string().min(2),
});

type ActionResult = { success: true } | { success: false; error: string };

function revalidateAccount(locale?: string) {
  if (locale && locale.trim().length >= 2) {
    revalidatePath(`/${locale}/account`);
    return;
  }
  revalidatePath("/account");
}

export async function addAddress(formData: FormData, locale?: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "UNAUTHORIZED" };

  const raw = {
    title: String(formData.get("title") || ""),
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    state: String(formData.get("state") || ""),
    zipCode: String(formData.get("zipCode") || ""),
    country: String(formData.get("country") || ""),
  };

  const validated = addressSchema.safeParse(raw);
  if (!validated.success) return { success: false, error: "INVALID_INPUT" };

  await db.insert(addresses).values({
    userId: session.user.id,
    ...validated.data,
  });

  revalidateAccount(locale);
  return { success: true };
}

export async function updateAddress(
  id: string,
  formData: FormData,
  locale?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "UNAUTHORIZED" };

  const raw = {
    title: String(formData.get("title") || ""),
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    state: String(formData.get("state") || ""),
    zipCode: String(formData.get("zipCode") || ""),
    country: String(formData.get("country") || ""),
  };

  const validated = addressSchema.safeParse(raw);
  if (!validated.success) return { success: false, error: "INVALID_INPUT" };

  const updated = await db
    .update(addresses)
    .set(validated.data)
    .where(and(eq(addresses.id, id), eq(addresses.userId, session.user.id)));

  // drizzle update return tipi driver’a göre değişebilir; burada sadece revalidate ediyoruz
  void updated;

  revalidateAccount(locale);
  return { success: true };
}

export async function deleteAddress(id: string, locale?: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "UNAUTHORIZED" };

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, session.user.id)));

  revalidateAccount(locale);
  return { success: true };
}