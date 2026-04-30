import { NextResponse } from "next/server";
import { defaultProducts, type Product } from "@/lib/catalog";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(defaultProducts);
    }

    const db = await getDb();
    const products = await db
      .collection<Product>("products")
      .find({}, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();

    if (products.length === 0) {
      await db.collection<Product>("products").insertMany(defaultProducts);
      return NextResponse.json(defaultProducts);
    }

    return NextResponse.json(products);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<Product>;

    if (!body.id || body.id.trim().length < 2) {
      return NextResponse.json({ error: "ID produit invalide." }, { status: 400 });
    }
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

    const product: Product = {
      id: body.id,
      name: body.name,
      category: body.category.trim(),
      subcategory: body.subcategory?.trim() || undefined,
      price: Number(body.price),
      image: body.image,
      images: images.length > 0 ? images : undefined,
      oldPrice,
      stock,
      discountPercentage,
      description: body.description ?? "Description indisponible.",
      sizes: body.sizes,
    };

    const db = await getDb();
    const existing = await db
      .collection<Product>("products")
      .findOne({ id: product.id }, { projection: { _id: 0 } });

    if (existing) {
      return NextResponse.json(
        { error: "Un produit avec cet ID existe deja." },
        { status: 409 },
      );
    }

    await db.collection<Product>("products").insertOne(product);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
