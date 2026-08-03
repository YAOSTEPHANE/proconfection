import { categories, categoryToSlug } from "@/lib/catalog";

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
  slug: categoryToSlug(category),
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
  {
    id: "ban-side-1",
    title: "Chaussures premium",
    subtitle: "39 000 XOF",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
    link: "/categories",
    position: "sidebar",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:01.000Z").toISOString(),
  },
  {
    id: "ban-side-2",
    title: "Sacs tendance",
    subtitle: "28 000 XOF",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    link: "/categories",
    position: "sidebar",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:02.000Z").toISOString(),
  },
  {
    id: "ban-mid-1",
    title: "Bijoux iconiques",
    subtitle: "Nouvelles pieces en edition limitee",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=80",
    link: "/categories",
    position: "middle",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:03.000Z").toISOString(),
  },
  {
    id: "ban-mid-2",
    title: "Collection sport active",
    subtitle: "Confort et performance au quotidien",
    image:
      "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=1600&q=80",
    link: "/categories",
    position: "middle",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:04.000Z").toISOString(),
  },
  {
    id: "ban-mid-3",
    title: "Style premium urbain",
    subtitle: "Looks modernes pour chaque occasion",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    link: "/categories",
    position: "middle",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:05.000Z").toISOString(),
  },
];

export const defaultSidebarBanners = defaultDashboardBanners.filter(
  (banner) => banner.position === "sidebar",
);

export const defaultMiddleBanners = defaultDashboardBanners.filter(
  (banner) => banner.position === "middle",
);

export const defaultHeroBanners = defaultDashboardBanners.filter(
  (banner) => banner.position === "hero",
);
