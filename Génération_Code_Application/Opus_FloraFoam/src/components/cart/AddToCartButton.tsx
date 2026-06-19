"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addToCartAction, type CartActionState } from "@/app/cart/actions";

type AddToCartButtonProps = {
  productId: string;
  productName: string;
  inStock: boolean;
  isLoggedIn: boolean;
};

const initialState: CartActionState = {};

export function AddToCartButton({
  productId,
  productName,
  inStock,
  isLoggedIn,
}: AddToCartButtonProps) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-4 w-full rounded-full border border-sage-200 py-2.5 text-sm font-medium text-sage-400"
      >
        Out of stock
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent("/#products")}`}
        className="mt-4 block w-full rounded-full border border-sage-300 py-2.5 text-center text-sm font-medium text-sage-800 transition-colors hover:border-sage-500 hover:bg-sage-50"
      >
        Sign in to add to cart
      </Link>
    );
  }

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      {state.error && (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && state.message && (
        <p className="mb-2 text-xs text-sage-700" role="status">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-700 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-sage-900 disabled:opacity-60"
        aria-label={`Add ${productName} to cart`}
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
    </form>
  );
}
