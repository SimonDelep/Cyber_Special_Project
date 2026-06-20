"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export function CartLink() {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!session?.user) {
      setCount(0);
      return;
    }

    const res = await fetch("/api/cart");
    if (!res.ok) return;

    const data = await res.json();
    setCount(data.cart?.itemCount ?? 0);
  }, [session?.user]);

  useEffect(() => {
    void fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const handler = () => void fetchCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [fetchCount]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="relative text-sm text-sand-700 hover:text-sand-900"
    >
      Cart
      {count > 0 ? (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sand-900 px-1.5 text-xs font-medium text-cream-50">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
