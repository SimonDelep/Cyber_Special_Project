"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  checkoutAction,
  removeCartItemAction,
  updateCartItemAction,
  type CartActionState,
} from "@/app/cart/actions";
import { FormMessage } from "@/components/ui/FormField";
import { CATEGORY_LABELS, formatPrice } from "@/types/product";
import type { ProductCategory } from "@prisma/client";

export type CartLineItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    category: ProductCategory;
    priceCents: number;
    imageUrl: string | null;
    inStock: boolean;
  };
};

type CartCheckoutProps = {
  items: CartLineItem[];
  balanceCents: number;
  totalCents: number;
};

const itemActionInitial: CartActionState = {};
const checkoutInitial: CartActionState = {};

export function CartCheckout({ items, balanceCents, totalCents }: CartCheckoutProps) {
  const [checkoutState, checkoutFormAction, checkoutPending] = useActionState(
    checkoutAction,
    checkoutInitial,
  );
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  useEffect(() => {
    if (checkoutState.success) {
      setCheckoutComplete(true);
    }
  }, [checkoutState.success]);

  if (checkoutComplete && checkoutState.success) {
    const invoiceHref = checkoutState.orderId
      ? `/api/invoices/${checkoutState.orderId}`
      : null;

    return (
      <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-10 text-center">
        <p className="font-display text-2xl font-semibold text-sage-900">Thank you!</p>
        <p className="mt-3 text-sage-600">{checkoutState.message}</p>
        {checkoutState.invoiceNumber && (
          <p className="mt-2 text-sm text-sage-500">
            Invoice {checkoutState.invoiceNumber}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {invoiceHref && (
            <a
              href={invoiceHref}
              download
              className="rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900"
            >
              Download invoice (PDF)
            </a>
          )}
          <Link
            href="/#products"
            className="rounded-full border border-sage-300 px-6 py-2.5 text-sm font-medium text-sage-800 hover:bg-sage-50"
          >
            Continue shopping
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-sage-300 px-6 py-2.5 text-sm font-medium text-sage-800 hover:bg-sage-50"
          >
            View profile
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-10 text-center">
        <p className="font-display text-xl font-semibold text-sage-900">Your cart is empty</p>
        <p className="mt-2 text-sage-600">Browse our collection and add your favourites.</p>
        <Link
          href="/#products"
          className="mt-6 inline-block rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900"
        >
          Shop products
        </Link>
      </div>
    );
  }

  const canAfford = balanceCents >= totalCents;

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <ul className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <CartLine key={item.id} item={item} />
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
        <h2 className="font-display text-lg font-semibold text-sage-900">Order summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between text-sage-600">
            <dt>Subtotal</dt>
            <dd className="font-medium text-sage-900">{formatPrice(totalCents)}</dd>
          </div>
          <div className="flex justify-between text-sage-600">
            <dt>Account balance</dt>
            <dd className="font-medium text-sage-900">{formatPrice(balanceCents)}</dd>
          </div>
          {!canAfford && (
            <div className="flex justify-between text-red-700">
              <dt>Amount needed</dt>
              <dd className="font-medium">{formatPrice(totalCents - balanceCents)}</dd>
            </div>
          )}
        </dl>

        <form action={checkoutFormAction} className="mt-6">
          {checkoutState.error && (
            <div className="mb-4">
              <FormMessage type="error" message={checkoutState.error} />
            </div>
          )}
          <button
            type="submit"
            disabled={checkoutPending || !canAfford}
            className="w-full rounded-full bg-sage-700 py-3 text-sm font-medium text-cream-50 hover:bg-sage-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkoutPending ? "Processing…" : "Complete purchase (simulation)"}
          </button>
          {!canAfford && (
            <p className="mt-3 text-xs text-sage-600">
              Top up your balance via an administrator or ask support to add funds to your
              account.
            </p>
          )}
        </form>

        <p className="mt-4 text-xs text-sage-500">
          This is a simulated checkout. Your account balance will be charged immediately—no
          card payment.
        </p>
      </aside>
    </div>
  );
}

function CartLine({ item }: { item: CartLineItem }) {
  const lineTotal = item.product.priceCents * item.quantity;

  return (
    <li className="flex gap-4 rounded-2xl border border-sage-200/80 bg-cream-50 p-4">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-sage-100">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-sage-500">
          {CATEGORY_LABELS[item.product.category]}
        </p>
        <h3 className="font-display text-lg font-semibold text-sage-900">{item.product.name}</h3>
        <p className="text-sm text-sage-600">{formatPrice(item.product.priceCents)} each</p>
        {!item.product.inStock && (
          <p className="mt-1 text-xs text-red-600">Out of stock — remove before checkout</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <UpdateQuantityForm cartItemId={item.id} quantity={item.quantity} />
          <RemoveItemButton cartItemId={item.id} />
        </div>
      </div>
      <p className="shrink-0 font-medium text-sage-900">{formatPrice(lineTotal)}</p>
    </li>
  );
}

function UpdateQuantityForm({
  cartItemId,
  quantity,
}: {
  cartItemId: string;
  quantity: number;
}) {
  const [state, formAction, pending] = useActionState(updateCartItemAction, itemActionInitial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="cartItemId" value={cartItemId} />
      <label htmlFor={`qty-${cartItemId}`} className="sr-only">
        Quantity
      </label>
      <select
        id={`qty-${cartItemId}`}
        name="quantity"
        defaultValue={quantity}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-sage-300 bg-white px-2 py-1 text-sm text-sage-900"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

function RemoveItemButton({ cartItemId }: { cartItemId: string }) {
  const [state, formAction, pending] = useActionState(removeCartItemAction, itemActionInitial);

  return (
    <form action={formAction}>
      <input type="hidden" name="cartItemId" value={cartItemId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-sage-600 underline hover:text-sage-900 disabled:opacity-50"
      >
        Remove
      </button>
      {state.error && <span className="ml-2 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
