import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ addresses: [] }, { status: 401 });
  }

  const list = await db.query.addresses.findMany({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.createdAt)],
    columns: {
      id: true,
      title: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
    },
  });

  return NextResponse.json({ addresses: list });
}