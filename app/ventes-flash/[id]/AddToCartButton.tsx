"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CLOTHING_SIZE_OPTIONS,
  TSHIRT_SIZE_OPTIONS,
  encodeComboSelection,
  getComboConfigForAge,
  getComboTotalPrice,
  getProductPriceForSize,
  needsComboSizeSelection,
  type Product,
} from "@/lib/catalog";

type CartItem = Product & { quantity: number; selectedSize?: string };
const CART_STORAGE_KEY = "proconfection_cart";

function isClothingSizeOnly(sizes?: string[]): boolean {
  if (!sizes || sizes.length === 0) {
    return false;
  }
  return sizes.every((size) => /^[1-6]$/.test(size.trim()));
}

type AddToCartButtonProps = {
  product: Product;
  remainingStock?: number;
};

export default function AddToCartButton({ product, remainingStock }: AddToCartButtonProps) {
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const clothingSizesOnly = isClothingSizeOnly(product.sizes);
  const isCombo = needsComboSizeSelection(product) && !clothingSizesOnly;
  const ageOptions = useMemo(
    () =>
      (product.sizes ?? []).filter(
        (size) => !/^[1-6]$/.test(size.trim()) && !/^(S|M|L|XL|XXL)$/i.test(size.trim()),
      ),
    [product.sizes],
  );

  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  /** Âge pour le prix (optionnel si pas d'âges configurés) */
  const [selectedAge, setSelectedAge] = useState(() => ageOptions[0] ?? "");
  /** Choix obligatoires client — pas de pré-sélection */
  const [selectedTshirtSize, setSelectedTshirtSize] = useState("");
  const [selectedShortSize, setSelectedShortSize] = useState("");
  const [selectedSize, setSelectedSize] = useState(() => product.sizes?.[0] ?? "");

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const pricingKey = isCombo
    ? selectedAge || ageOptions[0] || undefined
    : hasSizes && selectedSize.trim().length > 0
      ? selectedSize
      : undefined;

  const ageCombo = isCombo ? getComboConfigForAge(product, pricingKey) : null;

  const displayedUnitPrice = getProductPriceForSize(product, pricingKey);

  const hasChosenComboSizes =
    selectedTshirtSize.trim().length > 0 && selectedShortSize.trim().length > 0;

  const cartSizeLabel = isCombo
    ? hasChosenComboSizes
      ? encodeComboSelection({
          age: (selectedAge || ageOptions[0] || "Taille").trim(),
          tshirtSize: selectedTshirtSize.trim(),
          shortSize: selectedShortSize.trim(),
        })
      : undefined
    : hasSizes
      ? selectedSize.trim()
      : undefined;

  function decreaseQuantity() {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }

  function increaseQuantity() {
    setQuantity((prev) => (prev < 10 ? prev + 1 : 10));
  }

  function addToCart() {
    if (isCombo && !hasChosenComboSizes) {
      return;
    }
    if (!isCombo && hasSizes && selectedSize.trim().length === 0) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as CartItem[]) : [];
      const normalizedSize = cartSizeLabel;

      const existing = current.find(
        (item) => item.id === product.id && (item.selectedSize ?? "") === (normalizedSize ?? ""),
      );
      const unitPrice = getProductPriceForSize(product, pricingKey);
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

  const canAdd = isCombo
    ? hasChosenComboSizes
    : !hasSizes || selectedSize.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <strong className="text-2xl font-extrabold text-violet-700">
          {currency.format(displayedUnitPrice)}
        </strong>
        {isCombo ? (
          <p className="text-xs text-slate-500">
            {hasChosenComboSizes
              ? `T-shirt ${selectedTshirtSize} · Short taille ${selectedShortSize}${
                  selectedAge ? ` · ${selectedAge}` : ""
                }`
              : "Choisissez la taille du T-shirt et la taille du short"}
          </p>
        ) : hasSizes ? (
          <p className="text-xs text-slate-500">
            {selectedSize
              ? `Prix pour ${selectedSize}`
              : clothingSizesOnly
                ? "Sélectionnez une taille pour afficher le prix"
                : "Sélectionnez un âge / une taille pour afficher le prix"}
          </p>
        ) : null}
        {ageCombo ? (
          <p className="text-xs text-slate-500">
            T-shirt {currency.format(ageCombo.tshirtPrice)} + short{" "}
            {currency.format(ageCombo.shortPrice)} ={" "}
            {currency.format(getComboTotalPrice(ageCombo.tshirtPrice, ageCombo.shortPrice))}
          </p>
        ) : null}
      </div>

      {typeof remainingStock === "number" ? (
        <p className="text-sm font-semibold text-rose-600">
          Plus que {remainingStock} article(s) en stock
        </p>
      ) : null}

      {isCombo ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {ageOptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Âge (pour le prix)
              </p>
              <div className="flex flex-wrap gap-2">
                {ageOptions.map((age) => {
                  const isActive = selectedAge === age;
                  const sizePrice = getProductPriceForSize(product, age);
                  return (
                    <button
                      key={`${product.id}-age-${age}`}
                      type="button"
                      onClick={() => setSelectedAge(age)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                          : "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                      }`}
                    >
                      {age}
                      <span className={`ml-1 ${isActive ? "text-violet-100" : "text-slate-500"}`}>
                        · {currency.format(sizePrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Taille T-shirt <span className="text-rose-500">*</span>
            </p>
            <p className="text-[11px] text-slate-500">Obligatoire — de 4 ans à XXL</p>
            <div className="flex flex-wrap gap-2">
              {TSHIRT_SIZE_OPTIONS.map((size) => {
                const isActive = selectedTshirtSize === size;
                return (
                  <button
                    key={`${product.id}-tshirt-${size}`}
                    type="button"
                    onClick={() => setSelectedTshirtSize(size)}
                    className={`min-w-12 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Taille short <span className="text-rose-500">*</span>
            </p>
            <p className="text-[11px] text-slate-500">Obligatoire — tailles 1 à 6</p>
            <div className="flex flex-wrap gap-2">
              {CLOTHING_SIZE_OPTIONS.map((size) => {
                const isActive = selectedShortSize === size;
                return (
                  <button
                    key={`${product.id}-short-${size}`}
                    type="button"
                    onClick={() => setSelectedShortSize(size)}
                    className={`min-w-12 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {!hasChosenComboSizes ? (
            <p className="text-xs font-medium text-amber-700">
              Sélectionnez une taille T-shirt et une taille short pour ajouter au panier.
            </p>
          ) : null}
        </div>
      ) : hasSizes ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {clothingSizesOnly ? "Choisir la taille" : "Choisir l'âge / la taille"}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes?.map((size) => {
              const isActive = selectedSize === size;
              const sizePrice = getProductPriceForSize(product, size);
              return (
                <button
                  key={`${product.id}-${size}`}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                  }`}
                >
                  {size.match(/^[1-6]$/) ? `Taille ${size}` : size}
                  <span className={`ml-1 ${isActive ? "text-violet-100" : "text-slate-500"}`}>
                    · {currency.format(sizePrice)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-300 bg-white">
          <button
            type="button"
            onClick={decreaseQuantity}
            className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            aria-label="Diminuer la quantite"
          >
            -
          </button>
          <span className="min-w-10 px-2 text-center text-sm font-semibold text-slate-800">
            {quantity}
          </span>
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
          disabled={!canAdd}
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
    </div>
  );
}
