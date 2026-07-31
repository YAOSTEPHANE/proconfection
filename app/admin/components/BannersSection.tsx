import type { DashboardBanner } from "@/lib/dashboard-content";
import { SectionPanel } from "./DashboardHeader";
import { EmptyState, MiniStat } from "./AdminUi";

const POSITION_LABELS: Record<DashboardBanner["position"], string> = {
  hero: "Carrousel principal",
  middle: "Milieu de page",
  sidebar: "Barre latérale",
};

type BannersSectionProps = {
  banners: DashboardBanner[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (banner: DashboardBanner) => void;
  onRemove: (id: string) => void;
};

export default function BannersSection({
  banners,
  loading,
  onCreate,
  onEdit,
  onRemove,
}: BannersSectionProps) {
  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <SectionPanel
      title="Bannières / Carrousel"
      subtitle="Images du carrousel d'accueil — ajoutez des visuels depuis votre PC"
      action={
        <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
          + Nouvelle bannière
        </button>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Total" value={banners.length} />
        <MiniStat label="Actives" value={activeCount} />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-stone-400">Chargement des bannières...</p>
      ) : banners.length === 0 ? (
        <EmptyState
          title="Aucune bannière"
          description="Créez des bannières pour mettre en avant vos collections et promotions."
          action={
            <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
              Créer une bannière
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {banners.map((banner) => (
            <article
              key={banner.id}
              className="admin-card overflow-hidden transition hover:shadow-md"
            >
              {banner.image?.trim() ? (
                <div className="relative h-40 overflow-hidden bg-stone-100">
                  <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 admin-badge admin-badge-gold">
                    {POSITION_LABELS[banner.position]}
                  </span>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-stone-100 text-stone-400">
                  Image manquante
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-stone-900">{banner.title}</h3>
                    {banner.subtitle ? (
                      <p className="text-sm text-stone-500">{banner.subtitle}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-[#9a7b4f]">{banner.link}</p>
                  </div>
                  <span
                    className={`admin-badge shrink-0 ${banner.isActive ? "admin-badge-success" : "admin-badge-neutral"}`}
                  >
                    {banner.isActive ? "actif" : "inactif"}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => onEdit(banner)} className="admin-btn-edit text-xs">
                    Modifier
                  </button>
                  <button type="button" onClick={() => onRemove(banner.id)} className="admin-btn-danger text-xs">
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
