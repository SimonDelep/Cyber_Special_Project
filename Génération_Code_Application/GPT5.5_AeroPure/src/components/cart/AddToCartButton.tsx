"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AddToCartButtonProps = {
  productId: string;
  inStock: boolean;
  compact?: boolean;
};

export function AddToCartButton({
  productId,
  inStock,
  compact = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setMessage("Server error — try refreshing the page");
        return;
      }

      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?redirect=/cart");
        return;
      }

      if (!res.ok) {
        setMessage(data.error ?? "Could not add to cart");
        return;
      }

      setMessage("Added!");
      router.refresh();
    } catch {
      setMessage("Network error — is the dev server running?");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  if (!inStock) {
    return (
      <span className="text-xs font-medium text-muted">Out of stock</span>
    );
  }

  return (
    <div className={compact ? "" : "mt-4"}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className={
          compact
            ? "rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            : "w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
        }
      >
        {loading ? "Adding…" : "Add to cart"}
      </button>
      {message && (
        <p className="mt-1 text-center text-xs text-accent">{message}</p>
      )}
    </div>
  );
}
