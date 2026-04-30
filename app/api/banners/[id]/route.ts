import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { DashboardBanner } from "@/lib/dashboard-content";

type Params = { params: Promise<{ id: string }> };

type BannerInput = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: "hero" | "middle" | "sidebar";
  isActive: boolean;
};

function validateBannerInput(body: Partial<DashboardBanner>): BannerInput | string {
  const title = body.title?.trim() ?? "";
  const subtitle = body.subtitle?.trim() ?? "";
  const image = body.image?.trim() ?? "";
  const link = body.link?.trim() ?? "/";
  const position = body.position ?? "hero";
  const isActive = body.isActive ?? true;

  if (title.length < 2) return "Titre de banniere invalide.";
  if (image.length < 8) return "Image de banniere invalide.";
  if (!["hero", "middle", "sidebar"].includes(position)) return "Position invalide.";
  return { title, subtitle, image, link, position, isActive };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    const body = (await request.json()) as Partial<DashboardBanner>;
    const validated = validateBannerInput(body);
    if (typeof validated === "string") return NextResponse.json({ error: validated }, { status: 400 });
    const db = await getDb();
    const result = await db.collection<DashboardBanner>("dashboard_banners").updateOne({ id }, { $set: validated });
    if (result.matchedCount === 0) return NextResponse.json({ error: "Banniere introuvable." }, { status: 404 });
    const updated = await db.collection<DashboardBanner>("dashboard_banners").findOne({ id }, { projection: { _id: 0 } });
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
    const result = await db.collection<DashboardBanner>("dashboard_banners").deleteOne({ id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Banniere introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
