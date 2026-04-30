import Image from "next/image";
import Link from "next/link";
import { defaultProducts, getRemainingStock, type Product } from "@/lib/catalog";
import { getDb } from "@/lib/mongodb";
import AddToCartButton from "./AddToCartButton";
import ProductImageGallery from "./ProductImageGallery";
import ProductDetailMenu from "./ProductDetailMenu";

type VenteFlashDetailPageProps = {
  params: Promise<{ id: string }>;
};

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export default async function VenteFlashDetailPage({ params }: VenteFlashDetailPageProps) {
  const { id } = await params;
  let products = defaultProducts;
  if (process.env.NODE_ENV !== "production") {
    try {
      const db = await getDb();
      const data = await db
        .collection<Product>("products")
        .find({}, { projection: { _id: 0 } })
        .toArray();
      if (data.length > 0) {
        products = data;
      }
    } catch {
      products = defaultProducts;
    }
  }

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

  const discount =
    typeof product.discountPercentage === "number" && product.discountPercentage > 0
      ? product.discountPercentage
      : typeof product.oldPrice === "number" &&
          product.oldPrice > product.price &&
          product.price > 0
        ? Math.max(1, Math.round((1 - product.price / product.oldPrice) * 100))
        : 20;
  const oldPrice =
    typeof product.oldPrice === "number" && product.oldPrice > product.price
      ? product.oldPrice
      : Math.round(product.price / (1 - discount / 100));
  const remainingStock = typeof product.stock === "number" ? product.stock : getRemainingStock(product.id);
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
              <p className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                Vente flash
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900">{product.name}</h1>
              <ProductDetailMenu description={product.description} />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Categorie</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{product.category}</p>
                {product.subcategory ? (
                  <p className="mt-1 text-xs text-slate-600">{product.subcategory}</p>
                ) : null}
              </div>
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Disponibilite</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {remainingStock} en stock
                  </p>
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

              {product.sizes ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tailles disponibles</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{product.sizes.join(", ")}</p>
                </div>
              ) : null}

              <div className="flex items-end gap-3">
                <strong className="text-2xl font-extrabold text-violet-700">
                  {currency.format(product.price)}
                </strong>
                <span className="pb-1 text-sm text-slate-400 line-through">
                  {currency.format(oldPrice)}
                </span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                  -{discount}%
                </span>
              </div>
              <p className="text-sm font-semibold text-rose-600">
                Plus que {remainingStock} article(s) en stock
              </p>

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Panier rapide depuis la fiche produit
                </p>
                <AddToCartButton product={product} />
                <Link
                  href="/categories"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Voir categories
                </Link>
              </div>
            </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Produits similaires</h2>
        {similarProducts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun produit similaire disponible.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarProducts.map((item) => (
              <Link
                key={`similar-${item.id}`}
                href={`/ventes-flash/${item.id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={900}
                  height={600}
                  className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="space-y-1 p-3">
                  <p className="text-xs uppercase text-slate-500">{item.category}</p>
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-sm font-semibold text-violet-700">{currency.format(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
