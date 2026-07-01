import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DEFAULT_SHOP_SETTINGS, normalizeShopSettings, type ShopSettings } from "@/lib/settings";

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db
      .collection<ShopSettings>("app_settings")
      .findOne({ id: "shop-settings" }, { projection: { _id: 0 } });

    if (!doc) {
      return NextResponse.json({ settings: DEFAULT_SHOP_SETTINGS });
    }

    return NextResponse.json({ settings: normalizeShopSettings(doc) });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SHOP_SETTINGS });
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

    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sauvegarde impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
