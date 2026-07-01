import { FormEvent } from "react";
import {
  DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
  type SchoolPricingCoefficients,
} from "@/lib/catalog";
import { SectionPanel } from "./DashboardHeader";
import { MiniStat } from "./AdminUi";

type PricingSectionProps = {
  coefficients: SchoolPricingCoefficients;
  loading: boolean;
  saving: boolean;
  onChange: (coefficients: SchoolPricingCoefficients) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

const schools: Array<{ key: keyof SchoolPricingCoefficients; label: string; hint: string }> = [
  { key: "jacquesPrevert", label: "Jacques Prévert", hint: "Coefficient de base (référence 1.00)" },
  { key: "blaisePascal", label: "Blaise Pascal", hint: "Majoration légère sur la grille" },
  { key: "jeanMermoz", label: "Jean Mermoz", hint: "Majoration premium sur la grille" },
];

export default function PricingSection({
  coefficients,
  loading,
  saving,
  onChange,
  onSave,
  onReset,
}: PricingSectionProps) {
  const avg =
    (coefficients.jacquesPrevert + coefficients.blaisePascal + coefficients.jeanMermoz) / 3;

  return (
    <SectionPanel
      title="Tarification par école"
      subtitle="Coefficients multiplicateurs appliqués automatiquement à la grille tarifaire"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Écoles configurées" value={3} />
        <MiniStat label="Coefficient moyen" value={avg.toFixed(2)} />
        <MiniStat
          label="Plage autorisée"
          value="0.70 — 1.50"
        />
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {schools.map((school) => {
            const value = coefficients[school.key];
            const delta = Math.round((value - 1) * 100);
            return (
              <article
                key={school.key}
                className="rounded-xl border border-stone-100 bg-gradient-to-br from-white to-[#fffcf8] p-5 ring-1 ring-transparent transition hover:ring-[rgba(184,149,108,0.15)]"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-stone-900">{school.label}</h3>
                    <p className="mt-1 text-xs text-stone-500">{school.hint}</p>
                  </div>
                  <span className={`admin-badge ${delta >= 0 ? "admin-badge-gold" : "admin-badge-neutral"}`}>
                    {delta >= 0 ? `+${delta}%` : `${delta}%`}
                  </span>
                </div>
                <label className="block">
                  <span className="admin-label">Coefficient</span>
                  <input
                    type="number"
                    min={0.7}
                    max={1.5}
                    step={0.01}
                    value={value}
                    disabled={loading || saving}
                    onChange={(event) =>
                      onChange({ ...coefficients, [school.key]: Number(event.target.value) })
                    }
                    className="admin-input"
                  />
                </label>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] transition-all"
                    style={{ width: `${Math.min(100, ((value - 0.7) / 0.8) * 100)}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-xl border border-[rgba(184,149,108,0.2)] bg-[#f5efe4]/50 p-4 text-sm text-stone-600">
          <strong className="text-stone-800">Comment ça fonctionne ?</strong>
          <p className="mt-2 leading-relaxed">
            Chaque coefficient ajuste le prix des produits scolaires pour l&apos;établissement
            correspondant. Un coefficient de <strong>1.00</strong> conserve le prix catalogue,{" "}
            <strong>1.10</strong> applique +10&nbsp;%. Les produits sont recalculés à la sauvegarde.
          </p>
        </aside>

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
          <button type="submit" disabled={loading || saving} className="admin-btn-primary">
            {saving ? "Sauvegarde..." : "Enregistrer les coefficients"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onReset()}
            className="admin-btn-secondary"
          >
            Réinitialiser
          </button>
          {loading ? <span className="text-sm text-stone-400">Chargement...</span> : null}
        </div>
      </form>
    </SectionPanel>
  );
}
