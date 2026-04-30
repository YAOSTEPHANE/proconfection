"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  categories,
  categoryImageMap,
  categorySubcategoriesMap,
  categoryToSlug,
  defaultProducts,
  type Product,
} from "@/lib/catalog";
import type { DashboardBanner, DashboardCategory } from "@/lib/dashboard-content";
import type { UserRecord } from "@/lib/users";

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
};

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
  | "products"
  | "categories"
  | "banners"
  | "orders"
  | "users";
type ProductMenuTarget = "dashboard-products-form" | "dashboard-products-search" | "dashboard-products-list";

const initialForm: ProductForm = {
  id: "",
  name: "",
  category: categories[0] ?? "",
  subcategory: (categorySubcategoriesMap[categories[0] ?? ""] ?? [])[0] ?? "",
  oldPrice: "",
  newPrice: "",
  reduction: "",
  stock: "",
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
  const availableProductCategories = categories;
  const availableProductSubcategories = useMemo(
    () => categorySubcategoriesMap[form.category] ?? [],
    [form.category],
  );

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

    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/products");
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
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory ?? "",
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      newPrice: String(product.price),
      reduction: product.discountPercentage ? String(product.discountPercentage) : "",
      stock: Number.isFinite(product.stock) ? String(product.stock) : "",
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
    setForm({
      id: "",
      name: `${product.name} (copie)`,
      category: product.category,
      subcategory: product.subcategory ?? "",
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      newPrice: String(product.price),
      reduction: product.discountPercentage ? String(product.discountPercentage) : "",
      stock: Number.isFinite(product.stock) ? String(product.stock) : "",
      image: product.image,
      images: (product.images ?? []).filter((image) => image !== product.image),
      description: product.description,
    });
    goToProductTarget("dashboard-products-form");
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
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur banniere.");
    }
  }

  function startEditBanner(banner: DashboardBanner) {
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
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <header className="overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-2xl shadow-indigo-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              Tableau de bord
            </p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Administration ProConfection</h1>
            <p className="mt-1 text-sm text-indigo-100">
              Produits actifs: <strong>{totalProducts}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              prefetch={false}
              className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm backdrop-blur"
            >
              Retour boutique
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white"
            >
              Se deconnecter
            </button>
          </div>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl border border-rose-300/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Menu dashboard
          </p>
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Vue d'ensemble" },
              { id: "products", label: "Produits" },
              { id: "categories", label: "Categories" },
              { id: "banners", label: "Bannieres" },
              { id: "orders", label: "Commandes" },
              { id: "users", label: "Utilisateurs" },
            ].map((entry) => (
              <button
                key={`menu-${entry.id}`}
                type="button"
                onClick={() => goToSection(entry.id as DashboardSection)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeSection === entry.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {entry.label}
              </button>
            ))}
            {activeSection === "products" ? (
              <div className="mt-1 space-y-1 rounded-xl border border-indigo-100 bg-indigo-50/60 p-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  Produits
                </p>
                <button
                  type="button"
                  onClick={() => goToProductTarget("dashboard-products-form")}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-indigo-700 hover:bg-indigo-100"
                >
                  Ajouter / Modifier
                </button>
                <button
                  type="button"
                  onClick={() => goToProductTarget("dashboard-products-search")}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-indigo-700 hover:bg-indigo-100"
                >
                  Rechercher
                </button>
                <button
                  type="button"
                  onClick={() => goToProductTarget("dashboard-products-list")}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-indigo-700 hover:bg-indigo-100"
                >
                  Liste des produits
                </button>
              </div>
            ) : null}
          </nav>
        </aside>

        <div className="space-y-6">
      <section
        id="dashboard-overview"
        className={`${activeSection === "overview" ? "grid" : "hidden"} gap-3 md:grid-cols-2 xl:grid-cols-5`}
      >
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Produits actifs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalProducts}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Chiffre d&apos;affaires paye</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{currency.format(dashboardMetrics.paidRevenue)}</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Commandes payees</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{dashboardMetrics.paidOrders}</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-700">Commandes en attente</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{dashboardMetrics.pendingOrders}</p>
        </article>
        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-indigo-700">Utilisateurs actifs</p>
          <p className="mt-2 text-2xl font-bold text-indigo-800">{dashboardMetrics.activeUsers}</p>
        </article>
      </section>

      <section
        className={`${activeSection === "overview" ? "grid" : "hidden"} gap-4 lg:grid-cols-2`}
      >
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Raccourcis
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => goToSection("products")}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-sm text-indigo-700"
            >
              + Ajouter un produit
            </button>
            <button
              type="button"
              onClick={() => goToSection("categories")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700"
            >
              Gerer les categories
            </button>
            <button
              type="button"
              onClick={() => goToSection("banners")}
              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-left text-sm text-violet-700"
            >
              Mettre a jour les bannieres
            </button>
            <button
              type="button"
              onClick={() => goToSection("orders")}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-sm text-emerald-700"
            >
              Suivre les commandes
            </button>
            <button
              type="button"
              onClick={() => goToSection("users")}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-700 sm:col-span-2"
            >
              Gerer les utilisateurs
            </button>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Repartition des commandes
          </h2>
          <div className="mt-4 space-y-3">
            {ordersByStatus.map((item) => {
              const max = Math.max(1, orders.length);
              const pct = Math.min(100, Math.round((item.value / max) * 100));
              const widthClass =
                pct >= 90
                  ? "w-full"
                  : pct >= 75
                    ? "w-9/12"
                    : pct >= 50
                      ? "w-6/12"
                      : pct >= 33
                        ? "w-4/12"
                        : pct >= 20
                          ? "w-3/12"
                          : pct > 0
                            ? "w-2/12"
                            : "w-0";
              return (
                <div key={`status-bar-${item.label}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color} ${widthClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Villes principales (utilisateurs)
          </h2>
          <div className="mt-4 space-y-2">
            {topCities.map(([city, count]) => (
                <div
                  key={`city-${city}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{city}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            {users.length === 0 ? <p className="text-sm text-slate-500">Aucune donnee utilisateur.</p> : null}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Chiffre d&apos;affaires (7 derniers jours)
          </h2>
          <div className="mt-4 flex h-32 items-end gap-2">
            {revenueByDay.map((day) => (
              <div key={`revenue-${day.key}`} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center rounded-md bg-slate-100">
                  <div className={`w-full max-w-7 rounded-md bg-indigo-500 ${day.heightClass}`} />
                </div>
                <span className="text-[11px] text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <p>Total 7 jours: <strong>{currency.format(revenueByDay.reduce((sum, day) => sum + day.value, 0))}</strong></p>
            <p>Panier moyen: <strong>{orders.length > 0 ? currency.format(orders.reduce((sum, order) => sum + order.total, 0) / orders.length) : currency.format(0)}</strong></p>
          </div>
        </article>
      </section>

      <section
        id="dashboard-products"
        className={`${activeSection === "products" ? "block" : "hidden"}`}
      >
        <div className="mb-3 flex justify-end">
          <span id="dashboard-products-form" className="sr-only">
            Formulaire nouveau produit
          </span>
          <button
            type="button"
            onClick={startCreateProduct}
            className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
          >
            Nouveau produit
          </button>
        </div>
      </section>
      {isProductFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
          <div className="w-full max-h-[88vh] max-w-4xl overflow-y-auto rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-linear-to-r from-slate-950 via-indigo-950 to-violet-900 px-5 py-3 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-indigo-200">Catalogue</p>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Modifier le produit" : "Nouveau produit"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProductFormOpen(false)}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
              >
                Fermer
              </button>
            </div>
            <form onSubmit={submitForm} className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nom du produit
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((p) => ({ ...p, name: event.target.value }))}
                    placeholder="Ex: Ensemble premium Dakar"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ancien prix (XOF)
                    </label>
                    <input
                      value={form.oldPrice}
                      onChange={(event) => setForm((p) => ({ ...p, oldPrice: event.target.value }))}
                      placeholder="30000"
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Nouveau prix (XOF)
                    </label>
                    <input
                      value={form.newPrice}
                      onChange={(event) => setForm((p) => ({ ...p, newPrice: event.target.value }))}
                      placeholder="25000"
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock disponible
                  </label>
                  <input
                    value={form.stock}
                    onChange={(event) => setForm((p) => ({ ...p, stock: event.target.value }))}
                    placeholder="Ex: 25"
                    type="number"
                    min={0}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reduction (%)
                    </label>
                    <input
                      value={form.reduction}
                      onChange={(event) => setForm((p) => ({ ...p, reduction: event.target.value }))}
                      placeholder="20"
                      type="number"
                      min={0}
                      max={99}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sous-categorie
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(event) =>
                      setForm((p) => ({ ...p, subcategory: event.target.value }))
                    }
                    aria-label="Sous-categorie du produit"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    URL image principale
                  </label>
                  <input
                    value={form.image}
                    onChange={(event) => setForm((p) => ({ ...p, image: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    URL 2e photo
                  </label>
                  <input
                    value={form.images[0] ?? ""}
                    onChange={(event) => updateSecondaryImage(event.target.value)}
                    placeholder="https://... (photo detail supplementaire)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <label
                    htmlFor="product-images-upload"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Images depuis le PC (plusieurs)
                  </label>
                  <input
                    id="product-images-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProductImagesUpload}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((p) => ({ ...p, description: event.target.value }))
                    }
                    placeholder="Description premium du produit..."
                    className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <aside className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    <p className="text-sm font-bold text-indigo-700">
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
                    <p className="line-clamp-3 text-xs text-slate-600">
                      {form.description || "La description du produit apparait ici."}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    {editingId ? "Enregistrer les changements" : "Ajouter au catalogue"}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700"
                    onClick={cancelEditProduct}
                  >
                    {editingId ? "Annuler la modification" : "Fermer"}
                  </button>
                </div>
              </aside>
            </form>
          </div>
        </div>
      ) : null}

      <section
        className={`${activeSection === "products" ? "grid" : "hidden"} gap-4 sm:grid-cols-2 xl:grid-cols-3`}
      >
        <div id="dashboard-products-search" className="sm:col-span-2 xl:col-span-3">
          <input
            type="text"
            value={productQuery}
            onChange={(event) => setProductQuery(event.target.value)}
            placeholder="Rechercher un produit (nom, categorie, ID)"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        {loading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
        {filteredItems.map((item, index) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {index === 0 ? <span id="dashboard-products-list" className="sr-only">Liste des produits</span> : null}
            {(item.images?.[0] ?? item.image)?.trim() ? (
              <img
                src={item.images?.[0] ?? item.image}
                alt={item.name}
                className="mb-3 h-36 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                Aucune image
              </div>
            )}
            <p className="text-xs uppercase text-slate-500">{item.category}</p>
            <h3 className="text-base font-semibold">{item.name}</h3>
            <p className="text-sm text-slate-600">{item.description}</p>
            <p className="mt-2 font-semibold">{currency.format(item.price)}</p>
            <button
              onClick={() => startEditProduct(item)}
              className="mt-3 mr-2 rounded bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
            >
              Modifier
            </button>
            <button
              onClick={() => removeProduct(item.id)}
              className="mt-3 rounded bg-rose-100 px-3 py-1 text-sm text-rose-700"
            >
              Supprimer
            </button>
          </article>
        ))}
      </section>

      <section
        id="dashboard-categories"
        className={`${activeSection === "categories" ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categories</h2>
          <span className="text-sm text-slate-500">{dashboardCategories.length} categorie(s)</span>
        </div>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={startCreateCategory}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Nouvelle categorie
          </button>
        </div>
        {categoriesLoading ? <p className="text-sm text-slate-500">Chargement des categories...</p> : null}
        <div className="space-y-2">
          {dashboardCategories.map((category) => (
            <article
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3">
                {category.image?.trim() ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                    N/A
                  </div>
                )}
                <div>
                  <strong>{category.name}</strong>
                  <p className="text-xs text-slate-500">{category.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {category.isActive ? "active" : "inactive"}
                </span>
                <button
                  type="button"
                  onClick={() => startEditCategory(category)}
                  className="rounded bg-indigo-100 px-3 py-1 text-xs text-indigo-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="rounded bg-rose-100 px-3 py-1 text-xs text-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isCategoryFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-linear-to-r from-slate-950 via-indigo-950 to-violet-900 px-5 py-3 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-indigo-200">Catalogue</p>
                <h2 className="text-lg font-semibold">
                  {editingCategoryId ? "Modifier la categorie" : "Nouvelle categorie"}
                </h2>
              </div>
              <button
                type="button"
                onClick={cancelEditCategory}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
              >
                Fermer
              </button>
            </div>
            <form onSubmit={submitCategoryForm} className="grid gap-2 p-4 md:grid-cols-2">
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((p) => ({ ...p, name: event.target.value }))}
                placeholder="Nom categorie"
                className="rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((p) => ({ ...p, slug: event.target.value }))}
                placeholder="Slug (ex: mode-femme)"
                className="rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={categoryForm.image}
                onChange={(event) => setCategoryForm((p) => ({ ...p, image: event.target.value }))}
                placeholder="URL image (optionnel)"
                className="rounded border border-slate-200 px-3 py-2 text-sm md:col-span-2"
              />
              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 md:col-span-2">
                <label
                  htmlFor="category-image-upload"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
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
              <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white md:col-span-2">
                {editingCategoryId ? "Enregistrer la categorie" : "Ajouter la categorie"}
              </button>
              {editingCategoryId ? (
                <button
                  type="button"
                  onClick={cancelEditCategory}
                  className="rounded border border-slate-300 px-4 py-2 text-sm md:col-span-2"
                >
                  Annuler la modification
                </button>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      <section
        id="dashboard-banners"
        className={`${activeSection === "banners" ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bannieres</h2>
          <span className="text-sm text-slate-500">{dashboardBanners.length} banniere(s)</span>
        </div>
        <form onSubmit={submitBannerForm} className="mb-4 grid gap-2 md:grid-cols-2">
          <input
            value={bannerForm.title}
            onChange={(event) => setBannerForm((p) => ({ ...p, title: event.target.value }))}
            placeholder="Titre banniere"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={bannerForm.subtitle}
            onChange={(event) => setBannerForm((p) => ({ ...p, subtitle: event.target.value }))}
            placeholder="Sous-titre"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={bannerForm.image}
            onChange={(event) => setBannerForm((p) => ({ ...p, image: event.target.value }))}
            placeholder="URL image"
            className="rounded border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={bannerForm.link}
            onChange={(event) => setBannerForm((p) => ({ ...p, link: event.target.value }))}
            placeholder="Lien cible (ex: /ventes-flash)"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={bannerForm.position}
            onChange={(event) =>
              setBannerForm((p) => ({
                ...p,
                position: event.target.value as "hero" | "middle" | "sidebar",
              }))
            }
            aria-label="Position banniere"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="hero">hero</option>
            <option value="middle">middle</option>
            <option value="sidebar">sidebar</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={bannerForm.isActive}
              onChange={(event) => setBannerForm((p) => ({ ...p, isActive: event.target.checked }))}
            />
            Banniere active
          </label>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white md:col-span-2">
            {editingBannerId ? "Enregistrer la banniere" : "Ajouter la banniere"}
          </button>
          {editingBannerId ? (
            <button
              type="button"
              onClick={cancelEditBanner}
              className="rounded border border-slate-300 px-4 py-2 text-sm md:col-span-2"
            >
              Annuler la modification
            </button>
          ) : null}
        </form>
        {bannersLoading ? <p className="text-sm text-slate-500">Chargement des bannieres...</p> : null}
        <div className="space-y-2">
          {dashboardBanners.map((banner) => (
            <article
              key={banner.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <div>
                <strong>{banner.title}</strong>
                <p className="text-xs text-slate-500">
                  {banner.position} - {banner.link}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {banner.isActive ? "active" : "inactive"}
                </span>
                <button
                  type="button"
                  onClick={() => startEditBanner(banner)}
                  className="rounded bg-indigo-100 px-3 py-1 text-xs text-indigo-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => removeBanner(banner.id)}
                  className="rounded bg-rose-100 px-3 py-1 text-xs text-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="dashboard-orders"
        className={`${activeSection === "orders" ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dernieres commandes</h2>
          <span className="text-sm text-slate-500">
            {ordersTotal} commande(s) - page {ordersPage}/{ordersTotalPages}
          </span>
        </div>
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <input
            type="text"
            value={orderQuery}
            onChange={(event) => {
              setOrderQuery(event.target.value);
              setOrdersPage(1);
            }}
            placeholder="Rechercher une commande (ID, client, email)"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={orderStatusFilter}
            onChange={(event) => {
              setOrderStatusFilter(
                event.target.value as "all" | "pending_payment" | "pending_confirmation" | "paid" | "canceled",
              );
              setOrdersPage(1);
            }}
            aria-label="Filtrer les commandes par statut"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending_payment">En attente paiement</option>
            <option value="pending_confirmation">Paiement a la livraison</option>
            <option value="paid">Payee</option>
            <option value="canceled">Annulee</option>
          </select>
          <select
            value={`${orderSortBy}:${orderSortDir}`}
            onChange={(event) => {
              const [sortBy, sortDir] = event.target.value.split(":") as [
                "createdAt" | "total",
                "asc" | "desc",
              ];
              setOrderSortBy(sortBy);
              setOrderSortDir(sortDir);
              setOrdersPage(1);
            }}
            aria-label="Tri des commandes"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="createdAt:desc">Plus recentes</option>
            <option value="createdAt:asc">Plus anciennes</option>
            <option value="total:desc">Montant decroissant</option>
            <option value="total:asc">Montant croissant</option>
          </select>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportOrdersCsv}
            className="rounded border border-slate-300 px-3 py-1 text-xs"
          >
            Export CSV (page courante)
          </button>
          <select
            value={String(ordersPageSize)}
            onChange={(event) => {
              setOrdersPageSize(Number(event.target.value));
              setOrdersPage(1);
            }}
            aria-label="Taille de page commandes"
            className="rounded border border-slate-200 px-2 py-1 text-xs"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
        {ordersLoading ? <p className="text-sm text-slate-500">Chargement des commandes...</p> : null}
        {!ordersLoading && orders.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune commande enregistree.</p>
        ) : null}
        <div className="space-y-2">
          {orders.map((order) => (
            <article
              key={order.orderId}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{order.orderId}</strong>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{order.status}</span>
              </div>
              <p className="text-slate-600">
                {order.customerName} ({order.customerEmail})
              </p>
              <p className="text-slate-600">
                Total: {currency.format(order.total)} - Articles:{" "}
                {order.lines?.reduce((sum, line) => sum + line.quantity, 0) ?? 0}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={order.status}
                  onChange={(event) =>
                    void updateOrderStatus(
                      order.orderId,
                      event.target.value as "pending_payment" | "pending_confirmation" | "paid" | "canceled",
                    )
                  }
                  aria-label={`Statut de ${order.orderId}`}
                  disabled={updatingOrderId === order.orderId}
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                >
                  <option value="pending_payment">En attente paiement</option>
                  <option value="pending_confirmation">Paiement a la livraison</option>
                  <option value="paid">Payee</option>
                  <option value="canceled">Annulee</option>
                </select>
                <button
                  type="button"
                  onClick={() => openOrderDetails(order.orderId)}
                  className="rounded bg-slate-900 px-3 py-1 text-xs text-white"
                >
                  Voir details
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
            disabled={ordersPage <= 1}
            className="rounded border border-slate-300 px-3 py-1 text-xs disabled:opacity-50"
          >
            Precedent
          </button>
          <span className="text-xs text-slate-500">
            Page {ordersPage} / {ordersTotalPages}
          </span>
          <button
            type="button"
            onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
            disabled={ordersPage >= ordersTotalPages}
            className="rounded border border-slate-300 px-3 py-1 text-xs disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
        {orderDetailsLoading ? (
          <p className="mt-3 text-sm text-slate-500">Chargement des details...</p>
        ) : null}
        {selectedOrder ? (
          <article className="mt-4 rounded-lg border border-slate-200 p-3 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{selectedOrder.orderId}</h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded border border-slate-300 px-2 py-0.5 text-xs"
              >
                Fermer
              </button>
            </div>
            <p className="text-slate-600">
              {selectedOrder.customerName} ({selectedOrder.customerEmail})
            </p>
            <div className="mt-2 space-y-1">
              {selectedOrder.lines.map((line) => (
                <div
                  key={`${selectedOrder.orderId}-${line.id}`}
                  className="flex items-center justify-between rounded border border-slate-100 px-2 py-1"
                >
                  <span>
                    {line.name} x {line.quantity}
                  </span>
                  <strong>{currency.format(line.lineTotal)}</strong>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section
        id="dashboard-users"
        className={`${activeSection === "users" ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Utilisateurs</h2>
          <span className="text-sm text-slate-500">{users.length} utilisateur(s)</span>
        </div>
        <form onSubmit={submitUserForm} className="mb-4 grid gap-2 md:grid-cols-3">
          <input
            value={userForm.firstName}
            onChange={(event) => setUserForm((p) => ({ ...p, firstName: event.target.value }))}
            placeholder="Prenom"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={userForm.lastName}
            onChange={(event) => setUserForm((p) => ({ ...p, lastName: event.target.value }))}
            placeholder="Nom"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={userForm.email}
            onChange={(event) => setUserForm((p) => ({ ...p, email: event.target.value }))}
            placeholder="Email"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={userForm.phone}
            onChange={(event) => setUserForm((p) => ({ ...p, phone: event.target.value }))}
            placeholder="Telephone"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={userForm.city}
            onChange={(event) => setUserForm((p) => ({ ...p, city: event.target.value }))}
            placeholder="Ville"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={userForm.status}
            onChange={(event) =>
              setUserForm((p) => ({ ...p, status: event.target.value as "active" | "inactive" }))
            }
            aria-label="Statut utilisateur"
            className="rounded border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white md:col-span-3">
            {editingUserId ? "Enregistrer l'utilisateur" : "Ajouter un utilisateur"}
          </button>
          {editingUserId ? (
            <button
              type="button"
              onClick={cancelEditUser}
              className="rounded border border-slate-300 px-4 py-2 text-sm md:col-span-3"
            >
              Annuler la modification
            </button>
          ) : null}
        </form>
        {usersLoading ? <p className="text-sm text-slate-500">Chargement des utilisateurs...</p> : null}
        {!usersLoading && users.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun utilisateur enregistre.</p>
        ) : null}
        <div className="space-y-2">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{user.status}</span>
              </div>
              <p className="text-slate-600">{user.email}</p>
              <p className="text-slate-600">
                {user.phone} - {user.city}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEditUser(user)}
                  className="rounded bg-indigo-100 px-3 py-1 text-xs text-indigo-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="rounded bg-rose-100 px-3 py-1 text-xs text-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>
      </div>
    </main>
  );
}
