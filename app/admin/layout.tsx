import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Tableau de bord — ProConfection",
  description: "Administration ProConfection Internationale",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-dashboard" data-theme="light">
      {children}
    </div>
  );
}
