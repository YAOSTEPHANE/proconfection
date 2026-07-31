"use client";

import Link from "next/link";
import { useState } from "react";
import { getProductPriceForSize, type Product } from "@/lib/catalog";

type CartItem = Product & { quantity: number; selectedSize?: string };
const CART_STORAGE_KEY = "proconfection_cart";

type AddToCartButtonProps = {
  product: Product;
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const displayedUnitPrice = getProductPriceForSize(
    product,
    hasSizes && selectedSize.trim().length > 0 ? selectedSize : undefined,
  );
  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  });

  function decreaseQuantity() {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }

  function increaseQuantity() {
    setQuantity((prev) => (prev < 10 ? prev + 1 : 10));
  }

  function addToCart() {
    if (hasSizes && selectedSize.trim().length === 0) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as CartItem[]) : [];
      const normalizedSize = hasSizes ? selectedSize.trim() : undefined;

      const existing = current.find(
        (item) => item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? ""),
      );
      const unitPrice = getProductPriceForSize(product, normalizedSize);
      const next = existing
        ? current.map((item) =>
            item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? "")
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...current, { ...product, price: unitPrice, quantity, selectedSize: normalizedSize }];

      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("proconfection-cart-updated"));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1400);
    } catch {
      // Ignore localStorage errors gracefully.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold text-violet-700">
        Prix unitaire: {currency.format(displayedUnitPrice)}
      </p>
      {hasSizes ? (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Taille</span>
          <div className="flex flex-wrap items-center gap-2">
            {product.sizes?.map((size) => {
              const isActive = selectedSize === size;
              const sizePrice = getProductPriceForSize(product, size);
              return (
                <button
                  key={`${product.id}-${size}`}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                  }`}
                >
                  {size}
                  <span className={`ml-1 ${isActive ? "text-violet-100" : "text-slate-500"}`}>
                    · {currency.format(sizePrice)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-300 bg-white">
        <button
          type="button"
          onClick={decreaseQuantity}
          className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          aria-label="Diminuer la quantite"
        >
          -
        </button>
        <span className="min-w-10 px-2 text-center text-sm font-semibold text-slate-800">{quantity}</span>
        <button
          type="button"
          onClick={increaseQuantity}
          className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          aria-label="Augmenter la quantite"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={addToCart}
        disabled={hasSizes && selectedSize.trim().length === 0}
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {added ? "Ajoute au panier" : "Ajouter au panier"}
      </button>

      <Link
        href="/panier"
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Voir panier
      </Link>
    </div>
  );
}
