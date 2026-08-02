import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { defaultDashboardBanners, defaultMiddleBanners, defaultSidebarBanners, type DashboardBanner } from "@/lib/dashboard-content";
import { materializeImageRef, needsImageMaterialization } from "@/lib/image-storage";

export const runtime = "nodejs";

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

export async function GET() {
  try {
    const db = await getDb();
    const banners = await db
      .collection<DashboardBanner>("dashboard_banners")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    if (banners.length === 0) {
      await db.collection<DashboardBanner>("dashboard_banners").insertMany(defaultDashboardBanners);
      return NextResponse.json(defaultDashboardBanners);
    }

    // Assure les 2 bannières latérales éditables (chaussures / sacs) si absentes.
    const hasSidebar = banners.some((banner) => banner.position === "sidebar");
    const hasMiddle = banners.some((banner) => banner.position === "middle");
    let allBanners = banners;
    const toInsert: DashboardBanner[] = [];
    if (!hasSidebar) toInsert.push(...defaultSidebarBanners);
    if (!hasMiddle) toInsert.push(...defaultMiddleBanners);
    if (toInsert.length > 0) {
      await db.collection<DashboardBanner>("dashboard_banners").insertMany(toInsert);
      allBanners = [...toInsert, ...banners];
    }

    const lightweight: DashboardBanner[] = [];
    for (const banner of allBanners) {
      if (!needsImageMaterialization(banner.image)) {
        lightweight.push(banner);
        continue;
      }
      const image = await materializeImageRef(banner.image);
      if (image !== banner.image) {
        await db.collection<DashboardBanner>("dashboard_banners").updateOne(
          { id: banner.id },
          { $set: { image } },
        );
      }
      lightweight.push({ ...banner, image });
    }

    return NextResponse.json(lightweight);
  } catch (error) {
    console.warn("GET /api/banners fallback vers defaultDashboardBanners:", error);
    return NextResponse.json(defaultDashboardBanners);
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    const body = (await request.json()) as Partial<DashboardBanner>;
    const validated = validateBannerInput(body);
    if (typeof validated === "string") return NextResponse.json({ error: validated }, { status: 400 });
    const image = await materializeImageRef(validated.image);
    const banner: DashboardBanner = {
      id: `ban-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...validated,
      image,
    };
    const db = await getDb();
    await db.collection<DashboardBanner>("dashboard_banners").insertOne(banner);
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
