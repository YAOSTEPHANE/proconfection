import type { Metadata } from "next";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Connexion — ProConfection",
  description: "Accédez à l'espace d'administration ProConfection Internationale",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-dashboard" data-theme="light">
      {children}
    </div>
  );
}
