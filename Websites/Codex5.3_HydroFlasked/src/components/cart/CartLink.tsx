"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-full border border-white/20 px-4 py-1.5 text-sm text-slate-200 transition hover:border-brand-400 hover:text-white"
    >
      Cart
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
