"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  categoryToSlug,
  defaultProducts,
  getProductPriceForSize,
  slugToCategory,
  type Product,
} from "@/lib/catalog";
import type { DashboardCategory } from "@/lib/dashboard-content";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

const FALLBACK_IMAGE = "/logo-proconfection.png";

function normalizeSlugLike(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug ?? "";
  const selectedSubcategory = searchParams.get("subcategory")?.trim() ?? "";
  const [dynamicCategories, setDynamicCategories] = useState<DashboardCategory[]>([]);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function loadContent() {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products", { cache: "no-store" }),
        ]);
        const categoriesData = (await categoriesResponse.json()) as DashboardCategory[] | { error?: string };
        const productsData = (await productsResponse.json()) as Product[] | { error?: string };
        if (active && categoriesResponse.ok && Array.isArray(categoriesData)) {
          setDynamicCategories(categoriesData.filter((category) => category.isActive));
        }
        if (active && productsResponse.ok && Array.isArray(productsData)) {
          setProducts(productsData);
        }
      } catch {
        // Keep fallback data on network errors.
      }
    }
    void loadContent();
    return () => {
      active = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => {
      const normalizedSlug = normalizeSlugLike(slug);
      const fromDynamic = dynamicCategories.find(
        (category) =>
          normalizeSlugLike(category.slug) === normalizedSlug ||
          normalizeSlugLike(category.name) === normalizedSlug ||
          normalizeSlugLike(categoryToSlug(category.name)) === normalizedSlug,
      )?.name;
      if (fromDynamic) {
        return fromDynamic;
      }
      const fromCatalog = slugToCategory(slug);
      if (fromCatalog) {
        return fromCatalog;
      }
      const fromProductCategory = products.find(
        (product) => normalizeSlugLike(product.category) === normalizedSlug,
      )?.category;
      if (fromProductCategory) {
        return fromProductCategory;
      }
      return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    },
    [dynamicCategories, products, slug],
  );
  const categoryProducts = useMemo(
    () => {
      const normalizedSlug = normalizeSlugLike(slug);
      const normalizedSelectedCategory = normalizeSlugLike(selectedCategory);
      const normalizedSelectedSubcategory = normalizeSlugLike(selectedSubcategory);
      return products.filter((product) => {
        const normalizedProductCategory = normalizeSlugLike(product.category);
        const categoryMatches =
          normalizedProductCategory === normalizedSlug ||
          normalizedProductCategory === normalizedSelectedCategory;
        const subcategoryMatches =
          !selectedSubcategory ||
          normalizeSlugLike(product.subcategory ?? "") === normalizedSelectedSubcategory;
        return categoryMatches && subcategoryMatches;
      });
    },
    [products, selectedCategory, selectedSubcategory, slug],
  );
  const availableSubcategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter(
              (product) =>
                product.category.toLowerCase() === selectedCategory.toLowerCase() &&
                typeof product.subcategory === "string" &&
                product.subcategory.trim().length > 0,
            )
            .map((product) => product.subcategory as string),
        ),
      ),
    [products, selectedCategory],
  );

  if (!slug || categoryProducts.length === 0) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Categorie introuvable</h1>
        <Link href="/categories" className="text-sm text-indigo-600">
          Retour aux categories
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <Link href="/categories" className="text-sm text-indigo-600">
          Voir toutes les categories
        </Link>
        <h1 className="text-2xl font-bold">{selectedCategory}</h1>
        {availableSubcategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/categories/${slug}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedSubcategory
                  ? "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  : "bg-indigo-600 text-white"
              }`}
            >
              Toutes
            </Link>
            {availableSubcategories.map((subcategory) => (
              <Link
                key={`subcategory-filter-${subcategory}`}
                href={`/categories/${slug}?subcategory=${encodeURIComponent(subcategory)}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedSubcategory === subcategory
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {subcategory}
              </Link>
            ))}
          </div>
        ) : null}
        {selectedSubcategory ? (
          <p className="text-sm font-medium text-indigo-700">
            Sous-categorie: {selectedSubcategory}
          </p>
        ) : null}
        <p className="text-sm text-slate-600">
          {categoryProducts.length} article(s) disponibles dans cette categorie.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categoryProducts.map((product, index) => {
          const selectedSize = selectedSizes[product.id] ?? "";
          const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
          const discount = getDisplayDiscount(product, 15 + (index % 3) * 5);
          const currentPrice = getProductPriceForSize(product, selectedSize || undefined);
          const oldPrice = Math.round(currentPrice / (1 - discount / 100));
          const primaryImage = product.images?.[0] ?? product.image;
          const hoverImage = product.images?.[1] ?? primaryImage;
          return (
            <article
              key={product.id}
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
              <div className="space-y-2 p-3">
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
                      <option key={`category-size-${product.id}-${size}`} value={size}>
                        {size} — {currency.format(getProductPriceForSize(product, size))}
                      </option>
                    ))}
                  </select>
                ) : null}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <strong className="text-sm text-violet-700">
                      {currency.format(currentPrice)}
                    </strong>
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
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
