"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderDetails = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCommune?: string;
  customerLandmark?: string;
  paymentMethod?: "card" | "cash_on_delivery";
  subtotal?: number;
  shippingFee?: number;
  total: number;
  status: string;
  createdAt?: string;
  paidAt?: string;
  lines: OrderLine[];
};

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export default function CommandeDetailsPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params?.orderId;
  const token = searchParams.get("token");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenValue = token;
    if (!orderId || !tokenValue) {
      return;
    }
    const safeToken: string = tokenValue;

    let active = true;
    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/orders/${orderId}/public?token=${encodeURIComponent(safeToken)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as OrderDetails | { error?: string };
        if (!response.ok) {
          const message =
            !Array.isArray(data) && "error" in data && data.error
              ? data.error
              : "Commande introuvable.";
          throw new Error(message);
        }
        if (Array.isArray(data) || !("orderId" in data)) {
          throw new Error("Commande introuvable.");
        }
        if (active) {
          setOrder(data as OrderDetails);
        }
      } catch (loadError) {
        if (active) {
          setOrder(null);
          setError(loadError instanceof Error ? loadError.message : "Erreur de chargement.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadOrder();
    return () => {
      active = false;
    };
  }, [orderId, token]);

  const totalArticles = useMemo(
    () => order?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0,
    [order],
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Confirmation
        </p>
        <h1 className="mt-1 text-2xl font-bold">Votre commande</h1>
        <p className="mt-1 text-sm text-slate-600">
          Merci pour votre achat. Retrouvez ici le recapitulatif de votre commande.
        </p>
      </header>

      {!orderId || !token ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Lien de confirmation invalide.
        </p>
      ) : null}
      {loading && orderId && token ? <p className="text-sm text-slate-500">Chargement de la commande...</p> : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {order ? (
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-3.5 w-3.5"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-sm font-medium">
              Felicitations, votre commande a bien ete validee.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{order.orderId}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Statut: {order.status}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Client: {order.customerName} ({order.customerEmail})
          </p>
          <p className="text-sm text-slate-600">
            Telephone: {order.customerPhone ?? "Non renseigne"}
          </p>
          <p className="text-sm text-slate-600">
            Commune: {order.customerCommune ?? "Non renseignee"}
          </p>
          <p className="text-sm text-slate-600">
            Repere: {order.customerLandmark ?? "Non renseigne"}
          </p>
          <p className="text-sm text-slate-600">
            Paiement: {order.paymentMethod === "cash_on_delivery" ? "A la livraison" : "Carte bancaire (Stripe)"}
          </p>
          <p className="text-sm text-slate-600">Articles: {totalArticles}</p>

          <div className="rounded-lg border border-slate-200">
            {order.lines.map((line) => (
              <div
                key={`${order.orderId}-${line.id}`}
                className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-b-0"
              >
                <span>
                  {line.name} x {line.quantity}
                </span>
                <strong>{currency.format(line.lineTotal)}</strong>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-base font-medium">Sous-total</span>
            <strong className="text-base">{currency.format(order.subtotal ?? order.total)}</strong>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Livraison</span>
            <strong>{currency.format(order.shippingFee ?? 0)}</strong>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-base font-medium">Total</span>
            <strong className="text-lg">{currency.format(order.total)}</strong>
          </div>
        </section>
      ) : null}

      <div className="flex gap-2">
        <Link href="/" className="rounded border border-slate-300 px-4 py-2 text-sm">
          Retour accueil
        </Link>
        <Link href="/ventes-flash" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Continuer mes achats
        </Link>
      </div>
    </main>
  );
}
