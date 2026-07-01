import { FormEvent } from "react";
import type { DashboardBanner } from "@/lib/dashboard-content";
import { PremiumModal } from "./DashboardHeader";

export type BannerFormState = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: DashboardBanner["position"];
  isActive: boolean;
};

type BannerFormModalProps = {
  open: boolean;
  editingId: string | null;
  form: BannerFormState;
  onClose: () => void;
  onChange: (form: BannerFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function BannerFormModal({
  open,
  editingId,
  form,
  onClose,
  onChange,
  onSubmit,
}: BannerFormModalProps) {
  if (!open) return null;

  return (
    <PremiumModal
      title={editingId ? "Modifier la bannière" : "Nouvelle bannière"}
      subtitle="Marketing"
      onClose={onClose}
      size="md"
    >
      <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
        <label className="block">
          <span className="admin-label">Titre</span>
          <input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            className="admin-input"
            required
          />
        </label>
        <label className="block">
          <span className="admin-label">Sous-titre</span>
          <input
            value={form.subtitle}
            onChange={(e) => onChange({ ...form, subtitle: e.target.value })}
            className="admin-input"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="admin-label">URL de l&apos;image</span>
          <input
            value={form.image}
            onChange={(e) => onChange({ ...form, image: e.target.value })}
            className="admin-input"
            placeholder="https://..."
            required
          />
        </label>
        {form.image.trim() ? (
          <div className="md:col-span-2">
            <img
              src={form.image}
              alt="Aperçu bannière"
              className="h-36 w-full rounded-xl border border-stone-200 object-cover"
            />
          </div>
        ) : null}
        <label className="block">
          <span className="admin-label">Lien cible</span>
          <input
            value={form.link}
            onChange={(e) => onChange({ ...form, link: e.target.value })}
            className="admin-input"
            placeholder="/ventes-flash"
          />
        </label>
        <label className="block">
          <span className="admin-label">Position</span>
          <select
            value={form.position}
            onChange={(e) =>
              onChange({
                ...form,
                position: e.target.value as DashboardBanner["position"],
              })
            }
            aria-label="Position bannière"
            className="admin-input"
          >
            <option value="hero">Bannière principale</option>
            <option value="middle">Milieu de page</option>
            <option value="sidebar">Barre latérale</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-stone-700 md:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-stone-300 text-[#b8956c]"
          />
          Bannière active
        </label>
        <button type="submit" className="admin-btn-primary md:col-span-2">
          {editingId ? "Enregistrer la bannière" : "Ajouter la bannière"}
        </button>
      </form>
    </PremiumModal>
  );
}
