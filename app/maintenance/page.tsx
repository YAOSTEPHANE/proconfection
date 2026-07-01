import Image from "next/image";
import Link from "next/link";
import { getDb } from "@/lib/mongodb";
import { DEFAULT_SHOP_SETTINGS, getShopSettings } from "@/lib/settings";

export default async function MaintenancePage() {
  let message = DEFAULT_SHOP_SETTINGS.display.maintenanceMessage;
  let shopName = DEFAULT_SHOP_SETTINGS.general.shopName;

  try {
    const db = await getDb();
    const settings = await getShopSettings(db);
    message = settings.display.maintenanceMessage;
    shopName = settings.general.shopName;
  } catch {
    // Valeurs par défaut
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="admin-card-elevated admin-animate-in w-full max-w-lg overflow-hidden text-center">
        <div className="relative border-b border-stone-100 bg-gradient-to-r from-[#fffcf8] via-white to-[#faf6ef] px-8 py-10">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#b8956c] to-transparent" />
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[rgba(184,149,108,0.2)]">
            <Image
              src="/logo-proconfection.png"
              alt={shopName}
              width={56}
              height={56}
              className="h-10 w-auto"
              priority
            />
          </div>
          <span className="admin-badge admin-badge-warning">Maintenance en cours</span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">
            Boutique temporairement indisponible
          </h1>
        </div>

        <div className="space-y-6 px-8 py-8">
          <p className="text-base leading-relaxed text-stone-600">{message}</p>
          <p className="text-sm text-stone-400">
            Merci de votre patience. L&apos;équipe {shopName} revient très bientôt.
          </p>
          <div className="admin-gold-line" />
          <Link href="/se-connecter" prefetch={false} className="admin-btn-secondary inline-flex text-sm">
            Espace administration
          </Link>
        </div>
      </div>
    </main>
  );
}
