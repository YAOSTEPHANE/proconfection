import { NextResponse } from "next/server";
import {
  applySchoolPricingGrid,
  DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
  defaultProducts,
  parseComboByAge,
  sizePricesFromComboByAge,
  type Product,
  type SchoolPricingCoefficients,
} from "@/lib/catalog";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const pricingConfig = await db
      .collection<{ id: "school-pricing"; coefficients: SchoolPricingCoefficients }>("app_settings")
      .findOne({ id: "school-pricing" }, { projection: { _id: 0 } });
    const coefficients = pricingConfig?.coefficients ?? DEFAULT_SCHOOL_PRICING_COEFFICIENTS;
    const products = await db
      .collection<Product>("products")
      .find({}, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();

    if (products.length === 0) {
      const seededProducts = applySchoolPricingGrid(defaultProducts, coefficients);
      await db.collection<Product>("products").insertMany(seededProducts);
      return NextResponse.json(seededProducts, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      });
    }

    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (error) {
    console.warn("GET /api/products fallback vers defaultProducts:", error);
    return NextResponse.json(defaultProducts, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
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

    const sizes =
      Array.isArray(body.sizes) && body.sizes.length > 0
        ? body.sizes.map((size) => size.trim()).filter((size) => size.length > 0)
        : undefined;
    const sizePrices =
      body.sizePrices && typeof body.sizePrices === "object"
        ? Object.fromEntries(
            Object.entries(body.sizePrices)
              .map(([age, value]) => [age.trim(), Number(value)] as const)
              .filter(([age, value]) => age.length > 0 && Number.isFinite(value) && value > 0),
          )
        : undefined;
    const tshirtPrice =
      Number.isFinite(body.tshirtPrice) && Number(body.tshirtPrice) > 0
        ? Number(body.tshirtPrice)
        : undefined;
    const shortPrice =
      Number.isFinite(body.shortPrice) && Number(body.shortPrice) > 0
        ? Number(body.shortPrice)
        : undefined;
    const comboByAge = parseComboByAge(body.comboByAge);
    const comboTotal =
      tshirtPrice && shortPrice ? Math.round(tshirtPrice + shortPrice) : Number(body.price);
    const resolvedSizePrices =
      comboByAge && Object.keys(comboByAge).length > 0
        ? sizePricesFromComboByAge(comboByAge)
        : sizePrices && Object.keys(sizePrices).length > 0
          ? sizePrices
          : undefined;

    const product: Product = {
      id: body.id,
      name: body.name,
      category: body.category.trim(),
      subcategory: body.subcategory?.trim() || undefined,
      price: comboTotal,
      image: body.image,
      images: images.length > 0 ? images : undefined,
      oldPrice,
      stock,
      discountPercentage,
      description: body.description ?? "Description indisponible.",
      sizes,
      sizePrices: resolvedSizePrices,
      tshirtPrice,
      shortPrice,
      comboByAge,
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
