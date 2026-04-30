import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY est manquant. Configure .env.local.");
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2026-04-22.dahlia",
  });
  return stripeClient;
}
