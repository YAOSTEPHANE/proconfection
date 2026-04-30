import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { DashboardCategory } from "@/lib/dashboard-content";

type Params = { params: Promise<{ id: string }> };

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

export async function PUT(request: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

    const body = (await request.json()) as Partial<DashboardCategory>;
    const validated = validateCategoryInput(body);
    if (typeof validated === "string") return NextResponse.json({ error: validated }, { status: 400 });

    const db = await getDb();
    const conflict = await db
      .collection<DashboardCategory>("dashboard_categories")
      .findOne({ slug: validated.slug, id: { $ne: id } }, { projection: { _id: 0 } });
    if (conflict) return NextResponse.json({ error: "Ce slug existe deja." }, { status: 409 });

    const result = await db
      .collection<DashboardCategory>("dashboard_categories")
      .updateOne({ id }, { $set: validated });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Categorie introuvable." }, { status: 404 });
    }

    const updated = await db
      .collection<DashboardCategory>("dashboard_categories")
      .findOne({ id }, { projection: { _id: 0 } });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    const db = await getDb();
    const result = await db.collection<DashboardCategory>("dashboard_categories").deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Categorie introuvable." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
