"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { getShippingFeeByCommune, SHIPPING_COMMUNES } from "@/lib/shipping";

type CartItem = Product & { quantity: number; selectedSize?: string };
type PaymentMethod = "card" | "cash_on_delivery";

const CART_STORAGE_KEY = "proconfection_cart";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export default function PanierPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) {
        return [];
      }
      const parsed = JSON.parse(savedCart) as CartItem[];
      return Array.isArray(parsed) ? parsed.filter((item) => item.quantity > 0) : [];
    } catch {
      return [];
    }
  });
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCommune, setCustomerCommune] = useState("");
  const [customerLandmark, setCustomerLandmark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutDone, setCheckoutDone] = useState<string | null>(null);

  useEffect(() => {
    function syncCartFromStorage() {
      try {
        const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!savedCart) {
          setCart([]);
          return;
        }
        const parsed = JSON.parse(savedCart) as CartItem[];
        setCart(Array.isArray(parsed) ? parsed.filter((item) => item.quantity > 0) : []);
      } catch {
        setCart([]);
      }
    }

    window.addEventListener("storage", syncCartFromStorage);
    window.addEventListener("proconfection-cart-updated", syncCartFromStorage);
    return () => {
      window.removeEventListener("storage", syncCartFromStorage);
      window.removeEventListener("proconfection-cart-updated", syncCartFromStorage);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const shippingFee = useMemo(
    () => (customerCommune.trim().length >= 2 ? getShippingFeeByCommune(customerCommune) : 0),
    [customerCommune],
  );
  const total = useMemo(() => subtotal + shippingFee, [shippingFee, subtotal]);

  function changeQuantity(id: string, selectedSize: string | undefined, delta: number) {
    setCheckoutDone(null);
    setError(null);
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id && (item.selectedSize ?? "") === (selectedSize ?? "")
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(id: string, selectedSize: string | undefined) {
    setCheckoutDone(null);
    setError(null);
    setCart((previous) =>
      previous.filter(
        (item) => !(item.id === id && (item.selectedSize ?? "") === (selectedSize ?? "")),
      ),
    );
  }

  async function checkout() {
    if (cart.length === 0) {
      return;
    }
    setError(null);
    setLoadingCheckout(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          customerCommune,
          customerLandmark,
          paymentMethod,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        orderId?: string;
        checkoutUrl?: string | null;
        error?: string;
      };

      if (!response.ok || !data.success || !data.orderId || !data.checkoutUrl) {
        setError(data.error ?? "Impossible de finaliser la commande.");
        return;
      }

      setCheckoutDone(data.orderId);
      setCart([]);
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Erreur reseau lors du checkout.");
    } finally {
      setLoadingCheckout(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Votre panier</h1>
        <Link
          href="/"
          prefetch={false}
          className="rounded-full border border-slate-300 px-4 py-1 text-sm"
        >
          Continuer mes achats
        </Link>
      </header>

      {cart.length === 0 ? (
        <section className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
          Votre panier est vide.
        </section>
      ) : (
        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <article
                key={`${item.id}-${item.selectedSize ?? "taille-unique"}`}
                className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={120}
                  height={80}
                  className="h-36 w-full rounded object-cover sm:h-20 sm:w-28"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase text-slate-500">{item.category}</p>
                  <h2 className="truncate text-base font-semibold">{item.name}</h2>
                  {item.selectedSize ? (
                    <p className="text-xs text-slate-500">Taille: {item.selectedSize}</p>
                  ) : null}
                  <p className="text-sm text-slate-600">{currency.format(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => changeQuantity(item.id, item.selectedSize, -1)}
                    className="h-8 w-8 rounded bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => changeQuantity(item.id, item.selectedSize, 1)}
                    className="h-8 w-8 rounded bg-slate-100"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id, item.selectedSize)}
                    aria-label="Supprimer cet article"
                    className="rounded bg-rose-100 px-2 py-1 text-rose-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
                <p className="w-full text-left font-semibold sm:w-24 sm:text-right">
                  {currency.format(item.price * item.quantity)}
                </p>
              </article>
            ))}
          </div>

          <aside className="rounded-xl bg-white p-4 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Sous-total</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-slate-600">
              <span>Livraison</span>
              <span>{currency.format(shippingFee)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Nom complet"
              className="mt-3 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="Email"
              className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Numero de telephone"
              className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={customerCommune}
              onChange={(event) => setCustomerCommune(event.target.value)}
              aria-label="Choisir une commune"
              className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Choisir une commune</option>
              {SHIPPING_COMMUNES.map((commune) => (
                <option key={`commune-${commune.value}`} value={commune.value}>
                  {commune.label} - {currency.format(commune.fee)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={customerLandmark}
              onChange={(event) => setCustomerLandmark(event.target.value)}
              placeholder="Repere de livraison"
              className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <fieldset className="mt-3 rounded border border-slate-200 p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Paiement
              </legend>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                Carte bancaire (Stripe)
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === "cash_on_delivery"}
                  onChange={() => setPaymentMethod("cash_on_delivery")}
                />
                Paiement a la livraison
              </label>
            </fieldset>
            <button
              onClick={checkout}
              className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
              disabled={
                cart.length === 0 ||
                loadingCheckout ||
                customerName.trim().length < 2 ||
                customerEmail.trim().length < 5 ||
                customerPhone.trim().length < 5 ||
                customerCommune.trim().length < 2 ||
                customerLandmark.trim().length < 3
              }
            >
              {loadingCheckout ? "Traitement..." : "Passer la commande"}
            </button>
            {checkoutDone ? (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-sm font-medium">
                  Felicitations, commande validee ({checkoutDone}).
                </p>
              </div>
            ) : null}
            {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
          </aside>
        </section>
      )}
    </main>
  );
}
