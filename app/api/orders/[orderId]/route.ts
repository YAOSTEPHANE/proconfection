import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type Params = { params: Promise<{ orderId: string }> };

type PatchBody = {
  status?: "pending_payment" | "pending_confirmation" | "paid" | "canceled";
};

export async function GET(_: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant." }, { status: 400 });
    }

    const db = await getDb();
    const order = await db
      .collection("orders")
      .findOne({ orderId }, { projection: { _id: 0 } });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    if (!body.status || !["pending_payment", "pending_confirmation", "paid", "canceled"].includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("orders").updateOne(
      { orderId },
      {
        $set: {
          status: body.status,
          updatedAt: new Date(),
          ...(body.status === "paid" ? { paidAt: new Date() } : {}),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    await db.collection("order_audit_logs").insertOne({
      orderId,
      action: "status_update",
      nextStatus: body.status,
      actor: "admin",
      createdAt: new Date(),
    });

    const updated = await db
      .collection("orders")
      .findOne({ orderId }, { projection: { _id: 0 } });
    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
