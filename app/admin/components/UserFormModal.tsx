import { FormEvent } from "react";
import { PremiumModal } from "./DashboardHeader";

export type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
};

type UserFormModalProps = {
  open: boolean;
  editingId: string | null;
  form: UserFormState;
  onClose: () => void;
  onChange: (form: UserFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function UserFormModal({
  open,
  editingId,
  form,
  onClose,
  onChange,
  onSubmit,
}: UserFormModalProps) {
  if (!open) return null;

  return (
    <PremiumModal
      title={editingId ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
      subtitle="Clients"
      onClose={onClose}
      size="md"
    >
      <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
        <label className="block">
          <span className="admin-label">Prénom</span>
          <input
            value={form.firstName}
            onChange={(e) => onChange({ ...form, firstName: e.target.value })}
            className="admin-input"
            required
          />
        </label>
        <label className="block">
          <span className="admin-label">Nom</span>
          <input
            value={form.lastName}
            onChange={(e) => onChange({ ...form, lastName: e.target.value })}
            className="admin-input"
            required
          />
        </label>
        <label className="block md:col-span-2">
          <span className="admin-label">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            className="admin-input"
            required
          />
        </label>
        <label className="block">
          <span className="admin-label">Téléphone</span>
          <input
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            className="admin-input"
            required
          />
        </label>
        <label className="block">
          <span className="admin-label">Ville</span>
          <input
            value={form.city}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            className="admin-input"
            required
          />
        </label>
        <label className="block md:col-span-2">
          <span className="admin-label">Statut</span>
          <select
            value={form.status}
            onChange={(e) =>
              onChange({ ...form, status: e.target.value as "active" | "inactive" })
            }
            aria-label="Statut utilisateur"
            className="admin-input"
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </label>
        <button type="submit" className="admin-btn-primary md:col-span-2">
          {editingId ? "Enregistrer" : "Ajouter l'utilisateur"}
        </button>
      </form>
    </PremiumModal>
  );
}
