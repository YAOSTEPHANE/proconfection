import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getInternalAppOrigin, isMaintenanceEnvForced } from "@/lib/maintenance";

const BYPASS_PREFIXES = ["/admin", "/se-connecter", "/api", "/maintenance", "/_next"];

function shouldBypass(pathname: string): boolean {
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (pathname.includes(".") && !pathname.endsWith("/")) {
    return true;
  }
  return false;
}

async function isMaintenanceEnabled(request: NextRequest): Promise<boolean> {
  if (isMaintenanceEnvForced()) {
    return true;
  }

  try {
    const origin = getInternalAppOrigin(request.nextUrl.origin);
    const settingsUrl = new URL("/api/settings/maintenance", origin);
    const response = await fetch(settingsUrl, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { maintenanceMode?: boolean };
    return data.maintenanceMode === true;
  } catch (error) {
    console.error("middleware maintenance check:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  const maintenanceEnabled = await isMaintenanceEnabled(request);
  if (!maintenanceEnabled) {
    return NextResponse.next();
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = "/maintenance";
  maintenanceUrl.search = "";
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
