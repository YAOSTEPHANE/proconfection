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

export const defaultProducts: Product[] = [
  {
    id: "v-1",
    name: "Robe Fleurie",
    category: "Vetements",
    subcategory: "Robes",
    price: 49000,
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
    ],
    description: "Robe legere en coton, coupe elegante pour tous les jours.",
    sizes: ["S", "M", "L"],
    sizePrices: {
      S: 47000,
      M: 49000,
      L: 51000,
    },
  },
  {
    id: "v-2",
    name: "Blazer Classique",
    category: "Vetements",
    subcategory: "Vestes",
    price: 68000,
    image:
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=80",
    description: "Blazer moderne pour un style chic au bureau.",
    sizes: ["M", "L", "XL"],
    sizePrices: {
      M: 66000,
      L: 68000,
      XL: 71000,
    },
  },
  {
    id: "c-1",
    name: "Sneakers Urban",
    category: "Chaussures",
    subcategory: "Sneakers",
    price: 75000,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    description: "Sneakers confortables avec semelle amortissante.",
    sizes: ["39", "40", "41", "42"],
    sizePrices: {
      "39": 73000,
      "40": 75000,
      "41": 77000,
      "42": 79000,
    },
  },
  {
    id: "s-1",
    name: "Sac Cuir Premium",
    category: "Sacs",
    subcategory: "Main",
    price: 89000,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
    ],
    description: "Sac a main en cuir veritable avec grande capacite.",
  },
  {
    id: "a-1",
    name: "Montre Minimaliste",
    category: "Accessoires",
    subcategory: "Montres",
    price: 39000,
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80",
    description: "Montre elegante pour completer toutes vos tenues.",
  },
  {
    id: "p-1",
    name: "Parfum Signature",
    category: "Produits",
    subcategory: "Parfums",
    price: 32000,
    image:
      "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=900&q=80",
    description: "Parfum aux notes florales et boisees longue tenue.",
  },
  {
    id: "b-1",
    name: "Collier Dore Elegant",
    category: "Bijoux",
    subcategory: "Colliers",
    price: 28000,
    image:
      "https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=900&q=80",
    description: "Collier fin dore pour un style chic et raffine.",
  },
  {
    id: "sp-1",
    name: "Ensemble Fitness Femme",
    category: "Sport",
    subcategory: "Fitness",
    price: 36000,
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    description: "Tenue respirante et confortable pour le sport quotidien.",
    sizes: ["S", "M", "L"],
    sizePrices: {
      S: 34000,
      M: 36000,
      L: 38000,
    },
  },
  {
    id: "e-1",
    name: "T-shirt Enfant Confort",
    category: "Enfants",
    subcategory: "Garcon",
    price: 14000,
    image:
      "https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=900&q=80",
    description: "T-shirt doux et resistant, ideal pour les enfants actifs.",
    sizes: ["4 ans", "6 ans", "8 ans"],
    sizePrices: {
      "4 ans": 13000,
      "6 ans": 14000,
      "8 ans": 15000,
    },
  },
  {
    id: "m-1",
    name: "Coussin Deco Premium",
    category: "Maison",
    subcategory: "Decoration",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&q=80",
    description: "Coussin decoratif moderne pour salon et chambre.",
  },
  {
    id: "v-3",
    name: "Chemise Lin Signature",
    category: "Vetements",
    subcategory: "Tenues pro",
    price: 42000,
    image:
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=80",
    description: "Chemise en lin respirant pour un look chic et leger.",
    sizes: ["M", "L", "XL"],
    sizePrices: {
      M: 40000,
      L: 42000,
      XL: 45000,
    },
  },
  {
    id: "ch-2",
    name: "Mocassins City Pro",
    category: "Chaussures",
    subcategory: "Ville",
    price: 64000,
    image:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=900&q=80",
    description: "Mocassins souples et elegants pour vos sorties en ville.",
    sizes: ["40", "41", "42", "43"],
    sizePrices: {
      "40": 62000,
      "41": 64000,
      "42": 66000,
      "43": 68000,
    },
  },
  {
    id: "s-2",
    name: "Sac Week-end Voyage",
    category: "Sacs",
    subcategory: "Voyage",
    price: 73000,
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
    description: "Sac de voyage spacieux et resistant pour vos deplacements.",
  },
  {
    id: "a-2",
    name: "Lunettes Retro Chic",
    category: "Accessoires",
    subcategory: "Lunettes",
    price: 27000,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
    description: "Lunettes de soleil retro pour un style moderne.",
  },
  {
    id: "p-2",
    name: "Serum Eclat Nuit",
    category: "Produits",
    subcategory: "Soins",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    description: "Serum de nuit hydratant pour une peau plus lumineuse.",
  },
  {
    id: "b-2",
    name: "Bracelet Or Rose",
    category: "Bijoux",
    subcategory: "Bracelets",
    price: 31000,
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80",
    description: "Bracelet fin en or rose, discret et raffine.",
  },
  {
    id: "sp-2",
    name: "Chaussures Running Air",
    category: "Sport",
    subcategory: "Running",
    price: 58000,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
    ],
    description: "Chaussures de running legeres avec bon amorti.",
    sizes: ["39", "40", "41", "42"],
    sizePrices: {
      "39": 56000,
      "40": 58000,
      "41": 60000,
      "42": 62000,
    },
  },
  {
    id: "e-2",
    name: "Robe Fille Fleurie",
    category: "Enfants",
    subcategory: "Fille",
    price: 19000,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    description: "Robe legere et confortable pour les occasions speciales.",
    sizes: ["6 ans", "8 ans", "10 ans"],
    sizePrices: {
      "6 ans": 18000,
      "8 ans": 19000,
      "10 ans": 21000,
    },
  },
  {
    id: "m-2",
    name: "Lampe Design Salon",
    category: "Maison",
    subcategory: "Salon",
    price: 34000,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    description: "Lampe moderne pour une ambiance chaleureuse dans le salon.",
  },
];
