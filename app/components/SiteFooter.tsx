import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-4">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white">ProConfection</h2>
          <p className="text-sm text-slate-300">
            Votre boutique mode premium: vetements, chaussures, sacs et accessoires.
          </p>
          <p className="text-xs text-slate-400">Service client: Lun - Sam, 8h - 20h</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-100">
            Navigation
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="transition hover:text-white">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/categories" className="transition hover:text-white">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/ventes-flash" className="transition hover:text-white">
                Ventes flash
              </Link>
            </li>
            <li>
              <Link href="/panier" className="transition hover:text-white">
                Panier
              </Link>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Aide</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/se-connecter" className="transition hover:text-white">
                Mon compte
              </Link>
            </li>
            <li>
              <a href="#" className="transition hover:text-white">
                Livraison et retours
              </a>
            </li>
            <li>
              <a href="#" className="transition hover:text-white">
                Conditions generales
              </a>
            </li>
            <li>
              <a href="#" className="transition hover:text-white">
                Politique de confidentialite
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-100">
            Contact
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Abidjan, Cote d&apos;Ivoire</li>
            <li>+225 07 00 00 00 00</li>
            <li>contact@proconfection.shop</li>
          </ul>
          <p className="text-xs text-slate-400">
            Newsletter bientot disponible pour recevoir les offres exclusives.
          </p>
        </section>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ProConfection. Tous droits reserves.</p>
          <p>Paiement securise • Livraison rapide • Support local</p>
        </div>
      </div>
    </footer>
  );
}
