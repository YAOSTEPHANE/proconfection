import type { Product } from "@/lib/catalog";
import { SectionPanel } from "./DashboardHeader";
import { EmptyState, MiniStat, SearchField } from "./AdminUi";

type ProductsSectionProps = {
  items: Product[];
  filteredItems: Product[];
  loading: boolean;
  query: string;
  currency: Intl.NumberFormat;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onRemove: (id: string) => void;
};

export default function ProductsSection({
  items,
  filteredItems,
  loading,
  query,
  currency,
  onQueryChange,
  onCreate,
  onEdit,
  onDuplicate,
  onRemove,
}: ProductsSectionProps) {
  const inStock = items.filter((p) => (p.stock ?? 0) > 0).length;
  const onSale = items.filter((p) => (p.discountPercentage ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <span id="dashboard-products-form" className="sr-only">
        Formulaire produit
      </span>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total catalogue" value={items.length} />
        <MiniStat label="En stock" value={inStock} />
        <MiniStat label="En promotion" value={onSale} />
      </div>

      <SectionPanel
        title="Catalogue produits"
        subtitle={`${filteredItems.length} produit(s) affiché(s)`}
        action={
          <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
            + Nouveau produit
          </button>
        }
      >
        <div id="dashboard-products-search" className="mb-6">
          <SearchField
            value={query}
            onChange={onQueryChange}
            placeholder="Rechercher par nom, catégorie ou ID..."
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-stone-400">Chargement du catalogue...</p>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Aucun produit trouvé"
            description={query ? "Essayez un autre terme de recherche." : "Ajoutez votre premier produit au catalogue."}
            action={
              !query ? (
                <button type="button" onClick={onCreate} className="admin-btn-primary text-sm">
                  Créer un produit
                </button>
              ) : null
            }
          />
        ) : (
          <div
            id="dashboard-products-list"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="admin-card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
              >
                {(item.images?.[0] ?? item.image)?.trim() ? (
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#f8f7f5]">
                    <img
                      src={item.images?.[0] ?? item.image}
                      alt={item.name}
                      className="h-full w-full object-contain object-center transition duration-300"
                    />
                    {(item.discountPercentage ?? 0) > 0 ? (
                      <span className="absolute left-3 top-3 admin-badge admin-badge-warning">
                        -{item.discountPercentage}%
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-[#f8f7f5] text-xs text-stone-400">
                    Aucune image
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="admin-badge admin-badge-gold">{item.category}</span>
                    <span className="text-[10px] font-mono text-stone-400">{item.id}</span>
                  </div>
                  <h3 className="line-clamp-1 font-semibold text-stone-900">{item.name}</h3>
                  <p className="line-clamp-2 text-xs text-stone-500">{item.description}</p>
                  <div className="flex items-baseline gap-2 pt-1">
                    <p className="text-lg font-semibold text-[#9a7b4f]">{currency.format(item.price)}</p>
                    {item.oldPrice ? (
                      <p className="text-xs text-stone-400 line-through">{currency.format(item.oldPrice)}</p>
                    ) : null}
                  </div>
                  {Number.isFinite(item.stock) ? (
                    <p className="text-xs text-stone-500">Stock : {item.stock}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" onClick={() => onEdit(item)} className="admin-btn-edit text-xs">
                      Modifier
                    </button>
                    <button type="button" onClick={() => onDuplicate(item)} className="admin-btn-ghost text-xs">
                      Dupliquer
                    </button>
                    <button type="button" onClick={() => onRemove(item.id)} className="admin-btn-danger text-xs">
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
