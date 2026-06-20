import { Show, For, createEffect, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $cart, $cartTotal } from '@/stores/cart-actions';
import { clearCart, hydrateCartFromStorage } from '@/stores/cart-actions';

interface Props {
  balance: number;
  error?: string | null;
  success?: boolean;
  successTotal?: number;
  successBalance?: number;
  orderId?: number;
  orderNumber?: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(price);

export default function CheckoutPanel(props: Props) {
  const cart = useStore($cart);
  const total = useStore($cartTotal);

  onMount(() => {
    hydrateCartFromStorage();
    if (props.success) {
      clearCart();
    }
  });

  createEffect(() => {
    if (props.success) {
      clearCart();
    }
  });

  const handleSubmit = (e: Event) => {
    const items = cart().items;
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const input = (e.target as HTMLFormElement).querySelector<HTMLInputElement>(
      'input[name="items"]'
    );
    if (input) {
      input.value = JSON.stringify(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
    }
  };

  return (
    <div>
      <Show when={props.error}>
        <div
          class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {props.error}
        </div>
      </Show>

      <Show when={props.success}>
        <div
          class="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800"
          role="status"
        >
          <p class="font-semibold">Order placed successfully!</p>
          <p class="mt-1">
            {props.orderNumber && (
              <>Order <span class="font-mono">{props.orderNumber}</span>. </>
            )}
            {props.successTotal !== undefined && (
              <>Charged {formatPrice(props.successTotal)}. </>
            )}
            {props.successBalance !== undefined && (
              <>Your new balance is {formatPrice(props.successBalance)}.</>
            )}
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <Show when={props.orderId}>
              {(id) => (
                <a
                  href={`/api/invoices/${id()}`}
                  download
                  class="inline-flex items-center rounded-full bg-lavender-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lavender-400"
                >
                  Download invoice (PDF)
                </a>
              )}
            </Show>
            <a href="/#products" class="inline-flex items-center font-medium text-green-900 underline">
              Continue shopping
            </a>
          </div>
        </div>
      </Show>

      <Show
        when={cart().items.length > 0 && !props.success}
        fallback={
          !props.success && (
            <div class="rounded-2xl border border-luna-200 bg-white px-6 py-12 text-center shadow-sm">
              <p class="text-luna-600">Your cart is empty.</p>
              <a href="/cart" class="mt-4 inline-block text-sm font-medium text-lavender-600 hover:text-lavender-500">
                View cart
              </a>
            </div>
          )
        }
      >
        <div class="grid gap-8 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-3">
            <h2 class="font-serif text-xl font-semibold text-luna-900">Order summary</h2>
            <For each={cart().items}>
              {(item) => (
                <div class="flex items-center justify-between rounded-xl border border-luna-200 bg-white px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img src={item.imageUrl} alt="" class="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p class="text-sm font-medium text-luna-900">{item.name}</p>
                      <p class="text-xs text-luna-500">Qty {item.quantity}</p>
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-luna-800">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              )}
            </For>
          </div>

          <aside class="rounded-2xl border border-luna-200 bg-white p-6 shadow-sm">
            <h2 class="font-serif text-xl font-semibold text-luna-900">Payment</h2>
            <p class="mt-1 text-xs text-luna-500">Simulated checkout using account balance</p>

            <dl class="mt-6 space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-luna-600">Your balance</dt>
                <dd class="font-semibold text-luna-900">{formatPrice(props.balance)}</dd>
              </div>
              <div class="flex justify-between border-t border-luna-100 pt-3">
                <dt class="text-luna-600">Order total</dt>
                <dd class="text-lg font-semibold text-luna-900">{formatPrice(total())}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-luna-600">Remaining after purchase</dt>
                <dd
                  class="font-semibold"
                  classList={{
                    'text-red-600': props.balance < total(),
                    'text-green-700': props.balance >= total(),
                  }}
                >
                  {formatPrice(Math.max(0, props.balance - total()))}
                </dd>
              </div>
            </dl>

            <Show
              when={props.balance < total()}
              fallback={
                <form action="/api/checkout" method="post" class="mt-6" onSubmit={handleSubmit}>
                  <input type="hidden" name="items" value="" />
                  <button
                    type="submit"
                    class="w-full rounded-full bg-lavender-500 py-3 text-sm font-semibold text-white hover:bg-lavender-400"
                  >
                    Place order
                  </button>
                </form>
              }
            >
              <p class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Insufficient funds. Add credit via the admin panel or contact support.
              </p>
            </Show>

            <a
              href="/cart"
              class="mt-3 block w-full py-2 text-center text-sm text-luna-500 hover:text-luna-800"
            >
              Back to cart
            </a>
          </aside>
        </div>
      </Show>
    </div>
  );
}
