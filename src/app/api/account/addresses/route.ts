import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await db.query.addresses.findMany({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.createdAt)],
    columns: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ addresses: rows });
}