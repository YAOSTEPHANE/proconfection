"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductSizeControls from "@/app/components/ProductSizeControls";
import { categoryToSlug, getProductPriceForSize, needsComboSizeSelection, slugToCategory, type Product } from "@/lib/catalog";
import type { DashboardCategory } from "@/lib/dashboard-content";

type CartItem = Product & { quantity: number; selectedSize?: string };
const CART_STORAGE_KEY = "proconfection_cart";

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

function shortenLabel(label: string, maxLength = 26): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug ?? "";
  const selectedSubcategory = searchParams.get("subcategory")?.trim() ?? "";
  const [dynamicCategories, setDynamicCategories] = useState<DashboardCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadContent() {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products", { cache: "no-store" }),
        ]);
        const categoriesData = (await categoriesResponse.json()) as
          | DashboardCategory[]
          | { error?: string };
        const productsData = (await productsResponse.json()) as Product[] | { error?: string };
        if (active && categoriesResponse.ok && Array.isArray(categoriesData)) {
          setDynamicCategories(categoriesData.filter((category) => category.isActive));
        }
        if (active && productsResponse.ok && Array.isArray(productsData)) {
          setProducts(productsData);
        } else if (active) {
          setProducts([]);
        }
      } catch {
        if (active) {
          setProducts([]);
        }
      }
    }
    void loadContent();
    return () => {
      active = false;
    };
  }, []);

  const selectedCategory = useMemo(() => {
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
  }, [dynamicCategories, products, slug]);

  const categoryProducts = useMemo(() => {
    const normalizedSlug = normalizeSlugLike(slug);
    const normalizedSelectedCategory = normalizeSlugLike(selectedCategory);
    const normalizedSelectedSubcategory = normalizeSlugLike(selectedSubcategory);
    return products.filter((product) => {
      const normalizedProductCategory = normalizeSlugLike(product.category);
      const categoryMatches =
        normalizedProductCategory === normalizedSlug ||
        normalizedProductCategory === normalizedSelectedCategory ||
        normalizeSlugLike(categoryToSlug(product.category)) === normalizedSlug;
      const subcategoryMatches =
        !selectedSubcategory ||
        normalizeSlugLike(product.subcategory ?? "") === normalizedSelectedSubcategory;
      return categoryMatches && subcategoryMatches;
    });
  }, [products, selectedCategory, selectedSubcategory, slug]);

  const availableSubcategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter((product) => {
              const normalizedProductCategory = normalizeSlugLike(product.category);
              const normalizedSelectedCategory = normalizeSlugLike(selectedCategory);
              return (
                normalizedProductCategory === normalizedSelectedCategory &&
                typeof product.subcategory === "string" &&
                product.subcategory.trim().length > 0
              );
            })
            .map((product) => product.subcategory as string),
        ),
      ),
    [products, selectedCategory],
  );

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

  if (!slug) {
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
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <header className="space-y-3">
        <Link href="/categories" className="text-sm font-semibold text-indigo-600">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{selectedCategory}</h1>
        {availableSubcategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/categories/${slug}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                !selectedSubcategory
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"
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

      {categoryProducts.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun produit dans cette categorie pour le moment. Verifiez dans l&apos;admin que le
          produit a bien la categorie « {selectedCategory} »
          {selectedSubcategory ? ` et la sous-categorie « ${selectedSubcategory} »` : ""}.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryProducts.map((product) => {
            const primaryImage = product.images?.[0] ?? product.image;
            const hoverImage = product.images?.[1] ?? primaryImage;
            return (
              <article
                key={product.id}
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
      )}
    </main>
  );
}
