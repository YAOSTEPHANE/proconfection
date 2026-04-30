"use client";

import { useState } from "react";

type ProductDetailMenuProps = {
  description: string;
};

type DetailTab = "description" | "livraison" | "retours";

export default function ProductDetailMenu({ description }: ProductDetailMenuProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("description");

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("description")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            activeTab === "description" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
          }`}
        >
          Description
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("livraison")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            activeTab === "livraison" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
          }`}
        >
          Livraison
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("retours")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            activeTab === "retours" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
          }`}
        >
          Retours
        </button>
      </div>

      {activeTab === "description" ? <p className="text-sm text-slate-700">{description}</p> : null}
      {activeTab === "livraison" ? (
        <p className="text-sm text-slate-700">
          Livraison standard sous 24 a 72 heures selon votre zone. Suivi de commande inclus.
        </p>
      ) : null}
      {activeTab === "retours" ? (
        <p className="text-sm text-slate-700">
          Retour possible sous 7 jours pour article non utilise, dans son etat d&apos;origine.
        </p>
      ) : null}
    </section>
  );
}
