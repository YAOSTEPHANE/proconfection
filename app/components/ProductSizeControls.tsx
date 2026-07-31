"use client";

import { useMemo, useState } from "react";
import {
  CLOTHING_SIZE_OPTIONS,
  TSHIRT_SIZE_OPTIONS,
  encodeComboSelection,
  getProductPriceForSize,
  needsComboSizeSelection,
  type Product,
} from "@/lib/catalog";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

function getAgeOptions(product: Product): string[] {
  return (product.sizes ?? []).filter(
    (size) => !/^[1-6]$/.test(size.trim()) && !/^(S|M|L|XL|XXL)$/i.test(size.trim()),
  );
}

type ProductSizeControlsProps = {
  product: Product;
  onAddToCart: (selectedSize?: string) => void;
  added?: boolean;
  selectClassName?: string;
  buttonClassName?: string;
};

export default function ProductSizeControls({
  product,
  onAddToCart,
  added = false,
  selectClassName = "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100",
  buttonClassName,
}: ProductSizeControlsProps) {
  const isCombo = needsComboSizeSelection(product);
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const ageOptions = useMemo(() => getAgeOptions(product), [product]);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedAge, setSelectedAge] = useState(() => ageOptions[0] ?? "");
  const [selectedTshirtSize, setSelectedTshirtSize] = useState("");
  const [selectedShortSize, setSelectedShortSize] = useState("");

  const pricingKey = isCombo
    ? selectedAge || ageOptions[0] || undefined
    : selectedSize || undefined;

  const currentPrice = getProductPriceForSize(product, pricingKey);

  const canAddCombo =
    selectedTshirtSize.trim().length > 0 && selectedShortSize.trim().length > 0;

  const cartLabel = isCombo
    ? canAddCombo
      ? encodeComboSelection({
          age: (selectedAge || ageOptions[0] || "Taille").trim(),
          tshirtSize: selectedTshirtSize.trim(),
          shortSize: selectedShortSize.trim(),
        })
      : undefined
    : selectedSize.trim() || undefined;

  const canAdd = isCombo
    ? canAddCombo
    : !hasSizes || selectedSize.trim().length > 0;

  const defaultButtonClass = `cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
    added ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-violet-700"
  }`;

  function handleAdd() {
    if (!canAdd) {
      return;
    }
    onAddToCart(cartLabel);
  }

  if (isCombo) {
    return (
      <div className="space-y-2">
        {ageOptions.length > 0 ? (
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Âge
            </span>
            <select
              value={selectedAge}
              onChange={(event) => setSelectedAge(event.target.value)}
              aria-label={`Choisir l'âge pour ${product.name}`}
              className={selectClassName}
            >
              {ageOptions.map((age) => (
                <option key={`${product.id}-age-${age}`} value={age}>
                  {age} — {currency.format(getProductPriceForSize(product, age))}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Taille T-shirt *
          </span>
          <select
            value={selectedTshirtSize}
            onChange={(event) => setSelectedTshirtSize(event.target.value)}
            aria-label={`Choisir la taille T-shirt pour ${product.name}`}
            className={selectClassName}
          >
            <option value="">Choisir (4 ans–XXL)</option>
            {TSHIRT_SIZE_OPTIONS.map((size) => (
              <option key={`${product.id}-tshirt-${size}`} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Taille short *
          </span>
          <select
            value={selectedShortSize}
            onChange={(event) => setSelectedShortSize(event.target.value)}
            aria-label={`Choisir la taille short pour ${product.name}`}
            className={selectClassName}
          >
            <option value="">Choisir (1–6)</option>
            {CLOTHING_SIZE_OPTIONS.map((size) => (
              <option key={`${product.id}-short-${size}`} value={size}>
                Taille {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          <strong className="text-sm text-violet-700">{currency.format(currentPrice)}</strong>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className={buttonClassName ?? defaultButtonClass}
          >
            {added ? "Ajouté" : "Ajouter"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasSizes ? (
        <select
          value={selectedSize}
          onChange={(event) => setSelectedSize(event.target.value)}
          aria-label={`Choisir une taille pour ${product.name}`}
          className={selectClassName}
        >
          <option value="">Choisir la taille</option>
          {product.sizes?.map((size) => (
            <option key={`${product.id}-size-${size}`} value={size}>
              {size} — {currency.format(getProductPriceForSize(product, size))}
            </option>
          ))}
        </select>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-violet-700">{currency.format(currentPrice)}</strong>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={buttonClassName ?? defaultButtonClass}
        >
          {added ? "Ajouté" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}
