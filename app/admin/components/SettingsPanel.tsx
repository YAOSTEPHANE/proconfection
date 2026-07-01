"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { DEFAULT_SHOP_SETTINGS, type ShopSettings } from "@/lib/settings";
import { SectionPanel } from "./DashboardHeader";

type SettingsTab = "general" | "delivery" | "payments" | "display" | "social";

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "general", label: "Général" },
  { id: "delivery", label: "Livraison" },
  { id: "payments", label: "Paiements" },
  { id: "display", label: "Affichage" },
  { id: "social", label: "Réseaux" },
];

type SettingsPanelProps = {
  settings: ShopSettings;
  loading: boolean;
  saving: boolean;
  onChange: (settings: ShopSettings) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export default function SettingsPanel({
  settings,
  loading,
  saving,
  onChange,
  onSave,
  onReset,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  function patchGeneral<K extends keyof ShopSettings["general"]>(
    key: K,
    value: ShopSettings["general"][K],
  ) {
    onChange({ ...settings, general: { ...settings.general, [key]: value } });
  }

  function patchDelivery<K extends keyof ShopSettings["delivery"]>(
    key: K,
    value: ShopSettings["delivery"][K],
  ) {
    onChange({ ...settings, delivery: { ...settings.delivery, [key]: value } });
  }

  function patchPayments<K extends keyof ShopSettings["payments"]>(
    key: K,
    value: ShopSettings["payments"][K],
  ) {
    onChange({ ...settings, payments: { ...settings.payments, [key]: value } });
  }

  function patchDisplay<K extends keyof ShopSettings["display"]>(
    key: K,
    value: ShopSettings["display"][K],
  ) {
    onChange({ ...settings, display: { ...settings.display, [key]: value } });
  }

  function patchSocial<K extends keyof ShopSettings["social"]>(
    key: K,
    value: ShopSettings["social"][K],
  ) {
    onChange({ ...settings, social: { ...settings.social, [key]: value } });
  }

  return (
    <SectionPanel
      title="Paramètres"
      subtitle="Configuration globale de la boutique ProConfection"
      action={
        settings.updatedAt ? (
          <span className="admin-badge admin-badge-gold">
            Mis à jour {new Date(settings.updatedAt).toLocaleString("fr-FR")}
          </span>
        ) : null
      }
    >
      <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-100 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#f5efe4] to-[#faf6ef] text-[#9a7b4f] ring-1 ring-[rgba(184,149,108,0.3)]"
                : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {activeTab === "general" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom de la boutique">
              <input
                className="admin-input"
                value={settings.general.shopName}
                onChange={(e) => patchGeneral("shopName", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Ville">
              <input
                className="admin-input"
                value={settings.general.city}
                onChange={(e) => patchGeneral("city", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Slogan" className="md:col-span-2">
              <textarea
                className="admin-input min-h-20"
                value={settings.general.tagline}
                onChange={(e) => patchGeneral("tagline", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Email support">
              <input
                type="email"
                className="admin-input"
                value={settings.general.supportEmail}
                onChange={(e) => patchGeneral("supportEmail", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Téléphone support">
              <input
                className="admin-input"
                value={settings.general.supportPhone}
                onChange={(e) => patchGeneral("supportPhone", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Adresse">
              <input
                className="admin-input"
                value={settings.general.address}
                onChange={(e) => patchGeneral("address", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Pays">
              <input
                className="admin-input"
                value={settings.general.country}
                onChange={(e) => patchGeneral("country", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Horaires service client" className="md:col-span-2">
              <input
                className="admin-input"
                value={settings.general.businessHours}
                onChange={(e) => patchGeneral("businessHours", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
          </div>
        ) : null}

        {activeTab === "delivery" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Seuil livraison gratuite (FCFA)">
              <input
                type="number"
                min={0}
                className="admin-input"
                value={settings.delivery.freeShippingThreshold}
                onChange={(e) =>
                  patchDelivery("freeShippingThreshold", Number(e.target.value))
                }
                disabled={loading || saving}
              />
            </Field>
            <Field label="Délai min. (jours)">
              <input
                type="number"
                min={1}
                max={60}
                className="admin-input"
                value={settings.delivery.estimatedDaysMin}
                onChange={(e) => patchDelivery("estimatedDaysMin", Number(e.target.value))}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Délai max. (jours)">
              <input
                type="number"
                min={1}
                max={90}
                className="admin-input"
                value={settings.delivery.estimatedDaysMax}
                onChange={(e) => patchDelivery("estimatedDaysMax", Number(e.target.value))}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Message livraison" className="md:col-span-2">
              <textarea
                className="admin-input min-h-20"
                value={settings.delivery.deliveryMessage}
                onChange={(e) => patchDelivery("deliveryMessage", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Politique de retours" className="md:col-span-2">
              <textarea
                className="admin-input min-h-20"
                value={settings.delivery.returnsPolicy}
                onChange={(e) => patchDelivery("returnsPolicy", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
          </div>
        ) : null}

        {activeTab === "payments" ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleCard
                label="Paiement en ligne (Stripe)"
                description="Carte bancaire et paiement sécurisé via Stripe Checkout."
                checked={settings.payments.onlinePaymentEnabled}
                onChange={(checked) => patchPayments("onlinePaymentEnabled", checked)}
                disabled={loading || saving}
              />
              <ToggleCard
                label="Paiement à la livraison"
                description="Le client règle sa commande à la réception."
                checked={settings.payments.cashOnDeliveryEnabled}
                onChange={(checked) => patchPayments("cashOnDeliveryEnabled", checked)}
                disabled={loading || saving}
              />
            </div>
            <Field label="Devise affichée">
              <select
                className="admin-input max-w-xs"
                value={settings.payments.currencyCode}
                onChange={(e) => patchPayments("currencyCode", e.target.value)}
                disabled={loading || saving}
              >
                <option value="XOF">XOF — Franc CFA</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </Field>
          </div>
        ) : null}

        {activeTab === "display" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Message d'accueil" className="md:col-span-2">
              <textarea
                className="admin-input min-h-20"
                value={settings.display.welcomeMessage}
                onChange={(e) => patchDisplay("welcomeMessage", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <Field label="Bandeau promotionnel" className="md:col-span-2">
              <input
                className="admin-input"
                value={settings.display.promoBannerText}
                onChange={(e) => patchDisplay("promoBannerText", e.target.value)}
                disabled={loading || saving}
              />
            </Field>
            <ToggleCard
              label="Mode maintenance"
              description="Masque la boutique aux visiteurs et affiche un message dédié."
              checked={settings.display.maintenanceMode}
              onChange={(checked) => patchDisplay("maintenanceMode", checked)}
              disabled={loading || saving}
              className="md:col-span-2"
            />
            {settings.display.maintenanceMode ? (
              <>
                <Field label="Message de maintenance" className="md:col-span-2">
                  <textarea
                    className="admin-input min-h-20"
                    value={settings.display.maintenanceMessage}
                    onChange={(e) => patchDisplay("maintenanceMessage", e.target.value)}
                    disabled={loading || saving}
                  />
                </Field>
                <p className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Cliquez sur <strong>Enregistrer les paramètres</strong> ci-dessous pour appliquer le
                  changement. Testez ensuite l&apos;accueil en navigation privée —{" "}
                  <code className="rounded bg-white/80 px-1">/admin</code> reste accessible aux
                  administrateurs.
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {activeTab === "social" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["whatsapp", "WhatsApp"],
                ["tiktok", "TikTok"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className="admin-input"
                  placeholder={`URL ou identifiant ${label}`}
                  value={settings.social[key]}
                  onChange={(e) => patchSocial(key, e.target.value)}
                  disabled={loading || saving}
                />
              </Field>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
          <button type="submit" disabled={loading || saving} className="admin-btn-primary">
            {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
          <button
            type="button"
            disabled={loading || saving}
            onClick={onReset}
            className="admin-btn-secondary"
          >
            Réinitialiser
          </button>
          {loading ? <span className="text-sm text-stone-400">Chargement...</span> : null}
        </div>
      </form>

      <aside className="mt-6 rounded-xl border border-[rgba(184,149,108,0.2)] bg-gradient-to-br from-[#fffcf8] to-[#f5efe4] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9a7b4f]">Aperçu rapide</p>
        <div className="mt-3 space-y-2 text-sm text-stone-600">
          <p>
            <strong className="text-stone-900">{settings.general.shopName}</strong>
          </p>
          <p>{settings.general.tagline}</p>
          <p>
            {settings.general.supportPhone} — {settings.general.supportEmail}
          </p>
          <p className="text-[#9a7b4f]">{settings.display.promoBannerText}</p>
        </div>
      </aside>
    </SectionPanel>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-stone-100 bg-gradient-to-r from-white to-[#fffcf8] p-4 transition hover:border-[rgba(184,149,108,0.25)] ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-stone-300 text-[#b8956c] focus:ring-[#b8956c]"
      />
      <span>
        <span className="block text-sm font-semibold text-stone-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">{description}</span>
      </span>
    </label>
  );
}