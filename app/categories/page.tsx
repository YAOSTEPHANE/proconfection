 "use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  categories,
  categoryImageMap,
  categoryToSlug,
  defaultProducts,
  type Product,
} from "@/lib/catalog";
import type { DashboardCategory } from "@/lib/dashboard-content";

function normalizeCategoryKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function productMatchesCategory(productCategory: string, categoryName: string): boolean {
  return normalizeCategoryKey(productCategory) === normalizeCategoryKey(categoryName);
}

export default function CategoriesPage() {
  const [dynamicCategories, setDynamicCategories] = useState<DashboardCategory[]>([]);
  const [products, setProducts] = useState<Product[]>(defaultProducts);

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

  const categoryCards = useMemo(() => {
    const activeCategories =
      dynamicCategories.length > 0
        ? dynamicCategories
        : categories.map((category) => ({
            id: `fallback-${category}`,
            name: category,
            slug: categoryToSlug(category),
            image: categoryImageMap[category],
            isActive: true,
            createdAt: "",
          }));
    return activeCategories.map((category) => ({
      name: category.name,
      slug: category.slug,
      image:
        (products.find((product) => productMatchesCategory(product.category, category.name))
          ?.image ??
          category.image) ||
        categoryImageMap[category.name as keyof typeof categoryImageMap],
      count: products.filter((product) =>
        productMatchesCategory(product.category, category.name),
      ).length,
    }));
  }, [dynamicCategories, products]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Toutes les categories</h1>
        <p className="text-sm text-slate-600">
          Parcourez chaque categorie et decouvrez nos produits.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryCards.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                width={900}
                height={600}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="h-44 w-full bg-slate-100" />
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <p className="text-sm text-slate-600">{category.count} article(s)</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
