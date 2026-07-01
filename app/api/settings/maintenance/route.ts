import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  isMaintenanceEnvForced,
  NO_STORE_HEADERS,
  readMaintenanceModeFromDb,
} from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    if (isMaintenanceEnvForced()) {
      return NextResponse.json(
        { maintenanceMode: true, source: "env" },
        { headers: NO_STORE_HEADERS },
      );
    }

    const db = await getDb();
    const maintenanceMode = await readMaintenanceModeFromDb(db);

    return NextResponse.json(
      { maintenanceMode, source: "database" },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("GET /api/settings/maintenance:", error);
    return NextResponse.json(
      { maintenanceMode: false, source: "fallback" },
      { headers: NO_STORE_HEADERS },
    );
  }
}
