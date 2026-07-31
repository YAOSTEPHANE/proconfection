"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductSizeControls from "@/app/components/ProductSizeControls";
import {
  getProductPriceForSize,
  needsComboSizeSelection,
  type Product,
} from "@/lib/catalog";

type CartItem = Product & { quantity: number; selectedSize?: string };
const CART_STORAGE_KEY = "proconfection_cart";

const FALLBACK_IMAGE = "/logo-proconfection.png";

function shortenLabel(label: string, maxLength = 26): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export default function VentesFlashPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);

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
          setProducts([]);
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
    return products.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.subcategory ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [products, query]);

  function addToCart(product: Product, selectedSize?: string) {
    const normalizedSize = selectedSize?.trim();
    if (needsComboSizeSelection(product) && !normalizedSize) {
      return;
    }
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    if (hasSizes && !needsComboSizeSelection(product) && !normalizedSize) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as CartItem[]) : [];
      const unitPrice = getProductPriceForSize(product, normalizedSize);
      const existing = current.find(
        (item) => item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? ""),
      );
      const next = existing
        ? current.map((item) =>
            item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? "")
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { ...product, price: unitPrice, quantity: 1, selectedSize: normalizedSize }];
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("proconfection-cart-updated"));
      setLastAddedProductId(product.id);
      window.setTimeout(
        () => setLastAddedProductId((currentId) => (currentId === product.id ? null : currentId)),
        1400,
      );
    } catch {
      // Ignore localStorage errors.
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Promotions
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Ventes Flash</h1>
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
        {filteredProducts.map((product) => {
          const primaryImage = product.images?.[0] ?? product.image;
          const hoverImage = product.images?.[1] ?? primaryImage;
          return (
            <article
              key={`flash-${product.id}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
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
                <ProductSizeControls
                  product={product}
                  added={lastAddedProductId === product.id}
                  onAddToCart={(selectedSize) => addToCart(product, selectedSize)}
                />
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
