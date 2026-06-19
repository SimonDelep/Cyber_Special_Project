import { createSignal, Show, For } from 'solid-js';
import { useStore } from '@nanostores/solid';
import {
  cartLines,
  cartTotalCents,
  clearCart,
  removeFromCart,
  setCartQuantity,
} from '@/stores/cart';
import { formatPrice } from '@/lib/utils';
import type { PublicUser } from '@/types/auth';

type Props = {
  user: PublicUser | null;
  loginNext: string;
};

const btnPrimary =
  'rounded-full bg-cork-800 px-6 py-3 text-sm font-medium text-cork-50 hover:bg-cork-700 disabled:opacity-60';
const btnSecondary =
  'rounded-full border border-cork-400 px-4 py-2 text-sm font-medium text-cork-800 hover:bg-cork-100';

export default function CartPage(props: Props) {
  const lines = useStore(cartLines);
  const total = useStore(cartTotalCents);
  const [balanceCents, setBalanceCents] = createSignal(
    props.user?.balanceCents ?? 0,
  );
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');
  const [completedOrder, setCompletedOrder] = createSignal<{
    id: number;
    invoiceNumber: string;
  } | null>(null);

  async function handleCheckout() {
    setError('');
    setSuccess('');
    setCompletedOrder(null);

    if (!props.user) {
      window.location.href = `/login?next=${encodeURIComponent(props.loginNext)}`;
      return;
    }

    if (lines().length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          items: lines().map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Checkout failed.');
        if (typeof data.balanceCents === 'number') {
          setBalanceCents(data.balanceCents);
        }
        return;
      }

      setSuccess(data.message ?? 'Order complete!');
      setBalanceCents(data.newBalanceCents);
      if (data.order?.id) {
        setCompletedOrder({
          id: data.order.id,
          invoiceNumber: data.order.invoiceNumber ?? `order-${data.order.id}`,
        });
      }
      clearCart();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canAfford = () =>
    props.user !== null && balanceCents() >= total();
  const shortfall = () => Math.max(0, total() - balanceCents());

  return (
    <div class="space-y-8">
      <Show when={success()}>
        <div
          class="rounded-lg border border-sage-500/30 bg-sage-400/10 px-4 py-3 text-sm text-cork-800"
          role="status"
        >
          <p>{success()}</p>
          <Show when={completedOrder()}>
            {(order) => (
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <p class="text-cork-700">
                  Invoice <span class="font-mono font-medium">{order().invoiceNumber}</span>
                </p>
                <a
                  href={`/api/orders/${order().id}/invoice`}
                  class="inline-flex rounded-full bg-cork-800 px-4 py-2 text-sm font-medium text-cork-50 hover:bg-cork-700"
                  download
                >
                  Download invoice (PDF)
                </a>
              </div>
            )}
          </Show>
        </div>
      </Show>
      <Show when={error()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error()}
        </p>
      </Show>

      <Show
        when={lines().length > 0}
        fallback={
          <div class="rounded-2xl border border-dashed border-cork-300 bg-cork-50/50 px-6 py-16 text-center">
            <p class="text-cork-600">Your cart is empty.</p>
            <a href="/#collection" class="mt-4 inline-block text-sm font-medium text-cork-800 underline">
              Browse the collection
            </a>
          </div>
        }
      >
        <ul class="divide-y divide-cork-200 rounded-2xl border border-cork-200 bg-white">
          <For each={lines()}>
            {(line) => (
              <li class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="font-serif text-lg text-cork-900">{line.name}</h3>
                  <p class="text-sm text-cork-500">{formatPrice(line.priceCents)} each</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-2">
                    <label class="sr-only" for={`qty-${line.productId}`}>
                      Quantity
                    </label>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-cork-300 text-cork-700 hover:bg-cork-100"
                      onClick={() => setCartQuantity(line.productId, line.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      id={`qty-${line.productId}`}
                      type="number"
                      min={1}
                      class="w-14 rounded-lg border border-cork-300 px-2 py-1 text-center text-sm"
                      value={line.quantity}
                      onChange={(e) =>
                        setCartQuantity(line.productId, parseInt(e.currentTarget.value, 10) || 1)
                      }
                    />
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-cork-300 text-cork-700 hover:bg-cork-100"
                      onClick={() => setCartQuantity(line.productId, line.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p class="min-w-[5rem] text-right font-medium text-cork-900">
                    {formatPrice(line.priceCents * line.quantity)}
                  </p>
                  <button
                    type="button"
                    class="text-sm text-red-700 hover:underline"
                    onClick={() => removeFromCart(line.productId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>

        <aside class="rounded-2xl border border-cork-200 bg-cork-50/80 p-6">
          <h2 class="font-serif text-xl text-cork-900">Order summary</h2>
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between text-cork-700">
              <dt>Subtotal</dt>
              <dd class="font-medium text-cork-900">{formatPrice(total())}</dd>
            </div>
            <Show when={props.user}>
              <div class="flex justify-between text-cork-700">
                <dt>Your balance</dt>
                <dd class="font-medium text-cork-900">{formatPrice(balanceCents())}</dd>
              </div>
              <Show when={!canAfford() && total() > 0}>
                <div class="flex justify-between text-red-700">
                  <dt>Amount needed</dt>
                  <dd class="font-medium">{formatPrice(shortfall())}</dd>
                </div>
              </Show>
            </Show>
          </dl>

          <Show when={!props.user}>
            <p class="mt-4 text-sm text-cork-600">
              <a href={`/login?next=${encodeURIComponent(props.loginNext)}`} class="font-medium text-cork-800 underline">
                Sign in
              </a>{' '}
              to pay with your account balance.
            </p>
          </Show>

          <Show when={props.user && !canAfford() && total() > 0}>
            <p class="mt-4 text-sm text-red-800">
              Insufficient balance. Add funds via the admin panel or ask an administrator to adjust your account.
            </p>
          </Show>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class={btnPrimary}
              disabled={loading() || !props.user || total() === 0}
              onClick={handleCheckout}
            >
              {loading() ? 'Processing…' : 'Complete checkout'}
            </button>
            <a href="/#collection" class={btnSecondary}>
              Continue shopping
            </a>
          </div>
          <p class="mt-3 text-xs text-cork-500">
            Simulated checkout — your account balance is charged using current catalog prices.
          </p>
        </aside>
      </Show>
    </div>
  );
}
