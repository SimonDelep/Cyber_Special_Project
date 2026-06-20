"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/providers/CartProvider";
import type { CartItemInput } from "@/types/cart";

type AddToCartButtonProps = {
  product: CartItemInput;
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, hydrated } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  if (!hydrated) {
    return (
      <Button type="button" variant="secondary" className="mt-4 w-full" disabled>
        Add to cart
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="mt-4 w-full"
      onClick={handleClick}
    >
      {added ? "Added to cart" : "Add to cart"}
    </Button>
  );
}
