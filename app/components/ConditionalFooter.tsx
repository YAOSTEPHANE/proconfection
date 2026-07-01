"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/app/components/SiteFooter";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname === "/se-connecter";
  const isMaintenanceRoute = pathname === "/maintenance";

  if (isAdminRoute || isLoginRoute || isMaintenanceRoute) {
    return null;
  }

  return <SiteFooter />;
}
