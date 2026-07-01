import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { databaseErrorHeaders, formatMongoError } from "@/lib/mongodb-errors";
import { NO_STORE_HEADERS } from "@/lib/maintenance";
import { DEFAULT_SHOP_SETTINGS, normalizeShopSettings, type ShopSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db
      .collection<ShopSettings>("app_settings")
      .findOne({ id: "shop-settings" }, { projection: { _id: 0 } });

    if (!doc) {
      return NextResponse.json({ settings: DEFAULT_SHOP_SETTINGS }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      { settings: normalizeShopSettings(doc) },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("GET /api/settings:", error);
    return NextResponse.json(
      { settings: DEFAULT_SHOP_SETTINGS, degraded: true },
      { status: 200, headers: { ...NO_STORE_HEADERS, ...databaseErrorHeaders(error) } },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 401 });
    }

    const body = (await request.json()) as { settings?: unknown };
    const settings = normalizeShopSettings(body.settings);

    if (settings.delivery.estimatedDaysMax < settings.delivery.estimatedDaysMin) {
      return NextResponse.json(
        { error: "Le délai maximum doit être supérieur ou égal au délai minimum." },
        { status: 400 },
      );
    }

    if (!settings.payments.onlinePaymentEnabled && !settings.payments.cashOnDeliveryEnabled) {
      return NextResponse.json(
        { error: "Au moins un mode de paiement doit rester activé." },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db
      .collection<ShopSettings>("app_settings")
      .updateOne({ id: "shop-settings" }, { $set: settings }, { upsert: true });

    return NextResponse.json({ settings }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json({ error: formatMongoError(error) }, { status: 500 });
  }
}
