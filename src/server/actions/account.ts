"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const addressSchema = z.object({
  title: z.string().min(1),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(2),
  country: z.string().min(2),
});

export async function addAddress(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const rawData = {
    title: formData.get("title"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    country: formData.get("country"),
  };

  const validated = addressSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, error: "Invalid data" };
  }

  try {
    await db.insert(addresses).values({
      userId: session.user.id,
      ...validated.data,
    });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database error" };
  }
}