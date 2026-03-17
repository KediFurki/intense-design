import { NextResponse } from "next/server";
import { expireOverdueIbanOrders } from "@/server/services/order-service";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const secret = process.env.JOB_SECRET;
  if (!secret) {
    // Launch-ready: job secret zorunlu olsun
    return NextResponse.json({ error: "Missing JOB_SECRET" }, { status: 500 });
  }

  const headerSecret = req.headers.get("x-job-secret");
  if (!headerSecret || headerSecret !== secret) return unauthorized();

  const result = await expireOverdueIbanOrders(new Date()); // Date.now() değil

  return NextResponse.json({ ok: true, ...result });
}