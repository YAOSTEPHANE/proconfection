export type Category = string;

export type Product = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  stock?: number;
  image: string;
  images?: string[];
  description: string;
  sizes?: string[];
  sizePrices?: Record<string, number>;
};

export type SchoolPricingCoefficients = {
  jacquesPrevert: number;
  blaisePascal: number;
  jeanMermoz: number;
};

export const DEFAULT_SCHOOL_PRICING_COEFFICIENTS: SchoolPricingCoefficients = {
  jacquesPrevert: 1,
  blaisePascal: 1.06,
  jeanMermoz: 1.1,
};

function parseNumericSize(size: string): number | null {
  const match = size.match(/\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveSizePrice(product: Product, selectedSize: string): number {
  if (!product.sizes || product.sizes.length === 0) {
    return product.price;
  }
  const sizeIndex = product.sizes.findIndex((size) => size === selectedSize);
  if (sizeIndex < 0) {
    return product.price;
  }

  const numericSizes = product.sizes
    .map((size) => parseNumericSize(size))
    .filter((value): value is number => value !== null);
  const selectedNumericSize = parseNumericSize(selectedSize);
  if (numericSizes.length === product.sizes.length && selectedNumericSize !== null) {
    const minSize = Math.min(...numericSizes);
    return Math.round(product.price + (selectedNumericSize - minSize) * 500);
  }

  return Math.round(product.price + sizeIndex * 1000);
}

export function getProductPriceForSize(product: Product, selectedSize?: string): number {
  if (!selectedSize) {
    return product.price;
  }
  const explicitPrice = product.sizePrices?.[selectedSize];
  if (typeof explicitPrice === "number" && Number.isFinite(explicitPrice) && explicitPrice > 0) {
    return explicitPrice;
  }
  return deriveSizePrice(product, selectedSize);
}

export const categories: Category[] = [
  "Jacques Prevert",
  "Blaise Pascal",
  "Jean Mermoz",
  "Tenue Standard",
  "Accessoires",
];

export const categorySlugMap: Record<string, string> = {
  "Jacques Prevert": "jacques-prevert",
  "Blaise Pascal": "blaise-pascal",
  "Jean Mermoz": "jean-mermoz",
  "Tenue Standard": "tenue-standard",
  Accessoires: "accessoires",
};

export const categoryImageMap: Record<string, string> = {
  "Jacques Prevert":
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  "Blaise Pascal":
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
  "Jean Mermoz": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
  "Tenue Standard":
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
  Accessoires:
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80",
};

export const categorySubcategoriesMap: Record<string, string[]> = {
  "Jacques Prevert": ["Maternel JP", "Primaire JP", "Tenues de Sport"],
  "Blaise Pascal": ["Tenues Filles BP", "Tenues Garcons BP", "Tenues Sports BP"],
  "Jean Mermoz": ["Maternel JM", "Primaire JM", "College JM", "Tenues de Sport JM"],
  "Tenue Standard": ["Maternel standard", "Primaire standard", "college standard"],
  Accessoires: ["Sac Maternel", "Sac Primaire", "Sac College & Lycee"],
};

export function categoryToSlug(category: string): string {
  return categorySlugMap[category] ?? category.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string): Category | null {
  const match = Object.entries(categorySlugMap).find(
    ([, value]) => value === slug,
  );
  return match ? match[0] : null;
}

export function getRemainingStock(productId: string): number {
  // Deterministic mock stock count for UI display.
  const seed = productId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (seed % 18) + 3;
}

function withDiscount(price: number, discountPercentage: number): { oldPrice: number; discountPercentage: number } {
  const safeDiscount = Math.max(1, Math.min(discountPercentage, 80));
  return {
    oldPrice: Math.round(price / (1 - safeDiscount / 100)),
    discountPercentage: safeDiscount,
  };
}

export function applySchoolPricingGrid(
  products: Product[],
  coefficients: SchoolPricingCoefficients = DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
): Product[] {
  return products.map((product) => {
    const lowerName = product.name.toLowerCase();
    const lowerSubcategory = (product.subcategory ?? "").toLowerCase();
    const schoolMultiplier =
      product.category === "Blaise Pascal"
        ? coefficients.blaisePascal
        : product.category === "Jean Mermoz"
          ? coefficients.jeanMermoz
          : coefficients.jacquesPrevert;
    const asSchoolPrice = (basePrice: number): number =>
      Math.round((basePrice * schoolMultiplier) / 500) * 500;

    if (product.category === "Accessoires") {
      if (lowerName.includes("trousse")) {
        const price = 7000;
        return { ...product, price, ...withDiscount(price, 12) };
      }
      if (lowerSubcategory.includes("maternel")) {
        const price = 15000;
        return { ...product, price, ...withDiscount(price, 15) };
      }
      if (lowerSubcategory.includes("primaire")) {
        const price = 18000;
        return { ...product, price, ...withDiscount(price, 17) };
      }
      const price = 22000;
      return { ...product, price, ...withDiscount(price, 18) };
    }

    if (lowerName.includes("sport")) {
      const price = asSchoolPrice(12000);
      return { ...product, price, ...withDiscount(price, 14) };
    }

    if (lowerName.includes("ensemble")) {
      if (lowerSubcategory.includes("maternel")) {
        const price = asSchoolPrice(26000);
        return { ...product, price, ...withDiscount(price, 16) };
      }
      if (lowerSubcategory.includes("primaire")) {
        const price = asSchoolPrice(32000);
        return { ...product, price, ...withDiscount(price, 18) };
      }
      const price = asSchoolPrice(38000);
      return { ...product, price, ...withDiscount(price, 19) };
    }

    if (
      lowerName.includes("robe") ||
      lowerName.includes("jupe") ||
      lowerName.includes("blouse") ||
      lowerName.includes("chemise") ||
      lowerName.includes("pantalon")
    ) {
      if (lowerSubcategory.includes("maternel")) {
        const price = asSchoolPrice(15000);
        return { ...product, price, ...withDiscount(price, 14) };
      }
      if (lowerSubcategory.includes("primaire")) {
        const price = asSchoolPrice(18000);
        return { ...product, price, ...withDiscount(price, 16) };
      }
      const price = asSchoolPrice(22000);
      return { ...product, price, ...withDiscount(price, 18) };
    }

    return product;
  });
}

const seedProducts: Product[] = [
  {
    id: "jp-garcon-chemise-manche-longue",
    name: "Chemise blanche garcon manche longue",
    category: "Jacques Prevert",
    subcategory: "Primaire JP",
    price: 16000,
    oldPrice: 19000,
    discountPercentage: 16,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9041-scaled-1-2c1f22a5-0475-44a3-b2ed-3b3c444a5bb7.png",
    description: "Chemise blanche de tenue scolaire, coupe classique.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "jp-garcon-chemise-manche-longue-2",
    name: "Chemise blanche garcon col classique",
    category: "Jacques Prevert",
    subcategory: "Primaire JP",
    price: 16000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9038-scaled-1-e7045e5f-0d46-4d5f-9e22-ccd7c18bc91d.png",
    description: "Chemise blanche facile a assortir avec pantalon ou jupe.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "jp-fille-robe-bleue",
    name: "Robe fille bleu carreaux",
    category: "Jacques Prevert",
    subcategory: "Maternel JP",
    price: 18000,
    oldPrice: 22000,
    discountPercentage: 18,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9067-scaled-1-1e3eaafb-f190-4eca-8126-5a7996dec1ea.png",
    description: "Robe scolaire fille en tissu leger, style maternelle.",
    sizes: ["3 ans", "4 ans", "5 ans", "6 ans"],
  },
  {
    id: "jp-garcon-look-complet-bleu",
    name: "Ensemble garcon bleu (chemise + pantalon)",
    category: "Jacques Prevert",
    subcategory: "Primaire JP",
    price: 32000,
    oldPrice: 39000,
    discountPercentage: 18,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9040-scaled-1-a44ad085-70a6-43fc-ade6-4e1237bd4396.png",
    description: "Ensemble scolaire complet pour garcon.",
    sizes: ["8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "jp-fille-pantalon-bleu",
    name: "Pantalon bleu fille",
    category: "Jacques Prevert",
    subcategory: "College JM",
    price: 15000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8974-scaled-1-02a01559-05ed-4b5f-bb3e-6f99a73b99ae.png",
    description: "Pantalon scolaire fille avec coupe ajustee.",
    sizes: ["10 ans", "12 ans", "14 ans", "16 ans"],
  },
  {
    id: "bp-garcon-beige-court",
    name: "Ensemble beige garcon manche courte",
    category: "Blaise Pascal",
    subcategory: "Tenues Garcons BP",
    price: 28000,
    oldPrice: 34000,
    discountPercentage: 18,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8993-scaled-1-0a880a0d-de0e-414f-9e34-b12c3eac47be.png",
    description: "Tenue scolaire beige garcon pour la saison chaude.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "bp-garcon-beige-court-2",
    name: "Ensemble beige garcon style classique",
    category: "Blaise Pascal",
    subcategory: "Tenues Garcons BP",
    price: 28000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8992-scaled-1-e42cb7b5-d7d7-44bd-b8f2-dd6325887e35.png",
    description: "Uniforme garcon beige avec short/pantalon selon taille.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "bp-sport-garcon-blanc-bleu",
    name: "Tenue sport garcon blanc et bleu",
    category: "Blaise Pascal",
    subcategory: "Tenues Sports BP",
    price: 12000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9092-scaled-1-c3099ec4-314f-4dbd-81fc-be4d8dc5c230.png",
    description: "Tenue de sport scolaire pour garcon.",
    sizes: ["8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "access-sac-hibou",
    name: "Sac maternelle hibou bleu",
    category: "Accessoires",
    subcategory: "Sac Maternel",
    price: 16000,
    oldPrice: 20000,
    discountPercentage: 20,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Ban112-a96131ae-593c-4a61-8c21-854daad35e0b.png",
    description: "Sac maternelle leger et confortable, design hibou.",
  },
  {
    id: "bp-sport-fille-blanc-bleu",
    name: "Tenue sport fille blanc et bleu",
    category: "Blaise Pascal",
    subcategory: "Tenues Sports BP",
    price: 12000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9097-scaled-1-7a9a16ac-9f22-4ba1-941a-6729f921727c.png",
    description: "Tenue de sport legere pour fille.",
    sizes: ["8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "bp-sport-garcon-blanc-bleu-2",
    name: "Tenue sport garcon logo ecole",
    category: "Blaise Pascal",
    subcategory: "Tenues Sports BP",
    price: 12000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9093-scaled-1-142f7e72-8052-48db-b306-3cdec91c4a6b.png",
    description: "T-shirt et short pour activites sportives.",
    sizes: ["8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "bp-garcon-beige-short",
    name: "Tenue beige garcon short",
    category: "Blaise Pascal",
    subcategory: "Tenues Garcons BP",
    price: 25000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9082-scaled-c3fdd410-eff6-4d52-b4ca-28b71cd653e4.png",
    description: "Uniforme garcon beige avec short.",
    sizes: ["5 ans", "6 ans", "7 ans", "8 ans"],
  },
  {
    id: "bp-garcon-beige-short-2",
    name: "Tenue beige garcon primaire",
    category: "Blaise Pascal",
    subcategory: "Tenues Garcons BP",
    price: 25000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8949-scaled-6950d7c3-dada-45d3-8f43-4c7a54a43db4.png",
    description: "Ensemble tenue scolaire beige pour primaire.",
    sizes: ["5 ans", "6 ans", "7 ans", "8 ans"],
  },
  {
    id: "bp-garcon-beige-cargo",
    name: "Pantalon cargo beige garcon",
    category: "Blaise Pascal",
    subcategory: "Tenues Garcons BP",
    price: 14000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9081-scaled-fdeceb43-1c11-46a2-9f46-332519c11764.png",
    description: "Pantalon cargo beige robuste pour usage quotidien.",
    sizes: ["8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "bp-fille-rose-maternelle",
    name: "Robe rose maternelle",
    category: "Blaise Pascal",
    subcategory: "Tenues Filles BP",
    price: 17000,
    oldPrice: 21000,
    discountPercentage: 19,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8950-scaled-64a907ed-29ec-40ff-8b84-9f84278e776e.png",
    description: "Robe fille rose a carreaux pour maternelle.",
    sizes: ["3 ans", "4 ans", "5 ans", "6 ans"],
  },
  {
    id: "bp-fille-rose-sans-manches",
    name: "Robe rose fille sans manches",
    category: "Blaise Pascal",
    subcategory: "Tenues Filles BP",
    price: 18000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8934-scaled-dad7623b-ebb6-4e5d-abc1-b1663dd67ccc.png",
    description: "Robe rose style classique avec finitions blanches.",
    sizes: ["4 ans", "5 ans", "6 ans", "7 ans"],
  },
  {
    id: "bp-fille-rose-col",
    name: "Robe rose fille col rond",
    category: "Blaise Pascal",
    subcategory: "Tenues Filles BP",
    price: 18000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8931-scaled-9ce5019e-b5b8-4c3a-88a6-2ad8a1d91dac.png",
    description: "Robe rose a carreaux, coupe confortable.",
    sizes: ["4 ans", "5 ans", "6 ans", "7 ans"],
  },
  {
    id: "jp-fille-chemise-blanche",
    name: "Chemise blanche fille manches courtes",
    category: "Jacques Prevert",
    subcategory: "College JM",
    price: 15000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8987-scaled-5dd0a93e-93b2-4dff-aca9-799cf9866408.png",
    description: "Chemise blanche fille avec coupe ajustee.",
    sizes: ["10 ans", "12 ans", "14 ans", "16 ans"],
  },
  {
    id: "jp-fille-chemise-blanche-portrait",
    name: "Chemise blanche fille uniforme",
    category: "Jacques Prevert",
    subcategory: "College JM",
    price: 15000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8951-scaled-fd5c8fde-e9e9-48ed-a578-6218d1a27f4b.png",
    description: "Chemise blanche scolaire pour college/lycee.",
    sizes: ["10 ans", "12 ans", "14 ans", "16 ans"],
  },
  {
    id: "jp-fille-robe-bleu-modele-2",
    name: "Robe bleue fille poches blanches",
    category: "Jacques Prevert",
    subcategory: "Primaire JP",
    price: 19000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9025-scaled-1-05bc1b16-e8c0-443e-b4c4-20fa9d7c10db.png",
    description: "Robe bleue a carreaux avec poches, modele primaire.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "jp-fille-robe-bleu-modele-3",
    name: "Robe bleue fille a volant",
    category: "Jacques Prevert",
    subcategory: "Primaire JP",
    price: 19000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9024-scaled-1-3f6a27d2-9db4-4904-be21-b68673aa13fb.png",
    description: "Robe scolaire bleu marine avec finitions soignes.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "access-trousse-3-compartiments",
    name: "Trousse 3 compartiments",
    category: "Accessoires",
    subcategory: "Sac Primaire",
    price: 6500,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9139-scaled-1-54c98527-56ce-427e-a323-e76425884335.png",
    description: "Trousse scolaire multi-poches pour stylos et accessoires.",
  },
  {
    id: "bp-fille-bleu-robe-moderne",
    name: "Robe bleu marine fille moderne",
    category: "Blaise Pascal",
    subcategory: "Tenues Filles BP",
    price: 21000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9069-scaled-1-bca8a333-ee15-45ee-b90a-b8ac061ff177.png",
    description: "Robe bleue avec details volants pour fille.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "jm-fille-bleu-robe-longue",
    name: "Robe bleue fille coupe ample",
    category: "Jean Mermoz",
    subcategory: "Primaire JM",
    price: 20000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9004-scaled-ad50b309-4664-412c-ba34-7d4919c26621.png",
    description: "Robe confortable avec coupe ample et poches.",
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
  {
    id: "jm-fille-bleu-robe-col-rond",
    name: "Robe bleue fille col rond",
    category: "Jean Mermoz",
    subcategory: "College JM",
    price: 22000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_1175-scaled-89ecc488-29ca-4a3d-8573-c9f3b06f8870.png",
    description: "Robe bleu marine pour tenue quotidienne.",
    sizes: ["10 ans", "12 ans", "14 ans", "16 ans"],
  },
  {
    id: "jm-fille-blouse-blanche",
    name: "Blouse blanche fille",
    category: "Jean Mermoz",
    subcategory: "College JM",
    price: 15000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8944-scaled-03746593-8011-49c6-bc14-095e92dd3f76.png",
    description: "Blouse blanche manches courtes style college.",
    sizes: ["10 ans", "12 ans", "14 ans", "16 ans"],
  },
  {
    id: "jm-garcon-chemise-bleue",
    name: "Chemise bleue garcon primaire",
    category: "Jean Mermoz",
    subcategory: "Primaire JM",
    price: 15500,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9119-scaled-1dac07db-61b7-4e94-952a-19402accfd7c.png",
    description: "Chemise a carreaux bleus pour garcon.",
    sizes: ["5 ans", "6 ans", "7 ans", "8 ans"],
  },
  {
    id: "jm-garcon-chemise-bleue-2",
    name: "Chemise bleue garcon manches courtes",
    category: "Jean Mermoz",
    subcategory: "Primaire JM",
    price: 15500,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_9105-scaled-9b8c89fa-96f8-4b8c-b484-532b460818a1.png",
    description: "Chemise scolaire bleue a petits carreaux.",
    sizes: ["5 ans", "6 ans", "7 ans", "8 ans"],
  },
  {
    id: "jm-fille-bleu-jupe-bretelles",
    name: "Jupe bleue fille a bretelles",
    category: "Jean Mermoz",
    subcategory: "Maternel JM",
    price: 18000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8923-scaled-5f4ff306-897d-4201-bb60-aa134d39e752.png",
    description: "Jupe uniforme avec bretelles croisees.",
    sizes: ["4 ans", "5 ans", "6 ans", "7 ans"],
  },
  {
    id: "jm-fille-bleu-jupe-bretelles-dos",
    name: "Jupe bleue fille vue dos",
    category: "Jean Mermoz",
    subcategory: "Maternel JM",
    price: 18000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_IMG_8960-scaled-83769a1f-d4f0-4905-93f1-8295f53865bb.png",
    description: "Version dos de la jupe bretelles, meme tissu.",
    sizes: ["4 ans", "5 ans", "6 ans", "7 ans"],
  },
  {
    id: "access-sac-frozen-rose",
    name: "Sac scolaire rose Frozen",
    category: "Accessoires",
    subcategory: "Sac Primaire",
    price: 15000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Sans-titre-3-70535e30-82f8-4cc4-8496-75eb52d12023.png",
    description: "Sac primaire rose avec motif Frozen.",
  },
  {
    id: "access-sac-princess-violet",
    name: "Sac scolaire princess violet",
    category: "Accessoires",
    subcategory: "Sac Primaire",
    price: 16500,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Sans-titre-59-79a99657-7edf-4567-a029-3375f3e4e524.png",
    description: "Sac primaire avec compartiments multiples.",
  },
  {
    id: "access-sac-mickey-noir-orange",
    name: "Sac college Mickey noir orange",
    category: "Accessoires",
    subcategory: "Sac College & Lycee",
    price: 19000,
    oldPrice: 24000,
    discountPercentage: 21,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Sans-titre-11-22899e03-78b4-4293-8977-cd7236b2dba5.png",
    description: "Sac solide pour college avec grande capacite.",
  },
  {
    id: "access-sac-patpatrouille",
    name: "Sac primaire Pat Patrouille",
    category: "Accessoires",
    subcategory: "Sac Primaire",
    price: 17000,
    oldPrice: 21000,
    discountPercentage: 19,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Sans-titre-9-a6e2f998-f97b-4d24-8e25-39b703036292.png",
    description: "Sac scolaire enfant avec poches laterales.",
  },
  {
    id: "access-sac-boboi-boy",
    name: "Sac scolaire Boboiboy",
    category: "Accessoires",
    subcategory: "Sac Primaire",
    price: 17000,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Sans-titre-7-b296b07b-8eca-4c26-8e24-0bc6853cd772.png",
    description: "Sac primaire avec fermeture zip et poche frontale.",
  },
  {
    id: "access-sac-princess-rose-turquoise",
    name: "Sac princess rose turquoise",
    category: "Accessoires",
    subcategory: "Sac Primaire",
    price: 17500,
    oldPrice: 22000,
    discountPercentage: 20,
    image:
      "/api/catalog-images/c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_Sans-titre-10-837f4dce-5ca9-4efc-b8ca-8a2fe4e691a4.png",
    description: "Sac scolaire fille avec grand compartiment central.",
  },
];

export const defaultProducts: Product[] = applySchoolPricingGrid(seedProducts);
