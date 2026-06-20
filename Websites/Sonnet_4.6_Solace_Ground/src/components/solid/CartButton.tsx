import { useStore } from '@nanostores/solid';
import { cartCount } from '@/stores/cart';

export default function CartButton() {
  const count = useStore(cartCount);

  return (
    <a
      href="/cart"
      class="relative flex h-10 w-10 items-center justify-center rounded-full border border-cork-300 text-cork-700 transition-colors hover:border-cork-500 hover:text-cork-900"
      aria-label={`Cart, ${count()} items`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        class="h-5 w-5"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
        />
      </svg>
      {count() > 0 && (
        <span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sage-600 px-1 text-[10px] font-semibold text-white">
          {count()}
        </span>
      )}
    </a>
  );
}
