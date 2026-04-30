import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hasValidAdminSession } from "@/lib/auth";
import { type Product } from "@/lib/catalog";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const body = (await request.json()) as Partial<Product>;
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: "Nom produit invalide." }, { status: 400 });
    }
    if (!body.category || body.category.trim().length < 2) {
      return NextResponse.json({ error: "Categorie invalide." }, { status: 400 });
    }
    if (!Number.isFinite(body.price) || Number(body.price) <= 0) {
      return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
    }
    if (!body.image || body.image.trim().length < 8) {
      return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    }
    const images =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images.filter((image) => typeof image === "string" && image.trim().length >= 8)
        : [];
    const oldPrice =
      Number.isFinite(body.oldPrice) && Number(body.oldPrice) > 0 ? Number(body.oldPrice) : undefined;
    const stock =
      Number.isFinite(body.stock) && Number(body.stock) >= 0 ? Number(body.stock) : undefined;
    const discountPercentage =
      Number.isFinite(body.discountPercentage) && Number(body.discountPercentage) > 0
        ? Number(body.discountPercentage)
        : oldPrice
          ? Math.max(0, Math.round((1 - Number(body.price) / oldPrice) * 100))
          : undefined;

    const db = await getDb();
    const update: Partial<Product> = {
      name: body.name.trim(),
      category: body.category.trim(),
      subcategory: body.subcategory?.trim() || undefined,
      price: Number(body.price),
      image: body.image.trim(),
      images: images.length > 0 ? images : undefined,
      oldPrice,
      stock,
      discountPercentage,
      description: body.description?.trim() || "Description indisponible.",
    };
    const result = await db
      .collection<Product>("products")
      .updateOne({ id }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    const updated = await db
      .collection<Product>("products")
      .findOne({ id }, { projection: { _id: 0 } });
    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection<Product>("products").deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
