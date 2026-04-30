"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SiteHeader from "@/app/components/SiteHeader";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isAdminRoute) {
    return null;
  }

  return <SiteHeader />;
}
