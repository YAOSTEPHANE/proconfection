import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import {
  defaultDashboardCategories,
  type DashboardCategory,
} from "@/lib/dashboard-content";

type CategoryInput = {
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
};

function validateCategoryInput(body: Partial<DashboardCategory>): CategoryInput | string {
  const name = body.name?.trim() ?? "";
  const slug = body.slug?.trim().toLowerCase() ?? "";
  const image = body.image?.trim() ?? "";
  const isActive = body.isActive ?? true;

  if (name.length < 2) return "Nom de categorie invalide.";
  if (slug.length < 2) return "Slug invalide.";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Slug invalide (a-z, 0-9, tirets).";
  return { name, slug, image, isActive };
}

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db
      .collection<DashboardCategory>("dashboard_categories")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    if (categories.length === 0) {
      await db
        .collection<DashboardCategory>("dashboard_categories")
        .insertMany(defaultDashboardCategories);
      return NextResponse.json(defaultDashboardCategories);
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.warn("GET /api/categories fallback vers defaultDashboardCategories:", error);
    return NextResponse.json(defaultDashboardCategories);
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<DashboardCategory>;
    const validated = validateCategoryInput(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .collection<DashboardCategory>("dashboard_categories")
      .findOne({ slug: validated.slug }, { projection: { _id: 0 } });
    if (existing) {
      return NextResponse.json({ error: "Ce slug existe deja." }, { status: 409 });
    }

    const category: DashboardCategory = {
      id: `cat-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...validated,
    };
    await db.collection<DashboardCategory>("dashboard_categories").insertOne(category);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
