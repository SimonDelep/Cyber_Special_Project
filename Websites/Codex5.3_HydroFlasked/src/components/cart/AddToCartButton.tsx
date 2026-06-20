"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
};

export function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(productId);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="mt-4 w-full rounded-full border border-brand-500/50 bg-brand-500/10 py-2 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {disabled ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
