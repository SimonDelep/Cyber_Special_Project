import { Show, createSignal, onCleanup, onMount } from 'solid-js';
import {
  clearCart,
  getProductIds,
  removeFromCart,
  subscribe,
  type CartItem,
} from '@/lib/cart';

interface Props {
  isLoggedIn: boolean;
  initialBalance: number | null;
}

export default function CartPage(props: Props) {
  const [items, setItems] = createSignal<CartItem[]>([]);
  const [total, setTotal] = createSignal(0);
  const [balance, setBalance] = createSignal(props.initialBalance);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [orderDetails, setOrderDetails] = createSignal<{
    total: number;
    newBalance: number;
    orderId: string;
    invoiceNumber: string;
  } | null>(null);

  onMount(() => {
    const unsubscribe = subscribe((snap) => {
      setItems(snap.items);
      setTotal(snap.total);
    });
    onCleanup(unsubscribe);
  });

  const canCheckout = () =>
    props.isLoggedIn && items().length > 0 && balance() !== null;

  const hasEnoughBalance = () => {
    const b = balance();
    return b !== null && b >= total();
  };

  const handleCheckout = async () => {
    if (!props.isLoggedIn) return;
    setError(null);
    setSuccess(null);
    setOrderDetails(null);
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: getProductIds() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Checkout failed.');
        return;
      }

      setBalance(json.newBalance);
      setSuccess(json.message);
      setOrderDetails({
        total: json.total,
        newBalance: json.newBalance,
        orderId: json.orderId,
        invoiceNumber: json.invoiceNumber,
      });
      clearCart();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-8">
      <Show when={success()}>
        <div
          class="rounded-2xl border border-stream-500/30 bg-stream-500/10 p-6"
          role="status"
        >
          <p class="font-semibold text-stream-300">{success()}</p>
          <Show when={orderDetails()}>
            {(order) => (
              <>
                <p class="mt-2 text-sm text-slate-400">
                  Charged ${order().total.toFixed(2)} · New balance:{' '}
                  <span class="font-mono text-white">
                    ${order().newBalance.toFixed(2)}
                  </span>
                </p>
                <p class="mt-1 font-mono text-xs text-slate-500">
                  Invoice {order().invoiceNumber}
                </p>
                <a
                  href={`/api/invoices/${order().orderId}`}
                  download={`VoltStream-Invoice-${order().invoiceNumber}.pdf`}
                  class="mt-4 inline-flex items-center gap-2 rounded-full bg-volt-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-volt-500 transition-colors"
                >
                  Download invoice (PDF)
                </a>
              </>
            )}
          </Show>
          <a
            href="/"
            class="mt-4 inline-flex text-sm font-medium text-volt-400 hover:text-volt-300"
          >
            Continue shopping →
          </a>
        </div>
      </Show>

      <Show when={error()}>
        <p
          class="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error()}
        </p>
      </Show>

      <Show
        when={items().length > 0}
        fallback={
          <div class="rounded-2xl border border-white/10 bg-slate-900/50 p-10 text-center">
            <p class="text-lg font-medium text-white">Your cart is empty</p>
            <p class="mt-2 text-sm text-slate-400">
              Browse our catalog and add products to get started.
            </p>
            <a
              href="/#products"
              class="mt-6 inline-flex rounded-full bg-volt-600 px-6 py-3 text-sm font-semibold text-white hover:bg-volt-500"
            >
              View products
            </a>
          </div>
        }
      >
        <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
          <ul class="divide-y divide-white/5">
            {items().map((item) => (
              <li class="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p class="font-medium text-white">{item.name}</p>
                  <p class="mt-1 font-mono text-sm text-slate-400">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div class="flex items-center gap-4">
                  <p class="font-mono text-lg font-semibold text-white">
                    ${item.price.toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    class="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside class="rounded-2xl border border-volt-500/20 bg-gradient-to-br from-volt-950/50 to-slate-900/80 p-6">
          <h2 class="text-lg font-semibold text-white">Order summary</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div class="flex justify-between text-slate-400">
              <dt>Items</dt>
              <dd>{items().length}</dd>
            </div>
            <div class="flex justify-between text-slate-400">
              <dt>Subtotal</dt>
              <dd class="font-mono text-white">${total().toFixed(2)}</dd>
            </div>
            <Show when={props.isLoggedIn && balance() !== null}>
              <div class="flex justify-between border-t border-white/10 pt-3">
                <dt class="text-slate-400">Account balance</dt>
                <dd class="font-mono font-medium text-stream-400">
                  ${balance()!.toFixed(2)}
                </dd>
              </div>
            </Show>
            <div class="flex justify-between border-t border-white/10 pt-3 text-base">
              <dt class="font-semibold text-white">Total due</dt>
              <dd class="font-mono text-xl font-bold text-white">
                ${total().toFixed(2)}
              </dd>
            </div>
          </dl>

          <Show when={!props.isLoggedIn}>
            <p class="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
              <a href="/login?redirect=/cart" class="font-medium text-amber-100 underline">
                Sign in
              </a>{' '}
              to complete checkout. Payment is deducted from your account balance.
            </p>
          </Show>

          <Show when={props.isLoggedIn && balance() !== null && !hasEnoughBalance()}>
            <p class="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              Insufficient balance. You need ${total().toFixed(2)} but have $
              {balance()!.toFixed(2)}.
            </p>
          </Show>

          <button
            type="button"
            disabled={!canCheckout() || loading() || !hasEnoughBalance()}
            onClick={handleCheckout}
            class="mt-6 w-full rounded-full bg-volt-600 py-3 text-sm font-semibold text-white hover:bg-volt-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading()
              ? 'Processing…'
              : `Complete checkout — $${total().toFixed(2)}`}
          </button>
          <p class="mt-3 text-center text-xs text-slate-500">
            Simulated checkout · balance updated on success
          </p>
        </aside>
      </Show>
    </div>
  );
}
