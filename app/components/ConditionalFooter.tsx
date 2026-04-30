"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/app/components/SiteFooter";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return null;
  }

  return <SiteFooter />;
}
