import { createSignal, For, onMount, Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import {
  cartItems,
  cartTotalCents,
  clearCart,
  hydrateCart,
  removeFromCart,
  updateCartQuantity,
} from '../../stores/cart';
import { formatPrice } from '../../lib/format';

interface User {
  id: number;
  username: string;
  displayName: string;
  balanceCents: number;
}

interface Props {
  user: User | null;
}

export default function CartPage(props: Props) {
  if (typeof window !== 'undefined') {
    hydrateCart();
  }
  onMount(() => hydrateCart());

  const items = useStore(cartItems);
  const totalCents = useStore(cartTotalCents);
  const [balanceCents, setBalanceCents] = createSignal(props.user?.balanceCents ?? 0);
  const [message, setMessage] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [loading, setLoading] = createSignal(false);

  const canCheckout = () =>
    props.user != null && items().length > 0 && balanceCents() >= totalCents();

  async function handleCheckout() {
    if (!props.user) {
      window.location.href = `/login?redirect=${encodeURIComponent('/cart')}`;
      return;
    }

    if (items().length === 0) {
      setMessage({ type: 'err', text: 'Your cart is empty.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items().map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setMessage({
          type: 'err',
          text: json.error ?? 'Checkout failed. Please try again.',
        });
        setLoading(false);
        return;
      }

      if (json.order?.id) {
        clearCart();
        window.location.href = `/orders/${json.order.id}/confirmation`;
        return;
      }

      setBalanceCents(json.user.balanceCents);
      setMessage({
        type: 'err',
        text: 'Order placed but confirmation page is unavailable. Check Profile → Order history.',
      });
    } catch {
      setMessage({ type: 'err', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-16 rounded-lg border border-white/10 bg-nest-900 px-2 py-1 text-center text-sm text-white focus:border-accent/50 focus:outline-none';

  return (
    <div class="space-y-8">
      <div>
        <h1 class="font-display text-3xl font-bold text-white">Shopping cart</h1>
        <p class="mt-2 text-nest-100/60">Review items and complete your simulated checkout.</p>
      </div>

      <Show when={message()}>
        <div
          class:list={[
            'rounded-lg border px-4 py-3 text-sm',
            message()!.type === 'ok'
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-red-500/30 bg-red-500/10 text-red-300',
          ]}
          role="alert"
        >
          {message()!.text}
        </div>
      </Show>

      <Show
        when={props.user}
        fallback={
          <p class="rounded-xl border border-white/10 bg-nest-900/50 px-4 py-3 text-sm text-nest-100/70">
            <a href="/login?redirect=%2Fcart" class="font-medium text-accent hover:underline">
              Sign in
            </a>{' '}
            to see your account balance and complete checkout.
          </p>
        }
      >
        <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-nest-900/50 px-5 py-4">
          <p class="text-sm text-nest-100/70">
            Signed in as <span class="text-white">{props.user!.displayName}</span>
          </p>
          <p class="font-display text-lg font-semibold text-accent">
            Balance: {formatPrice(balanceCents())}
          </p>
        </div>
      </Show>

      <Show
        when={items().length > 0}
        fallback={
          <div class="rounded-2xl border border-dashed border-white/20 p-12 text-center">
            <p class="text-nest-100/60">Your cart is empty.</p>
            <a
              href="/catalog"
              class="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Browse products →
            </a>
            <p class="mt-4 text-sm text-nest-100/50">
              Past orders and invoices are in{' '}
              <a href="/profile" class="text-accent hover:underline">
                your profile
              </a>
              .
            </p>
          </div>
        }
      >
        <ul class="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
          <For each={items()}>
            {(item) => (
              <li class="flex flex-col gap-4 bg-nest-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="font-display font-semibold text-white">{item.name}</h2>
                  <p class="text-sm text-nest-100/60">{formatPrice(item.priceCents)} each</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                  <label class="flex items-center gap-2 text-sm text-nest-100/70">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={99}
                      class={inputClass}
                      value={item.quantity}
                      onInput={(e) =>
                        updateCartQuantity(
                          item.productId,
                          Math.max(1, Number.parseInt(e.currentTarget.value, 10) || 1),
                        )
                      }
                    />
                  </label>
                  <p class="min-w-[5rem] text-right font-medium text-white">
                    {formatPrice(item.priceCents * item.quantity)}
                  </p>
                  <button
                    type="button"
                    class="text-sm text-red-300 hover:underline"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>

        <div class="rounded-2xl border border-white/10 bg-nest-900/50 p-6">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-sm text-nest-100/60">Order total</p>
              <p class="font-display text-2xl font-bold text-white">
                {formatPrice(totalCents())}
              </p>
              <Show when={props.user && balanceCents() < totalCents()}>
                <p class="mt-2 text-sm text-red-300">
                  Insufficient balance — you need{' '}
                  {formatPrice(totalCents() - balanceCents())} more.
                </p>
              </Show>
            </div>
            <button
              type="button"
              disabled={loading() || !canCheckout()}
              onClick={handleCheckout}
              class="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-nest-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading() ? 'Processing…' : 'Complete checkout'}
            </button>
          </div>
          <Show when={!props.user}>
            <p class="mt-4 text-sm text-nest-100/60">
              You must be signed in to check out.
            </p>
          </Show>
        </div>
      </Show>

      <p class="text-sm text-nest-100/50">
        <a href="/" class="text-accent hover:underline">
          ← Continue shopping
        </a>
      </p>
    </div>
  );
}
