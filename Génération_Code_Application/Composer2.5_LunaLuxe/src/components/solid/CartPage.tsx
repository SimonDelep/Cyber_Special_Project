import { Show, For, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $cart, $cartTotal } from '@/stores/cart-actions';
import { hydrateCartFromStorage, removeFromCart, updateCartQuantity } from '@/stores/cart-actions';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(price);

export default function CartPage() {
  const cart = useStore($cart);
  const total = useStore($cartTotal);

  onMount(() => {
    hydrateCartFromStorage();
  });

  return (
    <div>
      <Show
        when={cart().items.length > 0}
        fallback={
          <div class="rounded-2xl border border-luna-200 bg-white px-6 py-16 text-center shadow-sm">
            <p class="font-serif text-xl text-luna-800">Your cart is empty</p>
            <p class="mt-2 text-sm text-luna-500">Add sleep essentials from our shop to get started.</p>
            <a
              href="/#products"
              class="mt-6 inline-block rounded-full bg-luna-800 px-8 py-3 text-sm font-semibold text-luna-50 hover:bg-luna-700"
            >
              Browse products
            </a>
          </div>
        }
      >
        <div class="space-y-4">
          <For each={cart().items}>
            {(item) => (
              <article class="flex flex-col gap-4 rounded-2xl border border-luna-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  class="h-24 w-24 shrink-0 rounded-xl object-cover"
                />
                <div class="min-w-0 flex-1">
                  <h2 class="font-medium text-luna-900">{item.name}</h2>
                  <p class="text-sm text-luna-500">{formatPrice(item.price)} each</p>
                </div>
                <div class="flex items-center gap-3">
                  <label class="sr-only" for={`qty-${item.productId}`}>
                    Quantity for {item.name}
                  </label>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-luna-300 text-luna-700 hover:bg-luna-100"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id={`qty-${item.productId}`}
                    type="number"
                    min="1"
                    max="99"
                    value={item.quantity}
                    onChange={(e) =>
                      updateCartQuantity(item.productId, parseInt(e.currentTarget.value, 10) || 1)
                    }
                    class="w-14 rounded-lg border border-luna-200 bg-luna-50 px-2 py-1.5 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-luna-300 text-luna-700 hover:bg-luna-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-luna-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    class="mt-1 text-xs text-luna-400 hover:text-luna-700"
                  >
                    Remove
                  </button>
                </div>
              </article>
            )}
          </For>
        </div>

        <aside class="mt-8 rounded-2xl border border-luna-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between border-b border-luna-100 pb-4">
            <span class="text-sm text-luna-600">Order subtotal</span>
            <span class="text-2xl font-semibold text-luna-900">{formatPrice(total())}</span>
          </div>
          <a
            href="/checkout"
            class="mt-4 block w-full rounded-full bg-lavender-500 py-3 text-center text-sm font-semibold text-white hover:bg-lavender-400"
          >
            Proceed to checkout
          </a>
          <a
            href="/#products"
            class="mt-3 block w-full py-2 text-center text-sm text-luna-500 hover:text-luna-800"
          >
            Continue shopping
          </a>
        </aside>
      </Show>
    </div>
  );
}
