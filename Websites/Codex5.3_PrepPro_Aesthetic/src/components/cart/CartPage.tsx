import { createSignal, onMount, For, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import {
  cartItems,
  cartTotalCents,
  clearCart,
  initCartFromStorage,
  removeFromCart,
  updateCartQuantity,
} from "@/stores/cart";
import { formatPrice } from "@/lib/format";
import type { PublicUser } from "@/lib/auth/types";

type Props = {
  user: PublicUser | null;
};

export default function CartPage(props: Props) {
  const items = useStore(cartItems);
  const totalCents = useStore(cartTotalCents);
  const [balanceCents, setBalanceCents] = createSignal(
    props.user?.balanceCents ?? null,
  );
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [lastOrderId, setLastOrderId] = createSignal<number | null>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = createSignal("");

  onMount(() => {
    initCartFromStorage();
    if (props.user) {
      refreshBalance();
    }
  });

  async function refreshBalance() {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.user?.balanceCents != null) {
        setBalanceCents(json.user.balanceCents);
      }
    } catch {
      /* keep SSR value */
    }
  }

  async function handleCheckout() {
    setError("");
    setSuccess("");
    setLastOrderId(null);
    setLastInvoiceNumber("");

    if (!props.user) {
      window.location.href = `/login?next=${encodeURIComponent("/cart")}`;
      return;
    }

    if (items().length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items().map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Checkout failed.");
        if (json.user?.balanceCents != null) {
          setBalanceCents(json.user.balanceCents);
        }
        return;
      }

      setSuccess(json.message ?? "Order placed successfully!");
      setBalanceCents(json.balanceCents ?? json.user?.balanceCents ?? null);
      if (json.order?.id) {
        setLastOrderId(json.order.id);
        setLastInvoiceNumber(json.order.invoiceNumber ?? "");
      }
      clearCart();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canAfford = () => {
    const bal = balanceCents();
    return bal !== null && bal >= totalCents();
  };

  return (
    <div class="mx-auto max-w-3xl">
      <h1 class="font-display text-3xl font-semibold text-ink">Shopping cart</h1>
      <p class="mt-2 text-muted">
        Review your items and complete a simulated checkout from your account
        balance.
      </p>

      <Show when={props.user && balanceCents() !== null}>
        <div class="mt-6 rounded-xl border border-brand-200 bg-brand-50/80 px-4 py-3">
          <p class="text-sm text-muted">Account balance</p>
          <p class="text-xl font-semibold text-brand-800">
            {formatPrice(balanceCents()!)}
          </p>
        </div>
      </Show>

      <Show when={!props.user}>
        <p class="mt-6 rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-muted">
          <a href="/login?next=%2Fcart" class="font-semibold text-brand-700 hover:underline">
            Sign in
          </a>{" "}
          to checkout using your account balance.
        </p>
      </Show>

      <Show when={lastOrderId()}>
        <div
          class="mt-10 rounded-2xl border border-brand-200 bg-brand-50 p-6 shadow-sm"
          role="status"
        >
          <h2 class="font-display text-xl font-semibold text-brand-800">
            Order confirmed
          </h2>
          <p class="mt-2 text-sm text-brand-900">{success()}</p>
          <p class="mt-2 text-sm text-muted">
            Invoice{" "}
            <span class="font-mono font-medium text-ink">{lastInvoiceNumber()}</span>
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <a
              href={`/api/invoices/${lastOrderId()}`}
              class="inline-flex rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              download
            >
              Download invoice (PDF)
            </a>
            <a
              href="/catalog"
              class="inline-flex rounded-full border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-white"
            >
              Continue shopping
            </a>
          </div>
        </div>
      </Show>

      <Show
        when={items().length > 0}
        fallback={
          <Show when={!lastOrderId()}>
            <div class="mt-10 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-10 text-center">
              <p class="text-muted">Your cart is empty.</p>
              <a
                href="/catalog"
                class="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Browse products
              </a>
            </div>
          </Show>
        }
      >
        <ul class="mt-8 divide-y divide-brand-100 rounded-2xl border border-brand-100 bg-white shadow-sm">
          <For each={items()}>
            {(item) => (
              <li class="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-ink">{item.name}</p>
                  <p class="text-sm text-muted">
                    {formatPrice(item.priceCents)} each
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center rounded-lg border border-brand-200">
                    <button
                      type="button"
                      class="px-3 py-1.5 text-brand-800 hover:bg-brand-50"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateCartQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span class="min-w-[2rem] text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      class="px-3 py-1.5 text-brand-800 hover:bg-brand-50"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateCartQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <span class="w-24 text-right font-semibold text-ink">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                  <button
                    type="button"
                    class="text-sm text-red-600 hover:underline"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>

        <div class="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between text-lg font-semibold text-ink">
            <span>Order total</span>
            <span>{formatPrice(totalCents())}</span>
          </div>

          <Show when={props.user && balanceCents() !== null && !canAfford()}>
            <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              Insufficient balance. You have {formatPrice(balanceCents()!)} but need{" "}
              {formatPrice(totalCents())}.
            </p>
          </Show>

          <Show when={error()}>
            <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error()}
            </p>
          </Show>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading() || (props.user !== null && !canAfford())}
              onClick={handleCheckout}
              class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading()
                ? "Processing…"
                : props.user
                  ? "Complete checkout"
                  : "Sign in to checkout"}
            </button>
            <a
              href="/#products"
              class="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Continue shopping
            </a>
          </div>
          <p class="mt-3 text-xs text-muted">
            Simulated checkout — no payment gateway. Your account balance will be
            debited when the order succeeds.
          </p>
        </div>
      </Show>
    </div>
  );
}
