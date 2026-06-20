import { onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $cartCount } from '@/stores/cart-actions';
import { hydrateCartFromStorage, toggleCart } from '@/stores/cart-actions';

export default function CartButton() {
  const count = useStore($cartCount);

  onMount(() => {
    hydrateCartFromStorage();
  });

  return (
    <button
      type="button"
      onClick={() => toggleCart(true)}
      class="relative rounded-full border border-luna-300 px-4 py-2 text-sm font-medium text-luna-800 transition-colors hover:border-luna-400 hover:bg-luna-100"
      aria-label="Open cart"
    >
      Cart
      {count() > 0 && (
        <span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-lavender-500 text-[10px] font-bold text-white">
          {count()}
        </span>
      )}
    </button>
  );
}
