"use server";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  const firstRecord = await db.select().from(settings).limit(1);
  
  if (firstRecord.length === 0) {
    const [newSettings] = await db.insert(settings).values({
        storeName: "Instant Design",
        supportEmail: "support@example.com",
        currency: "EUR",
        maintenanceMode: false
    }).returning();
    return newSettings;
  }
  
  return firstRecord[0];
}

export async function updateSettings(formData: FormData) {
  try {
    const storeName = formData.get("storeName") as string;
    const supportEmail = formData.get("supportEmail") as string;
    const currency = formData.get("currency") as string;
    const maintenanceMode = formData.get("maintenanceMode") === "on";

    const currentSettings = await getSettings();
    
    await db.update(settings)
      .set({
        storeName,
        supportEmail,
        currency,
        maintenanceMode,
        updatedAt: new Date()
      })
      .where(eq(settings.id, currentSettings.id));

    revalidatePath("/admin/settings");
    revalidatePath("/"); 
    
    return { success: true };
  } catch (error) {
    console.error("Settings Update Error:", error);
    return { success: false, error: "Failed to update settings" };
  }
}