"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
  categories,
  categoryImageMap,
  categorySubcategoriesMap,
  categoryToSlug,
  defaultProducts,
  type SchoolPricingCoefficients,
  type Product,
} from "@/lib/catalog";
import type { DashboardBanner, DashboardCategory } from "@/lib/dashboard-content";
import type { UserRecord } from "@/lib/users";
import { DEFAULT_SHOP_SETTINGS, type ShopSettings } from "@/lib/settings";
import { DATABASE_ERROR_HEADER } from "@/lib/mongodb-errors";
import DashboardHeader, { PremiumModal, SectionPanel, StatCard } from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import SettingsPanel from "./components/SettingsPanel";
import PricingSection from "./components/PricingSection";
import ProductsSection from "./components/ProductsSection";
import CategoriesSection from "./components/CategoriesSection";
import BannersSection from "./components/BannersSection";
import BannerFormModal from "./components/BannerFormModal";
import OrdersSection from "./components/OrdersSection";
import UsersSection from "./components/UsersSection";
import UserFormModal from "./components/UserFormModal";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

type ProductForm = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  oldPrice: string;
  newPrice: string;
  reduction: string;
  stock: string;
  sizes: string;
  sizePrices: Record<string, string>;
  image: string;
  images: string[];
  description: string;
};

type AdminOrder = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  lines?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

type OrdersResponse = {
  items: AdminOrder[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  degraded?: boolean;
  error?: string;
};

function readDatabaseWarning(response: Response): string | null {
  const header = response.headers.get(DATABASE_ERROR_HEADER);
  if (!header) {
    return null;
  }
  try {
    return decodeURIComponent(header);
  } catch {
    return header;
  }
}

type AdminOrderDetails = AdminOrder & {
  lines: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
};

type CategoryForm = {
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
};

type BannerForm = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: "hero" | "middle" | "sidebar";
  isActive: boolean;
};

type DashboardSection =
  | "overview"
  | "pricing"
  | "products"
  | "categories"
  | "banners"
  | "orders"
  | "users"
  | "settings";
type ProductMenuTarget = "dashboard-products-form" | "dashboard-products-search" | "dashboard-products-list";

const AGE_PRESETS = [
  ["3 ans", "4 ans", "5 ans", "6 ans"],
  ["5 ans", "6 ans", "7 ans", "8 ans"],
  ["6 ans", "8 ans", "10 ans", "12 ans"],
  ["8 ans", "10 ans", "12 ans", "14 ans"],
  ["10 ans", "12 ans", "14 ans", "16 ans"],
] as const;

function parseAgesInput(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,;\n]+/)
        .map((entry) => entry.trim().replace(/\s+/g, " "))
        .filter((entry) => entry.length > 0),
    ),
  ];
}

function formatAgesInput(sizes: string[] | undefined): string {
  return (sizes ?? []).join(", ");
}

function parseAgeNumber(age: string): number | null {
  const match = age.match(/\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSizePrices(
  ages: string[],
  basePrice: number,
  previous: Record<string, string> = {},
  forceRecalculate = false,
): Record<string, string> {
  const numericAges = ages
    .map((age) => ({ age, value: parseAgeNumber(age) }))
    .filter((entry): entry is { age: string; value: number } => entry.value !== null);
  const minAge =
    numericAges.length > 0 ? Math.min(...numericAges.map((entry) => entry.value)) : null;

  const next: Record<string, string> = {};
  ages.forEach((age, index) => {
    if (!forceRecalculate && previous[age]?.trim()) {
      next[age] = previous[age];
      return;
    }
    const ageNumber = parseAgeNumber(age);
    if (ageNumber !== null && minAge !== null && Number.isFinite(basePrice) && basePrice > 0) {
      next[age] = String(Math.round(basePrice + (ageNumber - minAge) * 500));
      return;
    }
    if (Number.isFinite(basePrice) && basePrice > 0) {
      next[age] = String(Math.round(basePrice + index * 1000));
      return;
    }
    next[age] = previous[age] ?? "";
  });
  return next;
}

function serializeSizePrices(sizePrices: Record<string, string>): Record<string, number> | undefined {
  const entries = Object.entries(sizePrices)
    .map(([age, value]) => [age, Number(value)] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0);
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
}

const initialForm: ProductForm = {
  id: "",
  name: "",
  category: categories[0] ?? "",
  subcategory: (categorySubcategoriesMap[categories[0] ?? ""] ?? [])[0] ?? "",
  oldPrice: "",
  newPrice: "",
  reduction: "",
  stock: "",
  sizes: "",
  sizePrices: {},
  image: "",
  images: [],
  description: "",
};

const initialUserForm: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  status: "active",
};

const initialCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  image: "",
  isActive: true,
};

const initialBannerForm: BannerForm = {
  title: "",
  subtitle: "",
  image: "",
  link: "/",
  position: "hero",
  isActive: true,
};

