"use client";

import Image from "next/image";
import Link from "next/link";
import {
  categories,
  categoryImageMap,
  categorySubcategoriesMap,
  categoryToSlug,
  defaultProducts,
  type Product,
} from "@/lib/catalog";
import type { DashboardCategory } from "@/lib/dashboard-content";

type CategoryHoverMenuProps = {
  className?: string;
  categoryList?: DashboardCategory[];
  productsList?: Product[];
};

export default function CategoryHoverMenu({
  className,
  categoryList,
  productsList = defaultProducts,
}: CategoryHoverMenuProps) {
  const activeDashboardByName = new Map(
    (categoryList ?? [])
      .filter((category) => category.isActive)
      .map((category) => [category.name, category]),
  );
  const visibleCategories = categories.map((categoryName) => {
    const dashboardMatch = activeDashboardByName.get(categoryName);
    return {
      id: dashboardMatch?.id ?? `fallback-${categoryName}`,
      name: categoryName,
      slug:
        dashboardMatch?.slug ||
        categoryToSlug(categoryName) ||
        categoryName.toLowerCase().replaceAll(" ", "-"),
      image: dashboardMatch?.image || categoryImageMap[categoryName],
      isActive: true,
      createdAt: dashboardMatch?.createdAt ?? "",
    };
  });

  return (
    <aside className={`relative z-40 h-96 w-56 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className ?? ""}`}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Categories</p>
      <div className="pr-1">
      <ul className="space-y-1">
        {visibleCategories.map((category) => (
          <li key={`shared-banner-cat-${category.id}`}>
            <div className="group relative rounded-md border border-slate-100 bg-slate-50/60 px-2 py-1">
              <Link
                href={`/categories/${category.slug}`}
                className="flex items-center justify-between gap-2 text-sm font-medium text-slate-700 transition group-hover:text-violet-700"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 overflow-hidden rounded-full border border-slate-200">
                    <Image
                      src={category.image || categoryImageMap[category.name as keyof typeof categoryImageMap] || "/logo-proconfection.png"}
                      alt={category.name}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span>{category.name}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {productsList.filter((product) => product.category === category.name).length}
                </span>
              </Link>
              <div className="pointer-events-none invisible absolute left-full top-0 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Sous-categories
                </p>
                <ul className="space-y-1">
                  {(categorySubcategoriesMap[category.name as keyof typeof categorySubcategoriesMap] ?? ["General"]).map((subcategory) => (
                    <li key={`${category.slug}-${subcategory}`} className="group/sub relative">
                      <div
                        className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        {subcategory}
                      </div>
                      <div className="pointer-events-none invisible absolute left-full top-0 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition duration-150 group-hover/sub:pointer-events-auto group-hover/sub:visible group-hover/sub:opacity-100">
                        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Produits
                        </p>
                        <ul className="space-y-1">
                          {productsList
                            .filter(
                              (product) =>
                                product.category === category.name &&
                                product.subcategory === subcategory,
                            )
                            .slice(0, 5)
                            .map((product) => (
                              <li key={`${category}-${subcategory}-${product.id}`}>
                                <Link
                                  href={`/ventes-flash/${product.id}`}
                                  className="block rounded-md px-2 py-1 text-xs text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                                >
                                  {product.name}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
                <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                  {productsList
                    .filter((product) => product.category === category.name)
                    .slice(0, 3)
                    .map((product) => (
                      <li key={`${category}-quick-${product.id}`}>
                        <Link
                          href={`/ventes-flash/${product.id}`}
                          className="block rounded-md px-2 py-1 text-[11px] text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          {product.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </aside>
  );
}
