"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CategoryHoverMenu from "@/app/components/CategoryHoverMenu";
import {
  categories,
  categoryImageMap,
  categorySubcategoriesMap,
  categoryToSlug,
  defaultProducts,
  getProductPriceForSize,
  getRemainingStock,
  type Product,
} from "@/lib/catalog";
import type { DashboardBanner, DashboardCategory } from "@/lib/dashboard-content";

type CartItem = Product & { quantity: number; selectedSize?: string };
const CART_STORAGE_KEY = "proconfection_cart";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});
const FALLBACK_IMAGE = "/logo-proconfection.png";

function getStockWidthClass(stock: number): string {
  if (stock <= 4) return "w-1/5";
  if (stock <= 8) return "w-2/5";
  if (stock <= 12) return "w-3/5";
  if (stock <= 16) return "w-4/5";
  return "w-full";
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

function getDisplayOldPrice(product: Product, discount: number): number {
  if (typeof product.oldPrice === "number" && product.oldPrice > product.price) {
    return product.oldPrice;
  }
  if (discount > 0 && discount < 100) {
    return Math.round(product.price / (1 - discount / 100));
  }
  return Math.round(product.price * 1.2);
}

function shortenLabel(label: string, maxLength = 26): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | "Tous">(
    "Tous",
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) {
        return [];
      }
      const parsed = JSON.parse(savedCart) as CartItem[];
      return Array.isArray(parsed) ? parsed.filter((item) => item.quantity > 0) : [];
    } catch {
      return [];
    }
  });
  const [checkoutDone, setCheckoutDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [midBannerIndex, setMidBannerIndex] = useState(0);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [dynamicCategories, setDynamicCategories] = useState<DashboardCategory[]>([]);
  const [dynamicBanners, setDynamicBanners] = useState<DashboardBanner[]>([]);
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);

  const fallbackBannerSlides = useMemo(
    () => [
      {
        tag: "Collection",
        title: "Nouvelle collection ProConfection 2026",
        description: "Decouvrez les pieces phares de la saison a prix preferentiels.",
        cta: "Voir la collection",
        price: "A partir de 14 000 XOF",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
      },
      {
        tag: "Livraison",
        title: "Livraison rapide partout en Cote d'Ivoire",
        description: "Passez commande en quelques clics et suivez votre colis en temps reel.",
        cta: "Passer commande",
        price: "Promo -15% cette semaine",
        image:
          "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80",
      },
      {
        tag: "Premium",
        title: "Mode, accessoires et beaute premium",
        description: "Des articles soigneusement selectionnes pour un style elegant au quotidien.",
        cta: "Decouvrir la boutique",
        price: "Best-sellers des 32 000 XOF",
        image:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
      },
    ],
    [],
  );

  const bannerSlides = useMemo(() => {
    const heroBanners = dynamicBanners.filter(
      (banner) => banner.isActive && banner.position === "hero",
    );
    if (heroBanners.length === 0) {
      return fallbackBannerSlides;
    }
    return heroBanners.map((banner) => ({
      tag: "Collection",
      title: banner.title,
      description: banner.subtitle || "Promotion exclusive",
      cta: "Voir l'offre",
      price: "Offre en cours",
      image: banner.image,
    }));
  }, [dynamicBanners, fallbackBannerSlides]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBannerIndex((previous) => (previous + 1) % bannerSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [bannerSlides.length]);
  const fallbackSideBanners = useMemo(
    () => [
      {
        title: "Chaussures premium",
        price: "39 000 XOF",
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Sacs tendance",
        price: "28 000 XOF",
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
      },
    ],
    [],
  );
  const sideBanners = useMemo(() => {
    const sidebarBanners = dynamicBanners
      .filter((banner) => banner.isActive && banner.position === "sidebar")
      .slice(0, 2)
      .map((banner) => ({
        title: banner.title,
        price: "Offre",
        image: banner.image,
      }));
    return sidebarBanners.length === 2 ? sidebarBanners : fallbackSideBanners;
  }, [dynamicBanners, fallbackSideBanners]);
  const fallbackMidPromoBanners = useMemo(
    () => [
      {
        title: "Bijoux iconiques",
        subtitle: "Nouvelles pieces en edition limitee",
        image:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=80",
      },
      {
        title: "Collection sport active",
        subtitle: "Confort et performance au quotidien",
        image:
          "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=1600&q=80",
      },
      {
        title: "Style premium urbain",
        subtitle: "Looks modernes pour chaque occasion",
        image:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
      },
      {
        title: "Offres exclusives",
        subtitle: "Jusqu'a -30% sur une selection",
        image:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
      },
      {
        title: "Accessoires tendance",
        subtitle: "Ajoutez la touche finale a votre tenue",
        image:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1600&q=80",
      },
    ],
    [],
  );
  const midPromoBanners = useMemo(() => {
    const middleBanners = dynamicBanners
      .filter((banner) => banner.isActive && banner.position === "middle")
      .map((banner) => ({
        title: banner.title,
        subtitle: banner.subtitle || "Offre du moment",
        image: banner.image,
      }));
    return middleBanners.length > 0 ? middleBanners : fallbackMidPromoBanners;
  }, [dynamicBanners, fallbackMidPromoBanners]);

  const visibleMidPromoBanners = useMemo(() => {
    return Array.from({ length: 3 }, (_, offset) => {
      return midPromoBanners[(midBannerIndex + offset) % midPromoBanners.length];
    });
  }, [midBannerIndex, midPromoBanners]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMidBannerIndex((previous) => (previous + 1) % midPromoBanners.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [midPromoBanners.length]);

  useEffect(() => {
    let active = true;

    async function loadHomepageContent() {
      try {
        const productsResponse = await fetch("/api/products", { cache: "no-store" });
        const productsData = (await productsResponse.json()) as Product[] | { error?: string };
        if (productsResponse.ok && Array.isArray(productsData) && active) {
          setProducts(productsData);
        } else if (active) {
          setProducts(defaultProducts);
        }
      } catch {
        if (active) {
          setProducts(defaultProducts);
        }
      }

      try {
        const categoriesResponse = await fetch("/api/categories", { cache: "no-store" });
        const categoriesData = (await categoriesResponse.json()) as
          | DashboardCategory[]
          | { error?: string };
        if (categoriesResponse.ok && Array.isArray(categoriesData) && active) {
          setDynamicCategories(categoriesData.filter((category) => category.isActive));
        } else if (active) {
          setDynamicCategories([]);
        }
      } catch {
        if (active) {
          setDynamicCategories([]);
        }
      }

      try {
        const bannersResponse = await fetch("/api/banners", { cache: "no-store" });
        const bannersData = (await bannersResponse.json()) as DashboardBanner[] | { error?: string };
        if (bannersResponse.ok && Array.isArray(bannersData) && active) {
          setDynamicBanners(bannersData);
        } else if (active) {
          setDynamicBanners([]);
        }
      } catch {
        if (active) {
          setDynamicBanners([]);
        }
      }
    }

    void loadHomepageContent();
    return () => {
      active = false;
    };
  }, []);

  const activeCategoryCards = useMemo(
    () =>
      dynamicCategories.length > 0
        ? dynamicCategories
        : categories.map((category) => ({
            id: `fallback-${category}`,
            name: category,
            slug: categoryToSlug(category),
            image: categoryImageMap[category],
            isActive: true,
            createdAt: "",
          })),
    [dynamicCategories],
  );

  const subcategoryHighlights = useMemo(() => {
    return categories.flatMap((categoryName) => {
      const category =
        activeCategoryCards.find((entry) => entry.name === categoryName) ?? {
          id: `fallback-${categoryName}`,
          name: categoryName,
          image: categoryImageMap[categoryName as keyof typeof categoryImageMap],
        };
      const subcategories =
        categorySubcategoriesMap[categoryName as keyof typeof categorySubcategoriesMap] ?? [];
      return subcategories.map((subcategory) => ({
        id: `${category.id}-${subcategory}`,
        name: subcategory,
        parentCategory: categoryName,
        image:
          products.find(
            (product) =>
              product.category === categoryName && product.subcategory === subcategory,
          )?.image ??
          products.find((product) => product.category === categoryName)?.image ??
          (category.image || categoryImageMap[categoryName as keyof typeof categoryImageMap]),
      }));
    });
  }, [activeCategoryCards, products]);
  const displayedSubcategoryHighlights = useMemo(
    () =>
      showAllSubcategories
        ? subcategoryHighlights
        : subcategoryHighlights.slice(0, 10),
    [showAllSubcategories, subcategoryHighlights],
  );
  const productsByCategory = useMemo(() => {
    return activeCategoryCards.map((category) => ({
      category: category.name,
      slug: category.slug,
      items: [...products]
        .filter((product) => product.category === category.name)
        .reverse()
        .slice(0, 6),
    }));
  }, [activeCategoryCards, products]);
  const flashProducts = useMemo(
    () => {
      return [...products].reverse().slice(0, 6);
    },
    [products],
  );
  const cartTotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("proconfection-cart-updated"));
  }, [cart]);

  function addToCart(product: Product, selectedSize?: string) {
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const normalizedSize = selectedSize?.trim();
    if (hasSizes && !normalizedSize) {
      return;
    }
    setCheckoutDone(null);
    setError(null);
    setLastAddedProductId(product.id);
    window.setTimeout(() => setLastAddedProductId((current) => (current === product.id ? null : current)), 1400);
    setCart((previous) => {
      const unitPrice = getProductPriceForSize(product, normalizedSize);
      const existing = previous.find(
        (item) => item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? ""),
      );
      if (existing) {
        return previous.map((item) =>
          item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? "")
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...previous, { ...product, price: unitPrice, quantity: 1, selectedSize: normalizedSize }];
    });
  }

  function changeQuantity(id: string, selectedSize: string | undefined, delta: number) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id && (item.selectedSize ?? "") === (selectedSize ?? "")
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function checkout() {
    if (cart.length === 0) {
      return;
    }
    setError(null);
    setLoadingCheckout(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        orderId?: string;
        checkoutUrl?: string | null;
        error?: string;
      };

      if (!response.ok || !data.success || !data.orderId || !data.checkoutUrl) {
        setError(data.error ?? "Impossible de finaliser la commande.");
        return;
      }

      setCheckoutDone(data.orderId);
      setCart([]);
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Erreur reseau lors du checkout.");
    } finally {
      setLoadingCheckout(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="mx-auto mb-4 flex max-w-7xl flex-col items-stretch gap-4 lg:flex-row">
          <CategoryHoverMenu
            className="hidden self-stretch lg:block"
            categoryList={activeCategoryCards}
            productsList={products}
          />

          <div className="relative h-80 w-full overflow-hidden rounded-2xl p-5 text-white shadow-lg sm:h-96 sm:p-6 xl:max-w-[760px]">
            <Image
              src={bannerSlides[bannerIndex].image}
              alt={bannerSlides[bannerIndex].title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/75 via-indigo-950/65 to-violet-900/65" />
            <div className="relative h-full">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                {bannerSlides[bannerIndex]?.tag}
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold">{bannerSlides[bannerIndex]?.title}</h2>
                  <p className="mt-1 text-base text-white/90">
                    {bannerSlides[bannerIndex]?.description}
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold text-white">
                    {bannerSlides[bannerIndex]?.price}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Tous")}
                  className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700"
                >
                  {bannerSlides[bannerIndex]?.cta}
                </button>
              </div>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center justify-center gap-2">
                {bannerSlides.map((slide, index) => (
                  <button
                    key={`banner-dot-${slide.title}`}
                    type="button"
                    onClick={() => setBannerIndex(index)}
                    aria-label={`Aller a la banniere ${index + 1}`}
                    className={`h-2.5 rounded-full transition ${
                      bannerIndex === index
                        ? "w-7 bg-white"
                        : "w-2.5 bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 gap-4 lg:flex lg:w-72 lg:flex-col">
            <div className="relative h-44 w-full overflow-hidden rounded-2xl shadow-lg">
              <Image
                src={sideBanners[0].image}
                alt={sideBanners[0].title}
                fill
                className="object-cover"
                sizes="256px"
              />
              <div className="absolute inset-0 bg-black/35" />
              <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-sm font-bold text-white">
                {sideBanners[0].title}
              </p>
              <p className="absolute left-2 top-2 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-slate-800">
                {sideBanners[0].price}
              </p>
            </div>
            <div className="relative h-44 w-full overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={sideBanners[1].image}
                alt={sideBanners[1].title}
                fill
                className="object-cover"
                sizes="256px"
              />
              <div className="absolute inset-0 bg-black/35" />
              <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-sm font-bold text-white">
                {sideBanners[1].title}
              </p>
              <p className="absolute left-2 top-2 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-slate-800">
                {sideBanners[1].price}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-blue-100 via-white to-slate-900/15 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Sous-categories
            </p>
            {subcategoryHighlights.length > 10 ? (
              <button
                type="button"
                onClick={() => setShowAllSubcategories((previous) => !previous)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {showAllSubcategories ? "Voir moins" : "Voir plus"}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedSubcategoryHighlights.map((subcategory) => (
              <Link
                key={`hero-subcat-${subcategory.id}`}
                href={`/categories/${
                  activeCategoryCards.find((entry) => entry.name === subcategory.parentCategory)?.slug ??
                  subcategory.parentCategory.toLowerCase().replace(/\s+/g, "-")
                }?subcategory=${encodeURIComponent(subcategory.name)}`}
                className="group flex w-full max-w-[128px] cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-2 py-2 text-center opacity-90 transition duration-200 hover:-translate-y-0.5 hover:opacity-100"
              >
                <div
                  className="h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 p-0.5 transition duration-200 group-hover:scale-105 group-hover:shadow-md"
                >
                  {subcategory.image ? (
                    <Image
                      src={subcategory.image}
                      alt={subcategory.name}
                      width={96}
                      height={96}
                      className="h-full w-full rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                      N/A
                    </div>
                  )}
                </div>
                <span className="line-clamp-2 text-sm font-medium text-slate-700 transition group-hover:text-violet-700">
                  {subcategory.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 mb-2 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Ventes Flash | Chaque jour</h2>
            <Link
              href="/ventes-flash"
              className="cursor-pointer text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              Voir plus
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {flashProducts.map((product, index) => {
              const selectedSize = selectedSizes[product.id] ?? "";
              const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
              const remaining =
                typeof product.stock === "number" ? product.stock : getRemainingStock(product.id);
              const primaryImage = product.images?.[0] ?? product.image;
              const hoverImage = product.images?.[1] ?? primaryImage;
              const discount = getDisplayDiscount(product, 10 + (index + 1) * 5);
              const currentPrice = getProductPriceForSize(product, selectedSize || undefined);
              const oldPrice = Math.round(currentPrice / (1 - discount / 100));
              return (
              <article
                key={`new-product-${product.id}`}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  -{discount}%
                </span>
                <Link href={`/ventes-flash/${product.id}`} className="block">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      width={900}
                      height={600}
                      className="absolute inset-0 h-full w-full object-contain bg-white transition duration-300 group-hover:opacity-0"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <Image
                      src={hoverImage}
                      alt={`${product.name} - vue secondaire`}
                      width={900}
                      height={600}
                      className="absolute inset-0 h-full w-full object-contain bg-white opacity-0 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
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
                        <option key={`home-size-${product.id}-${size}`} value={size}>
                          {size}
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
                    <button
                      type="button"
                      onClick={() => addToCart(product, selectedSize)}
                      disabled={hasSizes && selectedSize.trim().length === 0}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-white transition ${
                        lastAddedProductId === product.id
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-slate-900 hover:bg-violet-700"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {lastAddedProductId === product.id ? "Ajoute" : "Ajouter"}
                    </button>
                  </div>
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-medium text-rose-600">
                      {remaining} articles restants
                    </p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full bg-rose-500 ${getStockWidthClass(remaining)}`} />
                    </div>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        </div>

        <div className="mx-auto mt-6 mb-2 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Produits par categorie</h2>
            <span className="text-xs font-medium text-slate-500">Selection par univers</span>
          </div>
          <div className="space-y-5">
          {productsByCategory.map((group) => (
            <div key={`group-wrap-${group.category}`} className="space-y-5">
              <section
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800">{group.category}</h3>
                  <Link
                    href={`/categories/${group.slug}`}
                    className="cursor-pointer text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                  >
                    Voir tout
                  </Link>
                </div>
                {group.items.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun produit pour cette categorie.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                    {group.items.map((product) => {
                      const selectedSize = selectedSizes[product.id] ?? "";
                      const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
                      const discount = getDisplayDiscount(product, 20);
                      const currentPrice = getProductPriceForSize(product, selectedSize || undefined);
                      const oldPrice = Math.round(currentPrice / (1 - discount / 100));
                      return (
                      <article
                        key={`group-item-${group.category}-${product.id}`}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          -{discount}%
                        </span>
                        <Link href={`/ventes-flash/${product.id}`} className="block">
                        <div className="relative h-56 w-full overflow-hidden">
                        <Image
                          src={product.images?.[0] ?? product.image}
                            alt={product.name}
                            width={900}
                            height={600}
                            className="absolute inset-0 h-full w-full object-contain bg-white transition duration-300 group-hover:opacity-0"
                            onError={(event) => {
                              event.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                        <Image
                          src={product.images?.[1] ?? product.images?.[0] ?? product.image}
                            alt={`${product.name} - vue secondaire`}
                            width={900}
                            height={600}
                            className="absolute inset-0 h-full w-full object-contain bg-white opacity-0 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
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
                                <option key={`home-group-size-${product.id}-${size}`} value={size}>
                                  {size}
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
                            <button
                              type="button"
                              onClick={() => addToCart(product, selectedSize)}
                              disabled={hasSizes && selectedSize.trim().length === 0}
                              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-white transition ${
                                lastAddedProductId === product.id
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-slate-900 hover:bg-violet-700"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {lastAddedProductId === product.id ? "Ajoute" : "Ajouter"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                    })}
                  </div>
                )}
              </section>

              {group.category === "Jacques Prevert" ? (
                <Link
                  href="/categories/jacques-prevert"
                  className="group relative block h-40 overflow-hidden rounded-2xl shadow-sm"
                >
                  <Image
                    src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=80"
                    alt="Banniere Jacques Prevert"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex items-end justify-between p-4 text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                        Collection Jacques Prevert
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        Uniformes et tenues: jusqu&apos;a -25%
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                      Voir
                    </span>
                  </div>
                </Link>
              ) : null}

              {group.category === "Blaise Pascal" ? (
                <Link
                  href="/categories/blaise-pascal"
                  className="group relative block h-40 overflow-hidden rounded-2xl shadow-sm"
                >
                  <Image
                    src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1600&q=80"
                    alt="Banniere Blaise Pascal"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex items-end justify-between p-4 text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                        Collection Blaise Pascal
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        Ensemble scolaire et tenue complete a prix reduits
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                      Voir
                    </span>
                  </div>
                </Link>
              ) : null}

              {group.category === "Jean Mermoz" ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-3">
                    {visibleMidPromoBanners.map((banner) => (
                      <div
                        key={`${banner.title}-${midBannerIndex}`}
                        className="group relative h-48 overflow-hidden rounded-xl"
                      >
                        <Image
                          src={banner.image}
                          alt={banner.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                          <p className="line-clamp-1 text-sm font-bold">{banner.title}</p>
                          <p className="line-clamp-1 text-[11px] text-white/90">{banner.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          </div>
        </div>
      </section>

      {isCartOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fermer le panier"
            className="cursor-pointer flex-1 bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="h-full w-full overflow-y-auto border-l border-white/20 bg-linear-to-b from-slate-900 via-slate-950 to-black p-5 text-slate-100 shadow-2xl sm:w-[360px]">
            <div className="mb-4 border-b border-white/10 pb-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-violet-300/90">
                    Votre panier
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Verifier puis commander</h2>
                </div>
                <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                  {cartCount} article{cartCount > 1 ? "s" : ""}
                </span>
              </div>
              <button
                type="button"
                className="cursor-pointer rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-slate-200 transition hover:bg-white/10"
                onClick={() => setIsCartOpen(false)}
              >
                Fermer
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <p className="text-sm text-slate-300">Votre panier est vide.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Ajoutez des articles pour continuer vos achats.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {cart.map((item) => (
                  <li
                    key={`${item.id}-${item.selectedSize ?? "taille-unique"}`}
                    className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm backdrop-blur"
                  >
                    <div className="flex items-start gap-3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={72}
                        height={72}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.category}</p>
                        {item.selectedSize ? (
                          <p className="text-xs text-slate-400">Taille: {item.selectedSize}</p>
                        ) : null}
                      </div>
                      <span className="text-slate-200">{currency.format(item.price)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="cursor-pointer h-7 w-7 rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                          onClick={() => changeQuantity(item.id, item.selectedSize, -1)}
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          className="cursor-pointer h-7 w-7 rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                          onClick={() => changeQuantity(item.id, item.selectedSize, 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-violet-200">
                        {currency.format(item.price * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Montant des articles</span>
                <span>{currency.format(cartTotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                <span>Livraison</span>
                <span>Calculee a l&apos;etape suivante</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-base font-medium text-slate-100">Total a payer</span>
                <strong className="text-lg text-violet-200">{currency.format(cartTotal)}</strong>
              </div>
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Votre nom complet"
                className="mt-3 w-full rounded-lg border border-white/15 bg-white/4 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-300/60"
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="Votre email"
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/4 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-300/60"
              />
              <button
                onClick={checkout}
                className="cursor-pointer mt-3 w-full rounded-lg bg-linear-to-r from-violet-500 via-indigo-500 to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-700/30 transition hover:brightness-110 disabled:opacity-50"
                disabled={cart.length === 0 || loadingCheckout}
              >
                {loadingCheckout ? "Traitement en cours..." : "Valider ma commande"}
              </button>
              {checkoutDone ? (
                <p className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  Commande validee ({checkoutDone}). Merci pour votre achat.
                </p>
              ) : null}
              {error ? (
                <p className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
