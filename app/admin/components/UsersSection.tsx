import type { UserRecord } from "@/lib/users";
import { SectionPanel } from "./DashboardHeader";
import { EmptyState, MiniStat, SearchField } from "./AdminUi";
import { useMemo, useState } from "react";

type UsersSectionProps = {
  users: UserRecord[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (user: UserRecord) => void;
  onRemove: (id: string) => void;
};

export default function UsersSection({
  users,
  loading,
  onCreate,
  onEdit,
  onRemove,
}: UsersSectionProps) {
  const [query, setQuery] = useState("");
  const activeCount = users.filter((u) => u.status === "active").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.phone.includes(q),
    );
  }, [users, query]);

  return (
    <SectionPanel
      title="Utilisateurs"
      subtitle="Base clients et contacts enregistrés"
      action={
        <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
          + Nouvel utilisateur
        </button>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total" value={users.length} />
        <MiniStat label="Actifs" value={activeCount} />
        <MiniStat label="Inactifs" value={users.length - activeCount} />
      </div>

      <div className="mb-6">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Rechercher nom, email, ville, téléphone..."
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-stone-400">Chargement des utilisateurs...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "Aucun résultat" : "Aucun utilisateur"}
          description={
            query
              ? "Modifiez votre recherche."
              : "Ajoutez des utilisateurs pour constituer votre base clients."
          }
          action={
            !query ? (
              <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
                Ajouter un utilisateur
              </button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-100 bg-[#fffcf8] text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map((user) => (
                <tr key={user.id} className="bg-white transition hover:bg-[#fffcf8]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5efe4] to-[#ede4d4] text-xs font-bold text-[#9a7b4f]">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-stone-400">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-stone-700">{user.email}</p>
                    <p className="text-xs text-stone-500">{user.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{user.city}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`admin-badge ${user.status === "active" ? "admin-badge-success" : "admin-badge-neutral"}`}
                    >
                      {user.status === "active" ? "actif" : "inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(user)} className="admin-btn-edit text-xs">
                        Modifier
                      </button>
                      <button type="button" onClick={() => onRemove(user.id)} className="admin-btn-danger text-xs">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionPanel>
  );
}
