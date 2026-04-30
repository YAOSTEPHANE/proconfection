import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/mongodb";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Signature ou secret webhook absent." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook Stripe invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const db = await getDb();
      await db.collection("orders").updateOne(
        { orderId },
        {
          $set: {
            status: "paid",
            paidAt: new Date(),
            stripePaymentStatus: session.payment_status,
            stripeSessionId: session.id,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  return NextResponse.json({ received: true });
}
