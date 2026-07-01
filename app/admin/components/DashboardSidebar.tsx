import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  overview: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
    </svg>
  ),
  pricing: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  products: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  categories: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  banners: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  orders: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  ),
  users: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  settings: (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export type DashboardSectionId =
  | "overview"
  | "pricing"
  | "products"
  | "categories"
  | "banners"
  | "orders"
  | "users"
  | "settings";

type NavItem = { id: DashboardSectionId; label: string };

const navItems: NavItem[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "pricing", label: "Tarification" },
  { id: "products", label: "Produits" },
  { id: "categories", label: "Catégories" },
  { id: "banners", label: "Bannières" },
  { id: "orders", label: "Commandes" },
  { id: "users", label: "Utilisateurs" },
  { id: "settings", label: "Paramètres" },
];

type ProductMenuTarget = "dashboard-products-form" | "dashboard-products-search" | "dashboard-products-list";

type DashboardSidebarProps = {
  activeSection: DashboardSectionId;
  onNavigate: (section: DashboardSectionId) => void;
  onProductNavigate: (target: ProductMenuTarget) => void;
};

export default function DashboardSidebar({
  activeSection,
  onNavigate,
  onProductNavigate,
}: DashboardSidebarProps) {
  return (
    <aside className="admin-glass sticky top-6 flex flex-col rounded-[1.75rem] p-4 lg:min-h-[calc(100vh-3rem)]">
      <div className="mb-6 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956c]">
          Navigation
        </p>
        <p className="mt-1 text-sm font-medium text-stone-600">Espace administration</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((entry) => {
          const isActive = activeSection === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onNavigate(entry.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#f5efe4] to-[#faf6ef] text-[#9a7b4f] shadow-sm ring-1 ring-[rgba(184,149,108,0.25)]"
                  : "text-stone-600 hover:bg-white/80 hover:text-stone-900"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#b8956c] text-white shadow-sm"
                    : "bg-stone-100 text-stone-500 group-hover:bg-[#f5efe4] group-hover:text-[#9a7b4f]"
                }`}
              >
                {icons[entry.id]}
              </span>
              {entry.label}
            </button>
          );
        })}

        {activeSection === "products" ? (
          <div className="mt-3 space-y-0.5 rounded-xl border border-[rgba(184,149,108,0.2)] bg-[#fffcf8] p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#b8956c]">
              Actions produits
            </p>
            {(
              [
                ["dashboard-products-form", "Ajouter / Modifier"],
                ["dashboard-products-search", "Rechercher"],
                ["dashboard-products-list", "Liste catalogue"],
              ] as const
            ).map(([target, label]) => (
              <button
                key={target}
                type="button"
                onClick={() => onProductNavigate(target)}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-stone-600 transition hover:bg-[#f5efe4] hover:text-[#9a7b4f]"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </nav>

      <div className="mt-6 border-t border-stone-200/60 pt-4">
        <div className="rounded-xl bg-gradient-to-br from-[#f5efe4] to-white p-3 ring-1 ring-[rgba(184,149,108,0.15)]">
          <p className="text-xs font-semibold text-stone-800">ProConfection</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
            Gestion premium de votre boutique en ligne.
          </p>
        </div>
      </div>
    </aside>
  );
}
