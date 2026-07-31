"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories, categoryToSlug, type Product } from "@/lib/catalog";

const CART_STORAGE_KEY = "proconfection_cart";

type CartItem = { quantity: number };
const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export default function SiteHeader() {
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const searchPreview = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [products, query]);

  useEffect(() => {
    const readCart = () => {
      try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
        setCartCount(Array.isArray(items) ? items.reduce((s, i) => s + (i.quantity ?? 0), 0) : 0);
      } catch {
        setCartCount(0);
      }
    };
    readCart();
    window.addEventListener("storage", readCart);
    window.addEventListener("proconfection-cart-updated", readCart);
    return () => {
      window.removeEventListener("storage", readCart);
      window.removeEventListener("proconfection-cart-updated", readCart);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = (await response.json()) as Product[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          return;
        }
        if (active) {
          setProducts(data);
        }
      } catch {
        if (active) {
          setProducts([]);
        }
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
        <Link
          href="/"
          aria-label="Accueil ProConfection"
          className="inline-flex items-center gap-3"
        >
          <Image
            src="/logo-proconfection.png"
            alt="ProConfection Internationale"
            width={220}
            height={122}
            className="h-10 w-auto"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-slate-900">ProConfection</p>
            <p className="text-[11px] leading-tight text-slate-500">Uniformes et accessoires scolaires</p>
          </div>
        </Link>

        <div className="order-3 w-full md:order-0 md:mx-auto md:w-96">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-violet-300"
            />
            {query.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {searchPreview.length > 0 ? (
                  <ul className="max-h-80 overflow-y-auto">
                    {searchPreview.filter(Boolean).map((product) => (
                      <li
                        key={`global-search-${product.id}`}
                        className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
                      >
                        <Image
                          src={product.image || product.images?.[0] || "/logo-proconfection.png"}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/ventes-flash/${product.id}`}
                            className="block truncate text-sm font-medium text-slate-800 hover:text-violet-700"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-slate-500">{product.category}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {currency.format(product.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-xs text-slate-500">Aucun produit ne correspond a votre recherche.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((previous) => !previous)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Categories
              <span className="text-[10px]">{isCategoriesOpen ? "▲" : "▼"}</span>
            </button>
            {isCategoriesOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <Link
                  href="/categories"
                  onClick={() => setIsCategoriesOpen(false)}
                  className="block px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Voir toutes les categories
                </Link>
                <ul className="mt-1 border-t border-slate-100 py-1">
                  {categories.map((category) => (
                    <li key={`header-category-${category}`}>
                      <Link
                        href={`/categories/${categoryToSlug(category)}`}
                        onClick={() => setIsCategoriesOpen(false)}
                        className="block px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 hover:text-violet-700"
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <Link
            href="/ventes-flash"
            className="hidden rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 lg:inline-flex"
          >
            Ventes flash
          </Link>
          <Link
            href="/se-connecter"
            className="cursor-pointer rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:px-4 sm:text-sm"
          >
            Se connecter
          </Link>
          <Link
            href="/panier"
            aria-label="Ouvrir le panier"
            className="cursor-pointer relative rounded-full bg-slate-900 p-2 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M3 4h2l2.2 10.2A2 2 0 0 0 9.2 16H17a2 2 0 0 0 2-1.5L21 7H7" />
            </svg>
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold leading-none text-white">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
