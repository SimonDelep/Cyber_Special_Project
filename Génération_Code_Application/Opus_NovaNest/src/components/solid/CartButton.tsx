import { useStore } from '@nanostores/solid';
import { cartCount } from '../../stores/cart';

export default function CartButton() {
  const count = useStore(cartCount);

  return (
    <a
      href="/cart"
      class="relative inline-flex rounded-lg border border-white/15 p-2 text-nest-100/90 transition hover:border-accent/50 hover:text-white"
      aria-label={`Cart, ${count()} items`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l3.383 12.086a1.125 1.125 0 001.087.835h9.75M7.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9-1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
      {count() > 0 && (
        <span class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-nest-950">
          {count()}
        </span>
      )}
    </a>
  );
}
