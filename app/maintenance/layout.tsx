import type { Metadata } from "next";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Maintenance — ProConfection",
  description: "La boutique ProConfection est temporairement en maintenance.",
  robots: { index: false, follow: false },
};

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-dashboard" data-theme="light">
      {children}
    </div>
  );
}
