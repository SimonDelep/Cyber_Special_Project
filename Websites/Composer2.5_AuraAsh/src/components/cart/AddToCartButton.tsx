"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";
import type { ProductItem } from "@/types";

interface AddToCartButtonProps {
  product: ProductItem;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return (
      <Button variant="secondary" disabled className="mt-8">
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      className="mt-8"
      onClick={() => {
        addItem(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? "Added to cart" : "Add to cart"}
    </Button>
  );
}
