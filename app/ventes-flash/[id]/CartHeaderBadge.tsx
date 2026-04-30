"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "proconfection_cart";

type CartItem = { quantity: number };

export default function CartHeaderBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const readCount = () => {
      try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
        const nextCount = Array.isArray(items)
          ? items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
          : 0;
        setCount(nextCount);
      } catch {
        setCount(0);
      }
    };

    readCount();
    window.addEventListener("proconfection-cart-updated", readCount);
    window.addEventListener("storage", readCount);
    return () => {
      window.removeEventListener("proconfection-cart-updated", readCount);
      window.removeEventListener("storage", readCount);
    };
  }, []);

  return (
    <Link
      href="/"
      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
    >
      Panier: {count}
    </Link>
  );
}
