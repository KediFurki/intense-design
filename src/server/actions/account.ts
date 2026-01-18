"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

const addressSchema = z.object({
  title: z.string().min(2),

  // Contact (used in checkout + invoices)
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),

  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional().default(""),
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

function readForm(formData: FormData) {
  return {
    title: String(formData.get("title") || ""),

    firstName: String(formData.get("firstName") || ""),
    lastName: String(formData.get("lastName") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),

    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    state: String(formData.get("state") || ""),
    zipCode: String(formData.get("zipCode") || ""),
    country: String(formData.get("country") || ""),
  };
}

export async function addAddress(formData: FormData, locale?: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "UNAUTHORIZED" };

  const raw = readForm(formData);
  const validated = addressSchema.safeParse(raw);
  if (!validated.success) return { success: false, error: "INVALID_INPUT" };

  const data = validated.data;

  // Dedupe: aynı adres varsa tekrar ekleme
  const existing = await db.query.addresses.findFirst({
    where: and(
      eq(addresses.userId, session.user.id),
      eq(addresses.address, data.address),
      eq(addresses.city, data.city),
      eq(addresses.state, data.state || ""),
      eq(addresses.zipCode, data.zipCode),
      eq(addresses.country, data.country)
    ),
    columns: { id: true },
  });

  if (!existing) {
    await db.insert(addresses).values({
      userId: session.user.id,
      ...data,
      state: data.state || "",
    });
  }

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

  const raw = readForm(formData);
  const validated = addressSchema.safeParse(raw);
  if (!validated.success) return { success: false, error: "INVALID_INPUT" };

  await db
    .update(addresses)
    .set({ ...validated.data, state: validated.data.state || "" })
    .where(and(eq(addresses.id, id), eq(addresses.userId, session.user.id)));

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