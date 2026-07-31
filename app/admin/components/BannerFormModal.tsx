import { ChangeEvent, FormEvent, useState } from "react";
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!open) return null;

  async function handleLocalImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Choisissez un fichier image (JPG, PNG, WebP…).");
      event.target.value = "";
      return;
    }

    // ~4 Mo en fichier → data URL raisonnable pour Mongo
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Image trop lourde (max 4 Mo). Compressez-la puis réessayez.");
      event.target.value = "";
      return;
    }

    try {
      const uploadedImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Lecture de l'image impossible."));
        reader.readAsDataURL(file);
      });
      onChange({ ...form, image: uploadedImage });
      setUploadError(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <PremiumModal
      title={editingId ? "Modifier la bannière" : "Nouvelle bannière"}
      subtitle="Carrousel & marketing"
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

        <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 md:col-span-2">
          <label htmlFor="banner-image-upload" className="admin-label">
            Image depuis le PC
          </label>
          <input
            id="banner-image-upload"
            type="file"
            accept="image/*"
            onChange={handleLocalImageUpload}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <p className="text-xs text-stone-500">
            JPG, PNG ou WebP — max 4 Mo. Utilisé pour le carrousel d&apos;accueil.
          </p>
          {uploadError ? <p className="text-xs font-medium text-red-600">{uploadError}</p> : null}
        </div>

        <label className="block md:col-span-2">
          <span className="admin-label">Ou URL de l&apos;image</span>
          <input
            value={form.image.startsWith("data:") ? "" : form.image}
            onChange={(e) => onChange({ ...form, image: e.target.value })}
            className="admin-input"
            placeholder="https://… (optionnel si fichier local)"
          />
        </label>
        {form.image.trim() ? (
          <div className="md:col-span-2">
            <img
              src={form.image}
              alt="Aperçu bannière"
              className="h-36 w-full rounded-xl border border-stone-200 object-cover"
            />
            {form.image.startsWith("data:") ? (
              <p className="mt-1 text-xs text-stone-500">Image locale chargée</p>
            ) : null}
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
            <option value="hero">Carrousel principal (accueil)</option>
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
