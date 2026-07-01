"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SiteHeader from "@/app/components/SiteHeader";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname === "/se-connecter";
  const isMaintenanceRoute = pathname === "/maintenance";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isAdminRoute || isLoginRoute || isMaintenanceRoute) {
    return null;
  }

  return <SiteHeader />;
}
