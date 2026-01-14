import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/server/payments/stripe";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Webhook failed";
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.orderId;
      const paymentType = session.metadata?.paymentType as "full" | "deposit" | undefined;

      if (!orderId) return NextResponse.json({ received: true });

      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

      if (paymentType === "deposit") {
        await db.update(orders).set({
          paymentStatus: "deposit_paid",
          stripePaymentIntentId: paymentIntentId,
        }).where(eq(orders.id, orderId));
      } else {
        await db.update(orders).set({
          paymentStatus: "paid",
          remainingAmount: 0,
          stripePaymentIntentId: paymentIntentId,
        }).where(eq(orders.id, orderId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}