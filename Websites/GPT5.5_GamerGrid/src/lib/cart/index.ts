import type { CartItem, CartSnapshot } from '@/lib/cart/types';

export type { CartItem, CartSnapshot };

const STORAGE_KEY = 'voltstream_cart';
const STATE_KEY = '__voltstream_cart_state__';

type CartListener = (snapshot: CartSnapshot) => void;

interface CartState {
  items: CartItem[];
  listeners: Set<CartListener>;
  ready: boolean;
}

function getState(): CartState {
  const g = globalThis as typeof globalThis & { [STATE_KEY]?: CartState };
  if (!g[STATE_KEY]) {
    g[STATE_KEY] = { items: [], listeners: new Set(), ready: false };
  }
  return g[STATE_KEY];
}

function isValidItem(item: unknown): item is CartItem {
  if (typeof item !== 'object' || item === null) return false;
  const row = item as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.price === 'number' &&
    Number.isFinite(row.price)
  );
}

function dedupe(items: CartItem[]): CartItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return dedupe(parsed.filter(isValidItem));
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupe(items)));
  } catch {
    // ignore
  }
}

function snapshot(state: CartState): CartSnapshot {
  const items = dedupe(state.items);
  return {
    items,
    count: items.length,
    total: Math.round(items.reduce((sum, i) => sum + i.price, 0) * 100) / 100,
  };
}

function notify(state: CartState) {
  state.items = dedupe(state.items);
  saveToStorage(state.items);
  const snap = snapshot(state);
  state.listeners.forEach((listener) => listener(snap));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('voltstream:cart', { detail: snap }),
    );
  }
}

/** Load cart once per page and notify subscribers. */
export function initCart(): CartSnapshot {
  const state = getState();
  if (!state.ready) {
    state.ready = true;
    state.items = loadFromStorage();
  }
  const snap = snapshot(state);
  return snap;
}

export function getCartSnapshot(): CartSnapshot {
  return snapshot(getState());
}

export function subscribe(listener: CartListener): () => void {
  const state = getState();
  initCart();
  listener(snapshot(state));
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export function isInCart(productId: string): boolean {
  return getCartSnapshot().items.some((item) => item.id === productId);
}

export function addToCart(item: CartItem): boolean {
  if (typeof window === 'undefined') return false;

  const normalized: CartItem = {
    id: String(item.id),
    name: String(item.name),
    price: Number(item.price),
  };

  if (!isValidItem(normalized)) return false;

  const state = getState();
  initCart();

  if (state.items.some((i) => i.id === normalized.id)) return false;

  state.items = [...state.items, normalized];
  notify(state);
  return true;
}

export function removeFromCart(productId: string): void {
  if (typeof window === 'undefined') return;
  const state = getState();
  initCart();
  state.items = state.items.filter((item) => item.id !== productId);
  notify(state);
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  const state = getState();
  state.items = [];
  notify(state);
}

export function getProductIds(): string[] {
  return getCartSnapshot().items.map((item) => item.id);
}
