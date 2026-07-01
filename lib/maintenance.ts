import type { Db } from "mongodb";
import { DEFAULT_SHOP_SETTINGS, type ShopSettings } from "@/lib/settings";

export function isMaintenanceEnvForced(): boolean {
  const value = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "on";
}

export async function readMaintenanceModeFromDb(db: Db): Promise<boolean> {
  try {
    const doc = await db
      .collection<ShopSettings>("app_settings")
      .findOne({ id: "shop-settings" }, { projection: { "display.maintenanceMode": 1, _id: 0 } });

    return doc?.display?.maintenanceMode === true;
  } catch {
    return false;
  }
}

export async function resolveMaintenanceMode(db: Db | null): Promise<boolean> {
  if (isMaintenanceEnvForced()) {
    return true;
  }
  if (!db) {
    return false;
  }
  return readMaintenanceModeFromDb(db);
}

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
} as const;

export function getInternalAppOrigin(fallbackOrigin: string): string {
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromPublic) {
    return fromPublic;
  }
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;
  }
  return fallbackOrigin;
}
