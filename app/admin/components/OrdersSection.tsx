import type { AdminOrder, AdminOrderDetails } from "./OrdersSection.types";
import { SectionPanel } from "./DashboardHeader";
import { EmptyState, MiniStat, OrderStatusBadge, SearchField } from "./AdminUi";

export type { AdminOrder, AdminOrderDetails };

type OrdersSectionProps = {
  orders: AdminOrder[];
  ordersTotal: number;
  ordersPage: number;
  ordersTotalPages: number;
  ordersPageSize: number;
  ordersLoading: boolean;
  orderQuery: string;
  orderStatusFilter: "all" | "pending_payment" | "pending_confirmation" | "paid" | "canceled";
  orderSortValue: string;
  selectedOrder: AdminOrderDetails | null;
  orderDetailsLoading: boolean;
  updatingOrderId: string | null;
  currency: Intl.NumberFormat;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (filter: OrdersSectionProps["orderStatusFilter"]) => void;
  onSortChange: (sortBy: "createdAt" | "total", sortDir: "asc" | "desc") => void;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onExportCsv: () => void;
  onUpdateStatus: (
    orderId: string,
    status: "pending_payment" | "pending_confirmation" | "paid" | "canceled",
  ) => void;
  onOpenDetails: (orderId: string) => void;
  onCloseDetails: () => void;
};

export default function OrdersSection({
  orders,
  ordersTotal,
  ordersPage,
  ordersTotalPages,
  ordersPageSize,
  ordersLoading,
  orderQuery,
  orderStatusFilter,
  orderSortValue,
  selectedOrder,
  orderDetailsLoading,
  updatingOrderId,
  currency,
  onQueryChange,
  onStatusFilterChange,
  onSortChange,
  onPageSizeChange,
  onPageChange,
  onExportCsv,
  onUpdateStatus,
  onOpenDetails,
  onCloseDetails,
}: OrdersSectionProps) {
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const revenue = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0);

  return (
    <SectionPanel
      title="Commandes"
      subtitle={`${ordersTotal} commande(s) au total — page ${ordersPage}/${ordersTotalPages}`}
      action={
        <button type="button" onClick={onExportCsv} className="admin-btn-secondary text-sm">
          Export CSV
        </button>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Page actuelle" value={orders.length} />
        <MiniStat label="Payées (page)" value={paidCount} />
        <MiniStat label="CA page" value={currency.format(revenue)} />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SearchField
            value={orderQuery}
            onChange={onQueryChange}
            placeholder="Rechercher ID, client, email..."
          />
        </div>
        <select
          value={orderStatusFilter}
          onChange={(e) =>
            onStatusFilterChange(e.target.value as OrdersSectionProps["orderStatusFilter"])
          }
          aria-label="Filtrer par statut"
          className="admin-input"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending_payment">En attente paiement</option>
          <option value="pending_confirmation">Paiement à la livraison</option>
          <option value="paid">Payées</option>
          <option value="canceled">Annulées</option>
        </select>
        <select
          value={orderSortValue}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split(":") as ["createdAt" | "total", "asc" | "desc"];
            onSortChange(sortBy, sortDir);
          }}
          aria-label="Tri"
          className="admin-input"
        >
          <option value="createdAt:desc">Plus récentes</option>
          <option value="createdAt:asc">Plus anciennes</option>
          <option value="total:desc">Montant décroissant</option>
          <option value="total:asc">Montant croissant</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <select
          value={String(ordersPageSize)}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Taille de page"
          className="admin-input w-auto text-xs"
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>

      {ordersLoading ? (
        <p className="py-8 text-center text-sm text-stone-400">Chargement des commandes...</p>
      ) : orders.length === 0 ? (
        <EmptyState title="Aucune commande" description="Les commandes clients apparaîtront ici." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-100 bg-[#fffcf8] text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {orders.map((order) => (
                <tr key={order.orderId} className="bg-white transition hover:bg-[#fffcf8]">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-stone-900">
                    {order.orderId}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{order.customerName}</p>
                    <p className="text-xs text-stone-500">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#9a7b4f]">
                    {currency.format(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          onUpdateStatus(
                            order.orderId,
                            e.target.value as "pending_payment" | "pending_confirmation" | "paid" | "canceled",
                          )
                        }
                        disabled={updatingOrderId === order.orderId}
                        aria-label={`Statut ${order.orderId}`}
                        className="admin-input w-auto px-2 py-1 text-xs"
                      >
                        <option value="pending_payment">En attente</option>
                        <option value="pending_confirmation">À la livraison</option>
                        <option value="paid">Payée</option>
                        <option value="canceled">Annulée</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => onOpenDetails(order.orderId)}
                        className="admin-btn-primary text-xs"
                      >
                        Détails
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, ordersPage - 1))}
          disabled={ordersPage <= 1}
          className="admin-btn-secondary text-xs disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="text-xs font-medium text-stone-500">
          Page {ordersPage} / {ordersTotalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(ordersTotalPages, ordersPage + 1))}
          disabled={ordersPage >= ordersTotalPages}
          className="admin-btn-secondary text-xs disabled:opacity-50"
        >
          Suivant
        </button>
      </div>

      {orderDetailsLoading ? (
        <p className="mt-4 text-sm text-stone-500">Chargement des détails...</p>
      ) : null}

      {selectedOrder ? (
        <article className="admin-card mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-900">{selectedOrder.orderId}</h3>
              <p className="text-sm text-stone-500">
                {selectedOrder.customerName} — {selectedOrder.customerEmail}
              </p>
            </div>
            <button type="button" onClick={onCloseDetails} className="admin-btn-ghost text-xs">
              Fermer
            </button>
          </div>
          <div className="space-y-2">
            {selectedOrder.lines.map((line) => (
              <div
                key={`${selectedOrder.orderId}-${line.id}`}
                className="flex items-center justify-between rounded-lg border border-stone-100 bg-[#fffcf8] px-4 py-2.5 text-sm"
              >
                <span>
                  {line.name} <span className="text-stone-400">× {line.quantity}</span>
                </span>
                <strong className="text-[#9a7b4f]">{currency.format(line.lineTotal)}</strong>
              </div>
            ))}
          </div>
          <p className="mt-4 text-right text-base font-semibold text-stone-900">
            Total : {currency.format(selectedOrder.total)}
          </p>
        </article>
      ) : null}
    </SectionPanel>
  );
}