export default function AdminClient() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>(defaultProducts);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [dashboardCategories, setDashboardCategories] = useState<DashboardCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [dashboardBanners, setDashboardBanners] = useState<DashboardBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerForm, setBannerForm] = useState<BannerForm>(initialBannerForm);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "all" | "pending_payment" | "pending_confirmation" | "paid" | "canceled"
  >("all");
  const [orderSortBy, setOrderSortBy] = useState<"createdAt" | "total">("createdAt");
  const [orderSortDir, setOrderSortDir] = useState<"asc" | "desc">("desc");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(10);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetails | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [pricingCoefficients, setPricingCoefficients] = useState<SchoolPricingCoefficients>(
    DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
  );
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const availableProductCategories = useMemo(() => {
    const fromDashboard = dashboardCategories
      .filter((category) => category.isActive)
      .map((category) => category.name);
    return [...new Set([...categories, ...fromDashboard])];
  }, [dashboardCategories]);
  const availableProductSubcategories = useMemo(() => {
    const fromCatalog = categorySubcategoriesMap[form.category] ?? [];
    const fromProducts = items
      .filter((item) => item.category === form.category)
      .map((item) => item.subcategory?.trim() ?? "")
      .filter((subcategory) => subcategory.length > 0);
    return [...new Set([...fromCatalog, ...fromProducts])];
  }, [form.category, items]);

  const totalProducts = useMemo(() => items.length, [items.length]);
  const filteredItems = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [items, productQuery]);
  const dashboardMetrics = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status === "paid");
    const pendingOrders = orders.filter((order) => order.status === "pending_payment");
    const pendingConfirmationOrders = orders.filter((order) => order.status === "pending_confirmation");
    const canceledOrders = orders.filter((order) => order.status === "canceled");
    const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const activeUsers = users.filter((user) => user.status === "active").length;
    return {
      paidRevenue,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      pendingConfirmationOrders: pendingConfirmationOrders.length,
      canceledOrders: canceledOrders.length,
      activeUsers,
    };
  }, [orders, users]);
  const ordersByStatus = useMemo(
    () => [
      { label: "Payees", value: dashboardMetrics.paidOrders, color: "bg-emerald-500" },
      { label: "Paiement en ligne en attente", value: dashboardMetrics.pendingOrders, color: "bg-amber-500" },
      { label: "Paiement a la livraison", value: dashboardMetrics.pendingConfirmationOrders, color: "bg-sky-500" },
      { label: "Annulees", value: dashboardMetrics.canceledOrders, color: "bg-rose-500" },
    ],
    [
      dashboardMetrics.canceledOrders,
      dashboardMetrics.paidOrders,
      dashboardMetrics.pendingConfirmationOrders,
      dashboardMetrics.pendingOrders,
    ],
  );
  const topCities = useMemo(
    () =>
      Object.entries(
        users.reduce<Record<string, number>>((acc, user) => {
          acc[user.city] = (acc[user.city] ?? 0) + 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [users],
  );
  const revenueByDay = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("fr-FR", { weekday: "short" });
      return { key, label, value: 0 };
    });
    const dayMap = new Map(days.map((day) => [day.key, day]));
    for (const order of orders) {
      if (order.status !== "paid" || !order.createdAt) {
        continue;
      }
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      const day = dayMap.get(key);
      if (day) {
        day.value += order.total;
      }
    }
    const max = Math.max(1, ...days.map((day) => day.value));
    return days.map((day) => ({
      ...day,
      heightClass:
        day.value === 0
          ? "h-1"
          : day.value >= max * 0.8
            ? "h-24"
            : day.value >= max * 0.6
              ? "h-20"
              : day.value >= max * 0.4
                ? "h-16"
                : day.value >= max * 0.2
                  ? "h-10"
                  : "h-6",
    }));
  }, [orders]);

  useEffect(() => {
    let active = true;
    async function loadPricingConfig() {
      setPricingLoading(true);
      try {
        const response = await fetch("/api/pricing-config");
        const data = (await response.json()) as {
          coefficients?: Partial<SchoolPricingCoefficients>;
        };
        if (active && response.ok && data.coefficients) {
          setPricingCoefficients({
            jacquesPrevert:
              typeof data.coefficients.jacquesPrevert === "number"
                ? data.coefficients.jacquesPrevert
                : DEFAULT_SCHOOL_PRICING_COEFFICIENTS.jacquesPrevert,
            blaisePascal:
              typeof data.coefficients.blaisePascal === "number"
                ? data.coefficients.blaisePascal
                : DEFAULT_SCHOOL_PRICING_COEFFICIENTS.blaisePascal,
            jeanMermoz:
              typeof data.coefficients.jeanMermoz === "number"
                ? data.coefficients.jeanMermoz
                : DEFAULT_SCHOOL_PRICING_COEFFICIENTS.jeanMermoz,
          });
        }
      } catch {
        if (active) {
          setPricingCoefficients(DEFAULT_SCHOOL_PRICING_COEFFICIENTS);
        }
      } finally {
        if (active) {
          setPricingLoading(false);
        }
      }
    }
    void loadPricingConfig();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      setSettingsLoading(true);
      try {
        const response = await fetch("/api/settings");
        const data = (await response.json()) as {
          settings?: ShopSettings;
          error?: string;
          degraded?: boolean;
        };
        const dbWarning = readDatabaseWarning(response);
        if (active && dbWarning) {
          setError(`Base de données indisponible : ${dbWarning}`);
        }
        if (active && response.ok && data.settings) {
          setShopSettings(data.settings);
        }
      } catch {
        if (active) {
          setShopSettings(DEFAULT_SHOP_SETTINGS);
        }
      } finally {
        if (active) {
          setSettingsLoading(false);
        }
      }
    }
    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);
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
          setItems(data);
        }
      } catch (loadError) {
        if (active) {
          setItems(defaultProducts);
          setError(
            loadError instanceof Error ? loadError.message : "Erreur de chargement.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadDashboardCategories() {
      setCategoriesLoading(true);
      try {
        const response = await fetch("/api/categories");
        const data = (await response.json()) as DashboardCategory[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) ? data.error : "Chargement categories impossible.");
        }
        const missingCatalogCategories = categories.filter(
          (name) => !data.some((category) => category.name === name),
        );
        const obsoleteCategories = data.filter(
          (category) => !categories.includes(category.name),
        );

        if (missingCatalogCategories.length > 0 || obsoleteCategories.length > 0) {
          await Promise.all(
            missingCatalogCategories.map((name) =>
              fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name,
                  slug: categoryToSlug(name),
                  image: categoryImageMap[name as keyof typeof categoryImageMap] ?? "",
                  isActive: true,
                }),
              }),
            ),
          );
          await Promise.all(
            obsoleteCategories.map((category) =>
              fetch(`/api/categories/${category.id}`, { method: "DELETE" }),
            ),
          );
          const refreshedResponse = await fetch("/api/categories");
          const refreshedData = (await refreshedResponse.json()) as
            | DashboardCategory[]
            | { error?: string };
          if (refreshedResponse.ok && Array.isArray(refreshedData)) {
            if (active) {
              setDashboardCategories(refreshedData);
            }
            return;
          }
        }
        if (active) {
          setDashboardCategories(data);
        }
      } catch {
        if (active) {
          setDashboardCategories([]);
        }
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }
    void loadDashboardCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadDashboardBanners() {
      setBannersLoading(true);
      try {
        const response = await fetch("/api/banners");
        const data = (await response.json()) as DashboardBanner[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) ? data.error : "Chargement bannieres impossible.");
        }
        if (active) {
          setDashboardBanners(data);
        }
      } catch {
        if (active) {
          setDashboardBanners([]);
        }
      } finally {
        if (active) {
          setBannersLoading(false);
        }
      }
    }
    void loadDashboardBanners();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      setUsersLoading(true);
      try {
        const response = await fetch("/api/users");
        const data = (await response.json()) as UserRecord[] | { error?: string };
        const dbWarning = readDatabaseWarning(response);
        if (active && dbWarning) {
          setError(`Base de données indisponible : ${dbWarning}`);
        }
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) ? data.error : "Chargement utilisateurs impossible.");
        }
        if (active) {
          setUsers(data);
        }
      } catch {
        if (active) {
          setUsers([]);
        }
      } finally {
        if (active) {
          setUsersLoading(false);
        }
      }
    }
    void loadUsers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      setOrdersLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(ordersPage),
          pageSize: String(ordersPageSize),
          status: orderStatusFilter,
          search: orderQuery,
          sortBy: orderSortBy,
          sortDir: orderSortDir,
        });
        const response = await fetch(`/api/orders?${query.toString()}`);
        const data = (await response.json()) as OrdersResponse | { error?: string };
        const dbWarning = readDatabaseWarning(response);
        if (active && dbWarning) {
          setError(`Base de données indisponible : ${dbWarning}`);
        }
        if (!response.ok || !("items" in data) || !Array.isArray(data.items)) {
          throw new Error(!("items" in data) ? data.error : "Chargement commandes impossible.");
        }
        if (active) {
          setOrders(data.items);
          setOrdersTotal(data.total);
          setOrdersTotalPages(data.totalPages);
        }
      } catch {
        if (active) {
          setOrders([]);
          setOrdersTotal(0);
          setOrdersTotalPages(1);
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    }
    void loadOrders();
    return () => {
      active = false;
    };
  }, [orderQuery, orderSortBy, orderSortDir, orderStatusFilter, ordersPage, ordersPageSize]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/se-connecter");
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(form.newPrice);
    const oldPrice = Number(form.oldPrice);
    const reduction = Number(form.reduction);
    const stock = Number(form.stock);
    const computedReduction =
      Number.isFinite(oldPrice) && oldPrice > 0 && Number.isFinite(price) && price > 0
        ? Math.max(0, Math.round((1 - price / oldPrice) * 100))
        : undefined;
    const discountPercentage =
      Number.isFinite(reduction) && reduction > 0 ? reduction : computedReduction;
    const mergedImages = [form.image, ...form.images]
      .map((image) => image.trim())
      .filter((image, index, array) => image.length >= 8 && array.indexOf(image) === index);
    const mainImage = mergedImages[0] ?? "";
    if (!form.name || !Number.isFinite(price) || price <= 0 || !mainImage) {
      return;
    }

    const ages = parseAgesInput(form.sizes);
    const sizePrices = serializeSizePrices(
      ages.length > 0
        ? buildSizePrices(ages, price, form.sizePrices)
        : {},
    );
    const id = editingId ?? `p-${crypto.randomUUID().slice(0, 8)}`;
    const product: Product = {
      id,
      name: form.name,
      category: form.category,
      subcategory: form.subcategory.trim() || undefined,
      price,
      oldPrice: Number.isFinite(oldPrice) && oldPrice > 0 ? oldPrice : undefined,
      stock: Number.isFinite(stock) && stock >= 0 ? stock : undefined,
      discountPercentage,
      image: mainImage,
      images: mergedImages,
      description: form.description || "Description indisponible.",
      sizes: ages.length > 0 ? ages : undefined,
      sizePrices,
    };

    try {
      const response = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = (await response.json()) as Product | { error?: string };
      if (!response.ok || Array.isArray(data)) {
        const message =
          !Array.isArray(data) && "error" in data && data.error
            ? data.error
            : editingId
              ? "Impossible de modifier le produit."
              : "Impossible d'ajouter le produit.";
        throw new Error(message);
      }

      setItems((previous) =>
        editingId
          ? previous.map((item) => (item.id === editingId ? (data as Product) : item))
          : [data as Product, ...previous],
      );
      setForm(initialForm);
      setEditingId(null);
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : editingId
            ? "Erreur lors de la modification du produit."
            : "Erreur lors de l'ajout du produit.",
      );
    }
  }

  function startEditProduct(product: Product) {
    setIsProductFormOpen(true);
    setEditingId(product.id);
    const ages = product.sizes ?? [];
    const existingPrices = Object.fromEntries(
      Object.entries(product.sizePrices ?? {}).map(([age, value]) => [age, String(value)]),
    );
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory ?? "",
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      newPrice: String(product.price),
      reduction: product.discountPercentage ? String(product.discountPercentage) : "",
      stock: Number.isFinite(product.stock) ? String(product.stock) : "",
      sizes: formatAgesInput(ages),
      sizePrices: buildSizePrices(ages, product.price, existingPrices),
      image: product.image,
      images: (product.images ?? []).filter((image) => image !== product.image),
      description: product.description,
    });
    setError(null);
  }

  function cancelEditProduct() {
    setEditingId(null);
    setForm(initialForm);
    setIsProductFormOpen(false);
  }

  function startCreateProduct() {
    setIsProductFormOpen(true);
    setEditingId(null);
    setForm(initialForm);
    goToProductTarget("dashboard-products-form");
  }

  function duplicateProduct(product: Product) {
    setIsProductFormOpen(true);
    setEditingId(null);
    const ages = product.sizes ?? [];
    const existingPrices = Object.fromEntries(
      Object.entries(product.sizePrices ?? {}).map(([age, value]) => [age, String(value)]),
    );
    setForm({
      id: "",
      name: `${product.name} (copie)`,
      category: product.category,
      subcategory: product.subcategory ?? "",
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      newPrice: String(product.price),
      reduction: product.discountPercentage ? String(product.discountPercentage) : "",
      stock: Number.isFinite(product.stock) ? String(product.stock) : "",
      sizes: formatAgesInput(ages),
      sizePrices: buildSizePrices(ages, product.price, existingPrices),
      image: product.image,
      images: (product.images ?? []).filter((image) => image !== product.image),
      description: product.description,
    });
    goToProductTarget("dashboard-products-form");
  }

  function updateAges(nextSizes: string) {
    const ages = parseAgesInput(nextSizes);
    const basePrice = Number(form.newPrice);
    setForm((previous) => ({
      ...previous,
      sizes: nextSizes,
      sizePrices: buildSizePrices(ages, basePrice, previous.sizePrices),
    }));
  }

  function recalculateAgePrices() {
    const ages = parseAgesInput(form.sizes);
    const basePrice = Number(form.newPrice);
    setForm((previous) => ({
      ...previous,
      sizePrices: buildSizePrices(ages, basePrice, previous.sizePrices, true),
    }));
  }

  async function handleProductImagesUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Lecture image impossible."));
        reader.readAsDataURL(file);
      });
    try {
      const uploadedImages = await Promise.all(Array.from(files).map((file) => readAsDataUrl(file)));
      setForm((previous) => {
        const combined = [previous.image, ...previous.images, ...uploadedImages].filter(
          (image, index, array) => image && array.indexOf(image) === index,
        );
        return {
          ...previous,
          image: combined[0] ?? "",
          images: combined.slice(1),
        };
      });
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload images impossible.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleCategoryImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const uploadedImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Lecture image categorie impossible."));
        reader.readAsDataURL(file);
      });
      setCategoryForm((previous) => ({ ...previous, image: uploadedImage }));
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload image categorie impossible.");
    } finally {
      event.target.value = "";
    }
  }

  function removeFormImage(index: number) {
    setForm((previous) => {
      const combined = [previous.image, ...previous.images];
      combined.splice(index, 1);
      return {
        ...previous,
        image: combined[0] ?? "",
        images: combined.slice(1),
      };
    });
  }

  function updateSecondaryImage(nextImage: string) {
    setForm((previous) => {
      const nextImages = [...previous.images];
      if (nextImage.trim().length === 0) {
        nextImages.shift();
      } else {
        nextImages[0] = nextImage;
      }
      return {
        ...previous,
        images: nextImages,
      };
    });
  }

  async function removeProduct(id: string) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Suppression impossible.");
      }
      setItems((previous) => previous.filter((item) => item.id !== id));
      setError(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Erreur lors de la suppression.",
      );
    }
  }

  async function openOrderDetails(orderId: string) {
    setOrderDetailsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = (await response.json()) as AdminOrderDetails | { error?: string };
      if (!response.ok || !("orderId" in data)) {
        throw new Error(!("orderId" in data) ? data.error : "Commande introuvable.");
      }
      setSelectedOrder(data as AdminOrderDetails);
    } catch (detailsError) {
      setError(
        detailsError instanceof Error
          ? detailsError.message
          : "Impossible de charger les details de la commande.",
      );
    } finally {
      setOrderDetailsLoading(false);
    }
  }

  async function updateOrderStatus(
    orderId: string,
    status: "pending_payment" | "pending_confirmation" | "paid" | "canceled",
  ) {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as AdminOrderDetails | { error?: string };
      if (!response.ok || !("orderId" in data)) {
        throw new Error(!("orderId" in data) ? data.error : "Mise a jour du statut impossible.");
      }

      setOrders((previous) =>
        previous.map((order) => (order.orderId === orderId ? { ...order, status } : order)),
      );
      setSelectedOrder((previous) =>
        previous && previous.orderId === orderId ? { ...previous, status } : previous,
      );
      setError(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Erreur lors de la mise a jour du statut.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function exportOrdersCsv() {
    if (orders.length === 0) {
      return;
    }
    const headers = ["orderId", "customerName", "customerEmail", "status", "total", "createdAt"];
    const rows = orders.map((order) =>
      [
        order.orderId,
        order.customerName,
        order.customerEmail,
        order.status,
        String(order.total),
        order.createdAt ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "commandes-proconfection.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function goToSection(section: DashboardSection) {
    setActiveSection(section);
    const target = document.getElementById(`dashboard-${section}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goToProductTarget(targetId: ProductMenuTarget) {
    setActiveSection("products");
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  async function savePricingConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPricingSaving(true);
    try {
      const response = await fetch("/api/pricing-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coefficients: pricingCoefficients }),
      });
      const data = (await response.json()) as {
        coefficients?: SchoolPricingCoefficients;
        error?: string;
      };
      if (!response.ok || !data.coefficients) {
        throw new Error(data.error ?? "Sauvegarde impossible.");
      }
      setPricingCoefficients(data.coefficients);
      setError(null);
      const refreshedProducts = await fetch("/api/products", { cache: "no-store" });
      const productsData = (await refreshedProducts.json()) as Product[] | { error?: string };
      if (refreshedProducts.ok && Array.isArray(productsData)) {
        setItems(productsData);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erreur sauvegarde coefficients.");
    } finally {
      setPricingSaving(false);
    }
  }

  async function saveShopSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: shopSettings }),
      });
      const data = (await response.json()) as { settings?: ShopSettings; error?: string };
      if (!response.ok || !data.settings) {
        throw new Error(data.error ?? "Sauvegarde impossible.");
      }
      setShopSettings(data.settings);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erreur sauvegarde paramètres.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function submitUserForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !userForm.firstName.trim() ||
      !userForm.lastName.trim() ||
      !userForm.email.trim() ||
      !userForm.phone.trim() ||
      !userForm.city.trim()
    ) {
      return;
    }

    try {
      const endpoint = editingUserId ? `/api/users/${editingUserId}` : "/api/users";
      const response = await fetch(endpoint, {
        method: editingUserId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = (await response.json()) as UserRecord | { error?: string };

      if (!response.ok || !("id" in data)) {
        const message =
          !("id" in data) && data.error
            ? data.error
            : editingUserId
              ? "Impossible de modifier l'utilisateur."
              : "Impossible d'ajouter l'utilisateur.";
        throw new Error(message);
      }

      setUsers((previous) =>
        editingUserId
          ? previous.map((user) => (user.id === editingUserId ? (data as UserRecord) : user))
          : [data as UserRecord, ...previous],
      );
      setUserForm(initialUserForm);
      setEditingUserId(null);
      setIsUserFormOpen(false);
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : editingUserId
            ? "Erreur lors de la modification de l'utilisateur."
            : "Erreur lors de l'ajout de l'utilisateur.",
      );
    }
  }

  function startEditUser(user: UserRecord) {
    setIsUserFormOpen(true);
    setEditingUserId(user.id);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      status: user.status,
    });
  }

  function cancelEditUser() {
    setEditingUserId(null);
    setUserForm(initialUserForm);
    setIsUserFormOpen(false);
  }

  function startCreateUser() {
    setIsUserFormOpen(true);
    setEditingUserId(null);
    setUserForm(initialUserForm);
  }

  async function removeUser(id: string) {
    try {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Suppression utilisateur impossible.");
      }
      setUsers((previous) => previous.filter((user) => user.id !== id));
      if (editingUserId === id) {
        cancelEditUser();
      }
      setError(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Erreur lors de la suppression de l'utilisateur.",
      );
    }
  }

  async function submitCategoryForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) return;
    try {
      const endpoint = editingCategoryId ? `/api/categories/${editingCategoryId}` : "/api/categories";
      const response = await fetch(endpoint, {
        method: editingCategoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      const data = (await response.json()) as DashboardCategory | { error?: string };
      if (!response.ok || !("id" in data)) {
        throw new Error(!("id" in data) ? data.error : "Erreur categories.");
      }
      setDashboardCategories((previous) =>
        editingCategoryId
          ? previous.map((item) => (item.id === editingCategoryId ? (data as DashboardCategory) : item))
          : [data as DashboardCategory, ...previous],
      );
      setCategoryForm(initialCategoryForm);
      setEditingCategoryId(null);
      setIsCategoryFormOpen(false);
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur categorie.");
    }
  }

  function startEditCategory(category: DashboardCategory) {
    setIsCategoryFormOpen(true);
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      image: category.image,
      isActive: category.isActive,
    });
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setCategoryForm(initialCategoryForm);
    setIsCategoryFormOpen(false);
  }

  function startCreateCategory() {
    setIsCategoryFormOpen(true);
    setEditingCategoryId(null);
    setCategoryForm(initialCategoryForm);
  }

  async function removeCategory(id: string) {
    try {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Suppression categorie impossible.");
      }
      setDashboardCategories((previous) => previous.filter((item) => item.id !== id));
      if (editingCategoryId === id) {
        cancelEditCategory();
      }
      setError(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erreur suppression categorie.");
    }
  }

  async function submitBannerForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bannerForm.title.trim() || !bannerForm.image.trim()) return;
    try {
      const endpoint = editingBannerId ? `/api/banners/${editingBannerId}` : "/api/banners";
      const response = await fetch(endpoint, {
        method: editingBannerId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerForm),
      });
      const data = (await response.json()) as DashboardBanner | { error?: string };
      if (!response.ok || !("id" in data)) {
        throw new Error(!("id" in data) ? data.error : "Erreur bannieres.");
      }
      setDashboardBanners((previous) =>
        editingBannerId
          ? previous.map((item) => (item.id === editingBannerId ? (data as DashboardBanner) : item))
          : [data as DashboardBanner, ...previous],
      );
      setBannerForm(initialBannerForm);
      setEditingBannerId(null);
      setIsBannerFormOpen(false);
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur banniere.");
    }
  }

  function startEditBanner(banner: DashboardBanner) {
    setIsBannerFormOpen(true);
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      link: banner.link,
      position: banner.position,
      isActive: banner.isActive,
    });
  }

  function cancelEditBanner() {
    setEditingBannerId(null);
    setBannerForm(initialBannerForm);
    setIsBannerFormOpen(false);
  }

  function startCreateBanner() {
    setIsBannerFormOpen(true);
    setEditingBannerId(null);
    setBannerForm(initialBannerForm);
  }

  async function removeBanner(id: string) {
    try {
      const response = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Suppression banniere impossible.");
      }
      setDashboardBanners((previous) => previous.filter((item) => item.id !== id));
      if (editingBannerId === id) {
        cancelEditBanner();
      }
      setError(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erreur suppression banniere.");
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8 md:py-8">
      <DashboardHeader totalProducts={totalProducts} error={error} onLogout={logout} />

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <DashboardSidebar
          activeSection={activeSection}
          onNavigate={goToSection}
          onProductNavigate={goToProductTarget}
        />

        <div className="space-y-6 admin-animate-in">
      <section
        id="dashboard-overview"
        className={`${activeSection === "overview" ? "grid" : "hidden"} gap-4 md:grid-cols-2 xl:grid-cols-5`}
      >
        <StatCard
          label="Produits actifs"
          value={totalProducts}
          accent="gold"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
        />
        <StatCard
          label="Chiffre d'affaires payé"
          value={currency.format(dashboardMetrics.paidRevenue)}
          accent="gold"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Commandes payées"
          value={dashboardMetrics.paidOrders}
          accent="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="En attente"
          value={dashboardMetrics.pendingOrders}
          accent="amber"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Utilisateurs actifs"
          value={dashboardMetrics.activeUsers}
          accent="rose"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
      </section>

      <section
        className={`${activeSection === "overview" ? "grid" : "hidden"} gap-5 lg:grid-cols-2`}
      >
        <SectionPanel title="Raccourcis" subtitle="Accès rapide aux sections clés">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["products", "+ Ajouter un produit", "from-[#f5efe4] to-white text-[#9a7b4f] ring-[rgba(184,149,108,0.25)]"],
                ["categories", "Gérer les catégories", "from-stone-50 to-white text-stone-700 ring-stone-200/80"],
                ["banners", "Mettre à jour les bannières", "from-rose-50 to-white text-rose-700 ring-rose-200/60"],
                ["orders", "Suivre les commandes", "from-emerald-50 to-white text-emerald-700 ring-emerald-200/60"],
                ["users", "Gérer les utilisateurs", "from-amber-50 to-white text-amber-800 ring-amber-200/60"],
                ["settings", "Configurer les paramètres", "from-violet-50 to-white text-violet-800 ring-violet-200/60 sm:col-span-2"],
              ] as const
            ).map(([section, label, style]) => (
              <button
                key={section}
                type="button"
                onClick={() => goToSection(section)}
                className={`rounded-xl bg-gradient-to-br px-4 py-3 text-left text-sm font-medium ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${style}`}
              >
                {label}
              </button>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Répartition des commandes" subtitle="Par statut de traitement">
          <div className="space-y-4">
            {ordersByStatus.map((item) => {
              const max = Math.max(1, orders.length);
              const pct = Math.min(100, Math.round((item.value / max) * 100));
              return (
                <div key={`status-bar-${item.label}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{item.label}</span>
                    <span className="font-semibold text-stone-900">{item.value}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>

        <SectionPanel title="Villes principales" subtitle="Répartition géographique des utilisateurs">
          <div className="space-y-2">
            {topCities.map(([city, count], index) => (
              <div
                key={`city-${city}`}
                className="flex items-center justify-between rounded-xl border border-stone-100 bg-gradient-to-r from-[#fffcf8] to-white px-4 py-2.5 text-sm transition hover:border-[rgba(184,149,108,0.2)]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5efe4] text-[11px] font-bold text-[#9a7b4f]">
                    {index + 1}
                  </span>
                  {city}
                </span>
                <strong className="text-[#9a7b4f]">{count}</strong>
              </div>
            ))}
            {users.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">Aucune donnée utilisateur.</p>
            ) : null}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Chiffre d'affaires"
          subtitle="7 derniers jours — commandes payées"
          className="lg:col-span-2"
        >
          <div className="flex h-36 items-end gap-3">
            {revenueByDay.map((day) => (
              <div key={`revenue-${day.key}`} className="group flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center rounded-t-lg bg-gradient-to-t from-[#f5efe4] to-stone-50 px-1 pt-2">
                  <div
                    className={`w-full max-w-10 rounded-t-md bg-gradient-to-t from-[#9a7b4f] to-[#c9a962] shadow-sm transition group-hover:from-[#b8956c] group-hover:to-[#d4b87a] ${day.heightClass}`}
                  />
                </div>
                <span className="text-[11px] font-medium capitalize text-stone-500">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-6 border-t border-stone-100 pt-4 text-sm text-stone-600">
            <p>
              Total 7 jours{" "}
              <strong className="text-stone-900">
                {currency.format(revenueByDay.reduce((sum, day) => sum + day.value, 0))}
              </strong>
            </p>
            <p>
              Panier moyen{" "}
              <strong className="text-stone-900">
                {orders.length > 0
                  ? currency.format(orders.reduce((sum, order) => sum + order.total, 0) / orders.length)
                  : currency.format(0)}
              </strong>
            </p>
          </div>
        </SectionPanel>
      </section>

      <section
        id="dashboard-pricing"
        className={activeSection === "pricing" ? "block" : "hidden"}
      >
        <PricingSection
          coefficients={pricingCoefficients}
          loading={pricingLoading}
          saving={pricingSaving}
          onChange={setPricingCoefficients}
          onSave={savePricingConfig}
          onReset={() => setPricingCoefficients(DEFAULT_SCHOOL_PRICING_COEFFICIENTS)}
        />
      </section>

      <section
        id="dashboard-products"
        className={activeSection === "products" ? "block" : "hidden"}
      >
        <ProductsSection
          items={items}
          filteredItems={filteredItems}
          loading={loading}
          query={productQuery}
          currency={currency}
          onQueryChange={setProductQuery}
          onCreate={startCreateProduct}
          onEdit={startEditProduct}
          onDuplicate={duplicateProduct}
          onRemove={removeProduct}
        />
      </section>
      {isProductFormOpen ? (
        <PremiumModal
          title={editingId ? "Modifier le produit" : "Nouveau produit"}
          subtitle="Catalogue"
          onClose={() => setIsProductFormOpen(false)}
          size="xl"
        >
            <form onSubmit={submitForm} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr] md:p-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="admin-label">
                    Nom du produit
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((p) => ({ ...p, name: event.target.value }))}
                    placeholder="Ex: Ensemble premium Dakar"
                    className="admin-input"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="admin-label">
                      Ancien prix (XOF)
                    </label>
                    <input
                      value={form.oldPrice}
                      onChange={(event) => setForm((p) => ({ ...p, oldPrice: event.target.value }))}
                      placeholder="30000"
                      type="number"
                      min={0}
                      className="admin-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="admin-label">
                      Nouveau prix (XOF)
                    </label>
                    <input
                      value={form.newPrice}
                      onChange={(event) => setForm((p) => ({ ...p, newPrice: event.target.value }))}
                      placeholder="25000"
                      type="number"
                      min={1}
                      className="admin-input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="admin-label">Stock disponible</label>
                  <input
                    value={form.stock}
                    onChange={(event) => setForm((p) => ({ ...p, stock: event.target.value }))}
                    placeholder="Ex: 25"
                    type="number"
                    min={0}
                    className="admin-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="admin-label">Âges de l&apos;enfant (tailles)</label>
                  <input
                    value={form.sizes}
                    onChange={(event) => updateAges(event.target.value)}
                    placeholder="Ex: 6 ans, 8 ans, 10 ans, 12 ans"
                    className="admin-input"
                  />
                  <p className="text-xs text-stone-500">
                    Séparez les âges par des virgules. Le prix évolue selon l&apos;âge choisi sur la
                    boutique.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AGE_PRESETS.map((preset) => {
                      const label = preset.join(", ");
                      const isActive = form.sizes.trim() === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => updateAges(label)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            isActive
                              ? "bg-[#b8956c] text-white shadow-sm"
                              : "bg-[#f5efe4] text-[#9a7b4f] hover:bg-[#ede4d4]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {parseAgesInput(form.sizes).length > 0 ? (
                    <div className="space-y-3 rounded-xl border border-stone-200 bg-[#fffcf8] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="admin-label mb-0">Prix par âge (XOF)</p>
                        <button
                          type="button"
                          onClick={recalculateAgePrices}
                          className="admin-btn-ghost text-xs"
                        >
                          Recalculer depuis le prix de base
                        </button>
                      </div>
                      <p className="text-xs text-stone-500">
                        Prix de base = plus petit âge. Par défaut : +500 F par année d&apos;écart.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {parseAgesInput(form.sizes).map((age) => (
                          <label key={`age-price-${age}`} className="block">
                            <span className="mb-1 block text-xs font-medium text-stone-600">
                              {age}
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={form.sizePrices[age] ?? ""}
                              onChange={(event) =>
                                setForm((previous) => ({
                                  ...previous,
                                  sizePrices: {
                                    ...previous.sizePrices,
                                    [age]: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Ex: 22000"
                              className="admin-input"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="admin-label">
                      Reduction (%)
                    </label>
                    <input
                      value={form.reduction}
                      onChange={(event) => setForm((p) => ({ ...p, reduction: event.target.value }))}
                      placeholder="20"
                      type="number"
                      min={0}
                      max={99}
                      className="admin-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="admin-label">
                      Categorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((p) => {
                          const nextCategory = event.target.value;
                          const nextSubcategories = categorySubcategoriesMap[nextCategory] ?? [];
                          return {
                            ...p,
                            category: nextCategory,
                            subcategory: nextSubcategories[0] ?? "",
                          };
                        })
                      }
                      aria-label="Categorie du produit"
                      className="admin-input"
                    >
                      {availableProductCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableProductCategories.map((category) => (
                    <button
                      key={`chip-${category}`}
                      type="button"
                      onClick={() =>
                        setForm((p) => {
                          const nextSubcategories = categorySubcategoriesMap[category] ?? [];
                          return {
                            ...p,
                            category,
                            subcategory: nextSubcategories[0] ?? "",
                          };
                        })
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        form.category === category
                          ? "bg-[#b8956c] text-white shadow-sm"
                          : "bg-[#f5efe4] text-[#9a7b4f] hover:bg-[#ede4d4]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="admin-label">
                    Sous-categorie
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(event) =>
                      setForm((p) => ({ ...p, subcategory: event.target.value }))
                    }
                    aria-label="Sous-categorie du produit"
                    className="admin-input"
                  >
                    <option value="">Aucune sous-categorie</option>
                    {availableProductSubcategories.map((subcategory) => (
                      <option key={`${form.category}-${subcategory}`} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="admin-label">
                    URL image principale
                  </label>
                  <input
                    value={form.image}
                    onChange={(event) => setForm((p) => ({ ...p, image: event.target.value }))}
                    placeholder="https://..."
                    className="admin-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="admin-label">
                    URL 2e photo
                  </label>
                  <input
                    value={form.images[0] ?? ""}
                    onChange={(event) => updateSecondaryImage(event.target.value)}
                    placeholder="https://... (photo detail supplementaire)"
                    className="admin-input"
                  />
                </div>
                <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3">
                  <label
                    htmlFor="product-images-upload"
                    className="admin-label"
                  >
                    Images depuis le PC (plusieurs)
                  </label>
                  <input
                    id="product-images-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProductImagesUpload}
                    className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#b8956c] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                  />
                  <p className="text-xs text-slate-500">
                    Tu peux selectionner plusieurs images. La premiere devient l&apos;image principale.
                  </p>
                </div>
                {[form.image, ...form.images].filter((image) => image.trim() !== "").length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[form.image, ...form.images]
                      .map((image, index) => ({ image, index }))
                      .filter(({ image }) => image.trim() !== "")
                      .map(({ image, index }) => (
                      <div key={`upload-preview-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={image} alt={`Apercu ${index + 1}`} className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFormImage(index)}
                          className="absolute right-1 top-1 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] text-white"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-1">
                  <label className="admin-label">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((p) => ({ ...p, description: event.target.value }))
                    }
                    placeholder="Description premium du produit..."
                    className="min-h-20 w-full admin-input"
                  />
                </div>
              </div>
              <aside className="flex flex-col space-y-3 rounded-2xl border border-stone-200 bg-white p-4 md:sticky md:top-0">
                <p className="admin-label">
                  Apercu instantane
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt={form.name || "Apercu produit"}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-slate-100 text-xs text-slate-500">
                      Ajoute une image pour l&apos;apercu
                    </div>
                  )}
                  {form.images[0]?.trim() ? (
                    <div className="border-t border-slate-200 p-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        2e photo
                      </p>
                      <img
                        src={form.images[0]}
                        alt="Apercu 2e photo"
                        className="h-20 w-full rounded-lg object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1 p-3">
                    <p className="text-xs uppercase text-slate-500">{form.category}</p>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {form.name || "Nom du produit"}
                    </h3>
                    <p className="text-sm font-bold text-[#9a7b4f]">
                      {Number.isFinite(Number(form.newPrice)) && Number(form.newPrice) > 0
                        ? currency.format(Number(form.newPrice))
                        : currency.format(0)}
                    </p>
                    {Number.isFinite(Number(form.oldPrice)) && Number(form.oldPrice) > 0 ? (
                      <p className="text-xs text-slate-500 line-through">
                        {currency.format(Number(form.oldPrice))}
                      </p>
                    ) : null}
                    {Number.isFinite(Number(form.reduction)) && Number(form.reduction) > 0 ? (
                      <p className="text-xs font-semibold text-emerald-700">-{form.reduction}%</p>
                    ) : null}
                    {Number.isFinite(Number(form.stock)) ? (
                      <p className="text-xs text-slate-600">Stock: {Number(form.stock)}</p>
                    ) : null}
                    {parseAgesInput(form.sizes).length > 0 ? (
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>Prix par âge :</p>
                        {parseAgesInput(form.sizes).map((age) => {
                          const agePrice = Number(form.sizePrices[age]);
                          return (
                            <p key={`preview-age-${age}`}>
                              {age}:{" "}
                              {Number.isFinite(agePrice) && agePrice > 0
                                ? currency.format(agePrice)
                                : "—"}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Aucun âge défini</p>
                    )}
                    <p className="line-clamp-3 text-xs text-slate-600">
                      {form.description || "La description du produit apparait ici."}
                    </p>
                  </div>
                </div>
                <div className="mt-auto space-y-2 border-t border-stone-100 pt-3">
                  <button
                    type="submit"
                    className="admin-btn-primary w-full"
                    style={{ color: "#fff", background: "linear-gradient(135deg, #b8956c 0%, #9a7b4f 100%)" }}
                  >
                    {editingId ? "Enregistrer les changements" : "Ajouter au catalogue"}
                  </button>
                  <button type="button" className="admin-btn-secondary w-full" onClick={cancelEditProduct}>
                    {editingId ? "Annuler la modification" : "Fermer"}
                  </button>
                </div>
              </aside>
            </form>
        </PremiumModal>
      ) : null}

      <section id="dashboard-categories" className={activeSection === "categories" ? "block" : "hidden"}>
        <CategoriesSection
          categories={dashboardCategories}
          loading={categoriesLoading}
          onCreate={startCreateCategory}
          onEdit={startEditCategory}
          onRemove={removeCategory}
        />
      </section>

      {isCategoryFormOpen ? (
        <PremiumModal
          title={editingCategoryId ? "Modifier la catégorie" : "Nouvelle catégorie"}
          subtitle="Catalogue"
          onClose={cancelEditCategory}
          size="md"
        >
            <form onSubmit={submitCategoryForm} className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((p) => ({ ...p, name: event.target.value }))}
                placeholder="Nom categorie"
                className="admin-input"
              />
              <input
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((p) => ({ ...p, slug: event.target.value }))}
                placeholder="Slug (ex: mode-femme)"
                className="admin-input"
              />
              <input
                value={categoryForm.image}
                onChange={(event) => setCategoryForm((p) => ({ ...p, image: event.target.value }))}
                placeholder="URL image (optionnel)"
                className="admin-input md:col-span-2"
              />
              <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 md:col-span-2">
                <label
                  htmlFor="category-image-upload"
                  className="admin-label"
                >
                  Image categorie depuis le PC
                </label>
                <input
                  id="category-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryImageUpload}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                {categoryForm.image.trim() ? (
                  <img
                    src={categoryForm.image}
                    alt="Apercu categorie"
                    className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                  />
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(event) =>
                    setCategoryForm((p) => ({ ...p, isActive: event.target.checked }))
                  }
                />
                Categorie active
              </label>
              <button type="submit" className="admin-btn-primary md:col-span-2">
                {editingCategoryId ? "Enregistrer la categorie" : "Ajouter la categorie"}
              </button>
              {editingCategoryId ? (
                <button
                  type="button"
                  onClick={cancelEditCategory}
                  className="admin-btn-secondary md:col-span-2"
                >
                  Annuler la modification
                </button>
              ) : null}
            </form>
        </PremiumModal>
      ) : null}

      <section id="dashboard-banners" className={activeSection === "banners" ? "block" : "hidden"}>
        <BannersSection
          banners={dashboardBanners}
          loading={bannersLoading}
          onCreate={startCreateBanner}
          onEdit={startEditBanner}
          onRemove={removeBanner}
        />
      </section>

      <BannerFormModal
        open={isBannerFormOpen}
        editingId={editingBannerId}
        form={bannerForm}
        onClose={cancelEditBanner}
        onChange={setBannerForm}
        onSubmit={submitBannerForm}
      />

      <section id="dashboard-orders" className={activeSection === "orders" ? "block" : "hidden"}>
        <OrdersSection
          orders={orders}
          ordersTotal={ordersTotal}
          ordersPage={ordersPage}
          ordersTotalPages={ordersTotalPages}
          ordersPageSize={ordersPageSize}
          ordersLoading={ordersLoading}
          orderQuery={orderQuery}
          orderStatusFilter={orderStatusFilter}
          orderSortValue={`${orderSortBy}:${orderSortDir}`}
          selectedOrder={selectedOrder}
          orderDetailsLoading={orderDetailsLoading}
          updatingOrderId={updatingOrderId}
          currency={currency}
          onQueryChange={(query) => {
            setOrderQuery(query);
            setOrdersPage(1);
          }}
          onStatusFilterChange={(filter) => {
            setOrderStatusFilter(filter);
            setOrdersPage(1);
          }}
          onSortChange={(sortBy, sortDir) => {
            setOrderSortBy(sortBy);
            setOrderSortDir(sortDir);
            setOrdersPage(1);
          }}
          onPageSizeChange={(size) => {
            setOrdersPageSize(size);
            setOrdersPage(1);
          }}
          onPageChange={setOrdersPage}
          onExportCsv={exportOrdersCsv}
          onUpdateStatus={updateOrderStatus}
          onOpenDetails={openOrderDetails}
          onCloseDetails={() => setSelectedOrder(null)}
        />
      </section>

      <section id="dashboard-users" className={activeSection === "users" ? "block" : "hidden"}>
        <UsersSection
          users={users}
          loading={usersLoading}
          onCreate={startCreateUser}
          onEdit={startEditUser}
          onRemove={removeUser}
        />
      </section>

      <UserFormModal
        open={isUserFormOpen}
        editingId={editingUserId}
        form={userForm}
        onClose={cancelEditUser}
        onChange={setUserForm}
        onSubmit={submitUserForm}
      />

      <section id="dashboard-settings" className={activeSection === "settings" ? "block" : "hidden"}>
        <SettingsPanel
          settings={shopSettings}
          loading={settingsLoading}
          saving={settingsSaving}
          onChange={setShopSettings}
          onSave={saveShopSettings}
          onReset={() => setShopSettings(DEFAULT_SHOP_SETTINGS)}
        />
      </section>
      </div>
      </div>
    </main>
  );
}
