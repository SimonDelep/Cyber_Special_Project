import { Show, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $cart, $cartTotal } from '@/stores/cart-actions';
import { hydrateCartFromStorage, removeFromCart, toggleCart, clearCart } from '@/stores/cart-actions';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(price);

export default function CartDrawer() {
  const cart = useStore($cart);
  const total = useStore($cartTotal);

  onMount(() => {
    hydrateCartFromStorage();
  });

  return (
    <>
      <Show when={cart().isOpen}>
        <div
          class="fixed inset-0 z-50 bg-luna-950/40 backdrop-blur-sm"
          onClick={() => toggleCart(false)}
          aria-hidden="true"
        />
      </Show>

      <aside
        class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-luna-50 shadow-2xl transition-transform duration-300"
        classList={{ 'translate-x-0': cart().isOpen, 'translate-x-full': !cart().isOpen }}
        aria-label="Shopping cart"
      >
        <div class="flex items-center justify-between border-b border-luna-200 px-6 py-5">
          <h2 class="font-serif text-xl font-semibold text-luna-900">Your Cart</h2>
          <button
            type="button"
            onClick={() => toggleCart(false)}
            class="rounded-full p-2 text-luna-500 transition-colors hover:bg-luna-100 hover:text-luna-800"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4">
          <Show
            when={cart().items.length > 0}
            fallback={
              <p class="mt-8 text-center text-sm text-luna-500">
                Your cart is empty. Explore our sleep essentials below.
              </p>
            }
          >
            <ul class="space-y-4">
              {cart().items.map((item) => (
                <li class="flex gap-4 rounded-xl border border-luna-200 bg-white p-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    class="h-16 w-16 rounded-lg object-cover"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-medium text-luna-900">{item.name}</p>
                    <p class="text-xs text-luna-500">Qty: {item.quantity}</p>
                    <p class="mt-1 text-sm font-semibold text-luna-800">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    class="self-start text-xs text-luna-400 hover:text-luna-700"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Show>
        </div>

        <Show when={cart().items.length > 0}>
          <div class="border-t border-luna-200 px-6 py-5">
            <div class="mb-4 flex items-center justify-between">
              <span class="text-sm text-luna-600">Subtotal</span>
              <span class="text-lg font-semibold text-luna-900">{formatPrice(total())}</span>
            </div>
            <a
              href="/checkout"
              class="block w-full rounded-full bg-lavender-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-lavender-400"
            >
              Checkout
            </a>
            <a
              href="/cart"
              class="mt-2 block w-full py-2 text-center text-xs font-medium text-luna-600 hover:text-luna-900"
            >
              View full cart
            </a>
            <button
              type="button"
              onClick={clearCart}
              class="mt-1 w-full py-2 text-xs text-luna-500 hover:text-luna-700"
            >
              Clear cart
            </button>
          </div>
        </Show>
      </aside>
    </>
  );
}
