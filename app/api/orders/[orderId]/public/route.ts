import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant." }, { status: 400 });
    }
    const requestUrl = new URL(_.url);
    const token = requestUrl.searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    const db = await getDb();
    const order = await db.collection("orders").findOne(
      { orderId, publicToken: token },
      {
        projection: {
          _id: 0,
          orderId: 1,
          customerName: 1,
          customerEmail: 1,
          customerPhone: 1,
          customerCommune: 1,
          customerLandmark: 1,
          paymentMethod: 1,
          lines: 1,
          subtotal: 1,
          shippingFee: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          paidAt: 1,
        },
      },
    );

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable ou acces refuse." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
