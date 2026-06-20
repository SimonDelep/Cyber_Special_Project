import { atom, computed, type WritableAtom } from 'nanostores';

export interface CartItem {
  productId: number;
  name: string;
  priceCents: number;
  quantity: number;
}

const STORAGE_KEY = 'novanest_cart';

declare global {
  interface Window {
    __novanestCartAtom?: WritableAtom<CartItem[]>;
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

function normalizeCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const productId = toInt(o.productId);
  const priceCents = toInt(o.priceCents);
  const quantity = toInt(o.quantity) ?? 1;
  const name = typeof o.name === 'string' ? o.name.trim() : '';

  if (productId === null || productId < 1) return null;
  if (priceCents === null || priceCents < 0) return null;
  if (quantity < 1 || quantity > 99) return null;
  if (!name) return null;

  return { productId, name, priceCents, quantity };
}

function loadCartFromStorage(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeCartItem)
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

/** One shared cart atom for all Astro islands (avoids duplicate in-memory stores). */
function getCartAtom(): WritableAtom<CartItem[]> {
  if (isBrowser()) {
    if (!window.__novanestCartAtom) {
      window.__novanestCartAtom = atom(loadCartFromStorage());
      window.__novanestCartAtom.subscribe(saveCartToStorage);
    }
    return window.__novanestCartAtom;
  }
  return atom<CartItem[]>([]);
}

export const cartItems = getCartAtom();

export const cartCount = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0),
);

export const cartTotalCents = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
);

/** Reload cart from localStorage (call when opening the cart page). */
export function hydrateCart(): void {
  if (!isBrowser()) return;
  cartItems.set(loadCartFromStorage());
}

function setCartItems(items: CartItem[]): void {
  cartItems.set(items);
}

export function addToCart(
  item: Omit<CartItem, 'quantity'>,
  quantity = 1,
): boolean {
  const normalized = normalizeCartItem({ ...item, quantity });
  if (!normalized) return false;

  const items = cartItems.get();
  const existing = items.find((i) => i.productId === normalized.productId);

  if (existing) {
    setCartItems(
      items.map((i) =>
        i.productId === normalized.productId
          ? { ...i, quantity: Math.min(99, i.quantity + normalized.quantity) }
          : i,
      ),
    );
  } else {
    setCartItems([...items, normalized]);
  }

  saveCartToStorage(cartItems.get());
  return true;
}

export function removeFromCart(productId: number) {
  setCartItems(cartItems.get().filter((i) => i.productId !== productId));
}

export function updateCartQuantity(productId: number, quantity: number) {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  const items = cartItems.get();
  setCartItems(
    items.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.min(99, quantity) } : i,
    ),
  );
}

export function clearCart() {
  setCartItems([]);
}
