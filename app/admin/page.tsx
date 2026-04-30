import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const isAuthorized = await hasValidAdminSession();
  if (!isAuthorized) {
    redirect("/se-connecter");
  }
  return <AdminClient />;
}
