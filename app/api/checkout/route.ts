import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/mongodb";
import { defaultProducts, getProductPriceForSize, type Product } from "@/lib/catalog";
import { getShippingFeeByCommune } from "@/lib/shipping";
import { getShopSettings } from "@/lib/settings";
import { getStripe } from "@/lib/stripe";

type CheckoutBody = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCommune: string;
  customerLandmark: string;
  paymentMethod?: "card" | "cash_on_delivery";
  items: Array<{ id: string; name: string; selectedSize?: string; quantity: number; price: number }>;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CheckoutBody>;

    if (!body.customerName || body.customerName.trim().length < 2) {
      return NextResponse.json(
        { error: "Nom client invalide." },
        { status: 400 },
      );
    }

    if (!body.customerEmail || !isValidEmail(body.customerEmail)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!body.customerPhone || body.customerPhone.trim().length < 5) {
      return NextResponse.json({ error: "Numero de telephone invalide." }, { status: 400 });
    }
    if (!body.customerCommune || body.customerCommune.trim().length < 2) {
      return NextResponse.json({ error: "Commune invalide." }, { status: 400 });
    }
    if (!body.customerLandmark || body.customerLandmark.trim().length < 3) {
      return NextResponse.json({ error: "Repere de livraison invalide." }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Le panier est vide." },
        { status: 400 },
      );
    }
    const paymentMethod = body.paymentMethod ?? "card";
    if (!["card", "cash_on_delivery"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Mode de paiement invalide." }, { status: 400 });
    }

    const db = await getDb();
    const shopSettings = await getShopSettings(db);

    if (paymentMethod === "card" && !shopSettings.payments.onlinePaymentEnabled) {
      return NextResponse.json(
        { error: "Le paiement en ligne est temporairement indisponible." },
        { status: 400 },
      );
    }
    if (paymentMethod === "cash_on_delivery" && !shopSettings.payments.cashOnDeliveryEnabled) {
      return NextResponse.json(
        { error: "Le paiement à la livraison est temporairement indisponible." },
        { status: 400 },
      );
    }

    const hasInvalidLine = body.items.some(
      (item) =>
        !item.id ||
        !item.name ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0,
    );

    if (hasInvalidLine) {
      return NextResponse.json(
        { error: "Une ligne de commande est invalide." },
        { status: 400 },
      );
    }

    const productIds = Array.from(new Set(body.items.map((item) => item.id)));
    const useLocalCatalog = process.env.NODE_ENV === "production";
    const products = useLocalCatalog
      ? defaultProducts.filter((product) => productIds.includes(product.id))
      : await db
          .collection<Product>("products")
          .find({ id: { $in: productIds } }, { projection: { _id: 0 } })
          .toArray();

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Un produit du panier n'existe plus." },
        { status: 400 },
      );
    }

    const map = new Map(products.map((product) => [product.id, product]));
    const lines = body.items.map((item) => {
      const product = map.get(item.id);
      if (!product) {
        throw new Error("Produit introuvable.");
      }
      return {
        id: product.id,
        name: item.selectedSize ? `${product.name} - Taille ${item.selectedSize}` : product.name,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        unitPrice: getProductPriceForSize(product, item.selectedSize),
        lineTotal: getProductPriceForSize(product, item.selectedSize) * item.quantity,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFee =
      subtotal >= shopSettings.delivery.freeShippingThreshold
        ? 0
        : getShippingFeeByCommune(body.customerCommune.trim());
    const total = subtotal + shippingFee;
    const orderId = `CMD-${Date.now()}`;
    const publicToken = randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const currency = (shopSettings.payments.currencyCode || "xof").toLowerCase();

    await db.collection("orders").insertOne({
      orderId,
      publicToken,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone.trim(),
      customerCommune: body.customerCommune.trim(),
      customerLandmark: body.customerLandmark.trim(),
      paymentMethod,
      lines,
      subtotal,
      shippingFee,
      total,
      status: paymentMethod === "card" ? "pending_payment" : "pending_confirmation",
      createdAt: new Date(),
    });

    if (paymentMethod === "cash_on_delivery") {
      return NextResponse.json({
        success: true,
        orderId,
        subtotal,
        shippingFee,
        total,
        checkoutUrl: `${appUrl}/commande/${orderId}?token=${publicToken}`,
        message: "Commande enregistree avec paiement a la livraison.",
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/commande/${orderId}?success=1&token=${publicToken}`,
      cancel_url: `${appUrl}/?canceled=1`,
      customer_email: body.customerEmail,
      metadata: {
        orderId,
        customerName: body.customerName,
        customerPhone: body.customerPhone.trim(),
        customerCommune: body.customerCommune.trim().slice(0, 120),
        customerLandmark: body.customerLandmark.trim().slice(0, 200),
        shippingFee: String(shippingFee),
      },
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency,
          product_data: {
            name: line.name,
          },
          unit_amount: Math.round(line.unitPrice),
        },
      })),
    });

    await db.collection("orders").updateOne(
      { orderId },
      {
        $set: {
          stripeSessionId: session.id,
          checkoutUrl: session.url,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      orderId,
      subtotal,
      shippingFee,
      total,
      checkoutUrl: session.url,
      message: "Session Stripe creee.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
