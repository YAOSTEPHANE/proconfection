import { categories } from "@/lib/catalog";

export type DashboardCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
  createdAt: string;
};

export type DashboardBanner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: "hero" | "middle" | "sidebar";
  isActive: boolean;
  createdAt: string;
};

export const defaultDashboardCategories: DashboardCategory[] = categories.map((category) => ({
  id: `cat-${category.toLowerCase()}`,
  name: category,
  slug: category.toLowerCase(),
  image: "",
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
}));

export const defaultDashboardBanners: DashboardBanner[] = [
  {
    id: "ban-hero-1",
    title: "Nouvelle collection",
    subtitle: "Decouvrez les tendances de la saison",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    link: "/ventes-flash",
    position: "hero",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  },
];
