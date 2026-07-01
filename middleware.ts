import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  try {
    const settingsUrl = new URL("/api/settings", request.nextUrl.origin);
    const response = await fetch(settingsUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as {
      settings?: { display?: { maintenanceMode?: boolean } };
    };
    return data.settings?.display?.maintenanceMode === true;
  } catch {
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
