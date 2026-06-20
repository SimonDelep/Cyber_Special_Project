import { createSignal, onCleanup, onMount } from "solid-js";
import { CART_UPDATE_EVENT, getCartCount } from "@/stores/cart";

export default function CartButton() {
  const [count, setCount] = createSignal(0);

  onMount(() => {
    const refresh = () => setCount(getCartCount());
    refresh();
    window.addEventListener(CART_UPDATE_EVENT, refresh);
    onCleanup(() => window.removeEventListener(CART_UPDATE_EVENT, refresh));
  });

  return (
    <a
      href="/cart"
      aria-label={`Shopping cart, ${count()} items`}
      class="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border text-ink-muted transition hover:border-accent/40 hover:text-ink"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count() > 0 && (
        <span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-medium text-surface">
          {count()}
        </span>
      )}
    </a>
  );
}
