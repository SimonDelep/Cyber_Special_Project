import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import {
  CART_UPDATE_EVENT,
  clearCart,
  getCartLines,
  getCartSubtotalCents,
  removeFromCart,
  setCartQty,
  type CartItem,
} from "@/stores/cart";

type Props = {
  signedIn: boolean;
  balanceCents: number | null;
  checkoutSuccess: string | null;
  lastOrderId: number | null;
  invoiceNumber: string | null;
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default function CartPage(props: Props) {
  const [items, setItems] = createSignal<CartItem[]>([]);
  const [linesJson, setLinesJson] = createSignal("[]");

  const refresh = () => {
    const lines = getCartLines();
    setItems(lines);
    setLinesJson(
      JSON.stringify(lines.map((item) => ({ productId: item.id, qty: item.qty }))),
    );
  };

  onMount(() => {
    refresh();
    if (props.checkoutSuccess) {
      clearCart();
      refresh();
    }
    window.addEventListener(CART_UPDATE_EVENT, refresh);
    onCleanup(() => window.removeEventListener(CART_UPDATE_EVENT, refresh));
  });

  const subtotal = () => getCartSubtotalCents();

  const canCheckout = () =>
    props.signedIn && items().length > 0 && subtotal() > 0;

  const hasEnoughBalance = () =>
    props.balanceCents !== null && props.balanceCents >= subtotal();

  return (
    <div class="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <Show
          when={items().length > 0}
          fallback={
            <p class="rounded-xl border border-dashed border-border p-10 text-center text-ink-muted">
              Your cart is empty.{" "}
              <a href="/#products" class="font-medium text-accent hover:underline">
                Browse products
              </a>
            </p>
          }
        >
          <ul class="divide-y divide-border rounded-xl border border-border bg-surface-raised">
            <For each={items()}>
              {(item) => (
                <li class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="font-semibold">{item.name}</p>
                    <p class="mt-1 text-sm text-ink-muted">
                      {formatPrice(item.priceCents)} each
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-4">
                    <label class="flex items-center gap-2 text-sm">
                      <span class="text-ink-muted">Qty</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.qty}
                        class="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-center"
                        onChange={(e) =>
                          setCartQty(item.id, Number(e.currentTarget.value))
                        }
                      />
                    </label>
                    <p class="min-w-[5rem] text-right font-semibold">
                      {formatPrice(item.priceCents * item.qty)}
                    </p>
                    <button
                      type="button"
                      class="text-sm text-ink-muted transition hover:text-red-300"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      <aside class="h-fit rounded-xl border border-border bg-surface-raised p-6">
        <h2 class="text-lg font-semibold">Order summary</h2>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-muted">Subtotal</dt>
            <dd class="font-mono font-medium">{formatPrice(subtotal())}</dd>
          </div>
          {props.signedIn && props.balanceCents !== null && (
            <div class="flex justify-between border-t border-border pt-2">
              <dt class="text-ink-muted">Your balance</dt>
              <dd class="font-mono font-medium">{formatPrice(props.balanceCents)}</dd>
            </div>
          )}
        </dl>

        <Show when={!props.signedIn}>
          <p class="mt-6 text-sm text-ink-muted">
            <a href="/login?redirect=/cart" class="font-medium text-accent hover:underline">
              Sign in
            </a>{" "}
            to pay with store credit.
          </p>
        </Show>

        <Show when={props.signedIn && subtotal() > 0 && !hasEnoughBalance()}>
          <p class="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Insufficient credit for this order. Ask an admin to top up your balance, or remove
            items.
          </p>
        </Show>

        <form method="post" action="/api/checkout" class="mt-6">
          <input type="hidden" name="lines" value={linesJson()} />
          <button
            type="submit"
            disabled={!canCheckout()}
            class="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-surface transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete checkout
          </button>
        </form>

        <Show when={items().length > 0}>
          <button
            type="button"
            class="mt-3 w-full text-sm text-ink-muted transition hover:text-ink"
            onClick={() => {
              clearCart();
              refresh();
            }}
          >
            Clear cart
          </button>
        </Show>

        <Show when={props.checkoutSuccess && props.lastOrderId && props.signedIn}>
          <div class="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p class="text-sm font-medium text-emerald-100">Purchase complete</p>
            <p class="mt-1 text-xs text-emerald-200/90">
              {props.invoiceNumber
                ? `Invoice ${props.invoiceNumber}`
                : `Order #${props.lastOrderId}`}
            </p>
            <a
              href={`/api/invoices/${props.lastOrderId}`}
              class="mt-3 inline-flex w-full justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface transition hover:bg-accent-dim"
              download={
                props.invoiceNumber
                  ? `invoice-${props.invoiceNumber}.pdf`
                  : undefined
              }
            >
              Download invoice (PDF)
            </a>
          </div>
        </Show>

        <p class="mt-4 text-xs text-ink-muted">
          Simulated checkout: your store credit is debited and stock is updated.
        </p>
      </aside>
    </div>
  );
}
