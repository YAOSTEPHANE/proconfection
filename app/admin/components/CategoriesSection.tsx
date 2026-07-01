import type { DashboardCategory } from "@/lib/dashboard-content";
import { SectionPanel } from "./DashboardHeader";
import { EmptyState, MiniStat } from "./AdminUi";

type CategoriesSectionProps = {
  categories: DashboardCategory[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (category: DashboardCategory) => void;
  onRemove: (id: string) => void;
};

export default function CategoriesSection({
  categories,
  loading,
  onCreate,
  onEdit,
  onRemove,
}: CategoriesSectionProps) {
  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <SectionPanel
      title="Catégories"
      subtitle="Organisez votre catalogue par familles de produits"
      action={
        <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
          + Nouvelle catégorie
        </button>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Total" value={categories.length} />
        <MiniStat label="Actives" value={activeCount} />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-stone-400">Chargement des catégories...</p>
      ) : categories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Créez des catégories pour structurer votre boutique."
          action={
            <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
              Ajouter une catégorie
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="admin-card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {category.image?.trim() ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center bg-[#f5efe4] text-sm text-[#9a7b4f]">
                  Sans image
                </div>
              )}
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-stone-900">{category.name}</h3>
                    <p className="text-xs text-stone-500">/{category.slug}</p>
                  </div>
                  <span
                    className={`admin-badge ${category.isActive ? "admin-badge-success" : "admin-badge-neutral"}`}
                  >
                    {category.isActive ? "actif" : "inactif"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onEdit(category)} className="admin-btn-edit text-xs">
                    Modifier
                  </button>
                  <button type="button" onClick={() => onRemove(category.id)} className="admin-btn-danger text-xs">
                    Supprimer
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}
