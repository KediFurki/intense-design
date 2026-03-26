import { NextResponse } from "next/server";
import { getSettings } from "@/server/actions/settings";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ stripeEnabled: s?.stripeEnabled ?? false });
}
