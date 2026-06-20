"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type AddToCartButtonProps = {
  productId: string;
  inStock: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  inStock,
  className = "",
}: AddToCartButtonProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!inStock) {
    return (
      <span className={`text-sm text-sand-500 ${className}`}>Out of stock</span>
    );
  }

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login?callbackUrl=%2F%23shop"
        className={`text-sm font-medium text-sage-700 hover:text-sage-900 ${className}`}
      >
        Sign in to add to cart
      </Link>
    );
  }

  async function handleAdd() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not add to cart");
      return;
    }

    setMessage("Added to cart");
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        className="w-full text-sm"
        disabled={loading}
        onClick={() => void handleAdd()}
      >
        {loading ? "Adding…" : "Add to cart"}
      </Button>
      {message ? (
        <p className="mt-2 text-center text-xs text-sage-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-xs text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
