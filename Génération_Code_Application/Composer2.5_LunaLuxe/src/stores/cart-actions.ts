import { atom, map } from 'nanostores';
import type { CartItem, CartState } from '@/stores/cart';
import { cartItemCount, cartTotal, initialCartState } from '@/stores/cart';

const CART_STORAGE_KEY = 'lunaluxe_cart';

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false;
  const i = item as CartItem;
  return (
    typeof i.productId === 'number' &&
    typeof i.slug === 'string' &&
    typeof i.name === 'string' &&
    typeof i.price === 'number' &&
    typeof i.imageUrl === 'string' &&
    typeof i.quantity === 'number' &&
    i.quantity > 0
  );
}

function loadPersistedCart(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem);
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function createInitialCartState(): CartState {
  const items = typeof window !== 'undefined' ? loadPersistedCart() : [];
  return { ...initialCartState, items };
}

const initialState = createInitialCartState();

export const $cart = map(initialState);

export const $cartCount = atom(cartItemCount(initialState.items));
export const $cartTotal = atom(cartTotal(initialState.items));

$cart.subscribe((state) => {
  $cartCount.set(cartItemCount(state.items));
  $cartTotal.set(cartTotal(state.items));
  persistCart(state.items);
});

/** Re-read localStorage if the in-memory store is empty (e.g. island hydration). */
export function hydrateCartFromStorage(): void {
  if (typeof window === 'undefined') return;
  const stored = loadPersistedCart();
  if (stored.length === 0) return;
  const current = $cart.get();
  if (current.items.length === 0) {
    $cart.setKey('items', stored);
  }
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  hydrateCartFromStorage();
  const current = $cart.get();
  const existing = current.items.find((i) => i.productId === item.productId);

  if (existing) {
    $cart.setKey(
      'items',
      current.items.map((i) =>
        i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
      )
    );
  } else {
    $cart.setKey('items', [...current.items, { ...item, quantity }]);
  }
}

export function updateCartQuantity(productId: number, quantity: number) {
  hydrateCartFromStorage();
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const current = $cart.get();
  $cart.setKey(
    'items',
    current.items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
  );
}

export function removeFromCart(productId: number) {
  hydrateCartFromStorage();
  const current = $cart.get();
  $cart.setKey(
    'items',
    current.items.filter((i) => i.productId !== productId)
  );
}

export function toggleCart(open?: boolean) {
  hydrateCartFromStorage();
  const current = $cart.get();
  $cart.setKey('isOpen', open ?? !current.isOpen);
}

export function clearCart() {
  $cart.setKey('items', []);
}
