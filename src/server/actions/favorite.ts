"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { favorites } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(productId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, session.user.id),
        eq(favorites.productId, productId)
      )
    });

    if (existing) {
      await db.delete(favorites).where(
        and(eq(favorites.userId, session.user.id), eq(favorites.productId, productId))
      );
      revalidatePath("/");
      return { success: true, isFavorited: false };
    } else {
      await db.insert(favorites).values({
        userId: session.user.id,
        productId: productId,
      });
      revalidatePath("/");
      return { success: true, isFavorited: true };
    }
  } catch (error) {
    return { success: false, error: "Failed to toggle favorite" };
  }
}