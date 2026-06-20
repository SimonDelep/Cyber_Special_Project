"use client";

import Link from "next/link";

import { useCart } from "@/components/providers/CartProvider";

export function CartNavLink() {
  const { itemCount, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      className="relative text-sm text-espresso/80 transition-colors hover:text-espresso"
    >
      Cart
      {hydrated && itemCount > 0 && (
        <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-espresso px-1 text-[10px] font-semibold text-cream">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
