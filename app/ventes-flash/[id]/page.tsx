import Image from "next/image";
import Link from "next/link";
import {
  applySchoolPricingGrid,
  DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
  defaultProducts,
  getRemainingStock,
  type Product,
  type SchoolPricingCoefficients,
} from "@/lib/catalog";
import { getDb } from "@/lib/mongodb";
import AddToCartButton from "./AddToCartButton";
import ProductImageGallery from "./ProductImageGallery";
import ProductDetailMenu from "./ProductDetailMenu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VenteFlashDetailPageProps = {
  params: Promise<{ id: string }>;
};

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

async function loadProducts(): Promise<Product[]> {
  try {
    const db = await getDb();
    const pricingConfig = await db
      .collection<{ id: "school-pricing"; coefficients: SchoolPricingCoefficients }>("app_settings")
      .findOne({ id: "school-pricing" }, { projection: { _id: 0 } });
    const coefficients = pricingConfig?.coefficients ?? DEFAULT_SCHOOL_PRICING_COEFFICIENTS;

    const data = await db
      .collection<Product>("products")
      .find({}, { projection: { _id: 0 } })
      .toArray();

    if (data.length === 0) {
      return applySchoolPricingGrid(defaultProducts, coefficients);
    }

    // Produits déjà en base : ne pas réécraser les prix admin / sizePrices.
    return data;
  } catch (error) {
    console.warn("Fiche produit: fallback defaultProducts:", error);
    return defaultProducts;
  }
}

export default async function VenteFlashDetailPage({ params }: VenteFlashDetailPageProps) {
  const { id } = await params;
  const products = await loadProducts();
  const product = products.find((item) => item.id === id);

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Produit introuvable</h1>
        <Link href="/ventes-flash" className="text-sm font-semibold text-indigo-600">
          Retour aux ventes flash
        </Link>
      </main>
    );
  }

  const remainingStock =
    typeof product.stock === "number" ? product.stock : getRemainingStock(product.id);
  const similarProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);
  const fallbackGallery = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .map((item) => item.image)
    .slice(0, 2);
  const galleryImages = product.images?.length
    ? product.images
    : [product.image, ...fallbackGallery];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link href="/ventes-flash" className="text-sm font-semibold text-indigo-600">
        Retour aux ventes flash
      </Link>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <ProductImageGallery productName={product.name} images={galleryImages} />

        <div className="space-y-4">
          <ProductDetailMenu description={product.description} />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
            {product.subcategory ? (
              <p className="mt-1 text-xs text-slate-600">{product.subcategory}</p>
            ) : null}
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Stock</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{remainingStock} en stock</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Expedition</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">24h - 72h</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Garantie</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Qualite verifiee</p>
            </div>
          </div>

          <div className="space-y-3">
            <AddToCartButton product={product} remainingStock={remainingStock} />
            <Link
              href="/categories"
              className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Voir categories
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800">Produits similaires</h2>
        {similarProducts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun produit similaire pour le moment.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarProducts.map((item) => (
              <Link
                key={`similar-${item.id}`}
                href={`/ventes-flash/${item.id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="aspect-[3/4] overflow-hidden bg-[#f8f7f5]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={900}
                    height={1200}
                    className="h-full w-full object-contain object-center transition duration-300"
                  />
                </div>
                <div className="space-y-1 p-3">
                  <p className="text-xs uppercase text-slate-500">{item.category}</p>
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-sm font-semibold text-violet-700">
                    {currency.format(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
