"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  defaultProducts,
  getProductPriceForSize,
  getRemainingStock,
  type Product,
} from "@/lib/catalog";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

function getStockWidthClass(stock: number): string {
  if (stock <= 4) return "w-1/5";
  if (stock <= 8) return "w-2/5";
  if (stock <= 12) return "w-3/5";
  if (stock <= 16) return "w-4/5";
  return "w-full";
}

const FALLBACK_IMAGE = "/logo-proconfection.png";

function getDisplayDiscount(product: Product, fallbackDiscount: number): number {
  if (typeof product.discountPercentage === "number" && product.discountPercentage > 0) {
    return product.discountPercentage;
  }
  if (
    typeof product.oldPrice === "number" &&
    product.oldPrice > product.price &&
    product.price > 0
  ) {
    return Math.max(1, Math.round((1 - product.price / product.oldPrice) * 100));
  }
  return fallbackDiscount;
}

function shortenLabel(label: string, maxLength = 26): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export default function VentesFlashPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = (await response.json()) as Product[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          const message =
            !Array.isArray(data) && data.error
              ? data.error
              : "Impossible de charger les produits.";
          throw new Error(message);
        }
        if (active) {
          setProducts(data);
        }
      } catch (error) {
        if (active) {
          setProducts(defaultProducts);
          setProductsError(error instanceof Error ? error.message : "Erreur de chargement.");
        }
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return products;
    }
    return products.filter((product) =>
      product.name.toLowerCase().includes(normalizedQuery),
    );
  }, [products, query]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
            Offres limitees
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Ventes Flash | Chaque jour</h1>
          <p className="mt-1 text-sm text-slate-600">
            Retrouvez tous les articles en promotion et les meilleures offres du moment.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700"
        >
          Retour a l&apos;accueil
        </Link>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher dans les ventes flash..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300"
        />
      </div>

      {productsError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {productsError}
        </p>
      ) : null}

      {loadingProducts ? (
        <p className="text-sm text-slate-500">Chargement des produits...</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, index) => {
          const selectedSize = selectedSizes[product.id] ?? "";
          const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
          const discount = getDisplayDiscount(product, 10 + ((index % 4) + 1) * 5);
          const currentPrice = getProductPriceForSize(product, selectedSize || undefined);
          const oldPrice = Math.round(currentPrice / (1 - discount / 100));
          const remaining =
            typeof product.stock === "number" ? product.stock : getRemainingStock(product.id);
          const primaryImage = product.images?.[0] ?? product.image;
          const hoverImage = product.images?.[1] ?? primaryImage;
          return (
          <article
            key={`flash-${product.id}`}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
              -{discount}%
            </span>
            <Link href={`/ventes-flash/${product.id}`} className="block">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f8f7f5]">
                <Image
                  src={primaryImage}
                  alt={product.name}
                  width={900}
                  height={1200}
                  className="absolute inset-0 h-full w-full object-contain object-center transition duration-300 group-hover:opacity-0"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <Image
                  src={hoverImage}
                  alt={`${product.name} - vue secondaire`}
                  width={900}
                  height={1200}
                  className="absolute inset-0 h-full w-full object-contain object-center opacity-0 transition duration-300 group-hover:opacity-100"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
            </Link>
            <div className="space-y-2 p-4">
              <Link
                href={`/ventes-flash/${product.id}`}
                className="block truncate whitespace-nowrap text-sm font-semibold text-slate-800 transition hover:text-violet-700"
              >
                {shortenLabel(product.name)}
              </Link>
              {product.subcategory ? (
                <p className="text-[11px] text-slate-500">{product.subcategory}</p>
              ) : null}
              {hasSizes ? (
                <select
                  value={selectedSize}
                  onChange={(event) =>
                    setSelectedSizes((previous) => ({
                      ...previous,
                      [product.id]: event.target.value,
                    }))
                  }
                  aria-label={`Choisir une taille pour ${product.name}`}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">Choisir la taille</option>
                  {product.sizes?.map((size) => (
                    <option key={`flash-size-${product.id}-${size}`} value={size}>
                      {size} — {currency.format(getProductPriceForSize(product, size))}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <strong className="text-sm text-violet-700">{currency.format(currentPrice)}</strong>
                  <span className="text-xs text-slate-400 line-through">
                    {currency.format(oldPrice)}
                  </span>
                </div>
                <Link
                  href={`/ventes-flash/${product.id}`}
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                  Voir details
                </Link>
              </div>
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-medium text-rose-600">{remaining} articles restants</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full bg-rose-500 ${getStockWidthClass(remaining)}`} />
                </div>
              </div>
            </div>
          </article>
          );
        })}
      </section>
    </main>
  );
}
