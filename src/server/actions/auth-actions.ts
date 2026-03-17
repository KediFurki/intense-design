"use server";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

type RegisterResult = {
  success: boolean;
  error?: string;
};

export async function registerUser(name: string, email: string, password: string): Promise<RegisterResult> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    return { success: false, error: "All fields are required" };
  }

  if (normalizedPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
    columns: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await hash(normalizedPassword, 10);

  await db.insert(users).values({
    name: normalizedName,
    email: normalizedEmail,
    password: passwordHash,
  });

  return { success: true };
}