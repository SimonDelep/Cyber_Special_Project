import { atom, computed } from "nanostores";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  quantity: number;
};

const STORAGE_KEY = "preppro-cart";

function loadFromStorage(): CartItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const cartItems = atom<CartItem[]>(loadFromStorage());

cartItems.subscribe(saveToStorage);

export const cartCount = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0),
);

export const cartTotalCents = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
);

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const current = cartItems.get();
  const existing = current.find((i) => i.productId === item.productId);

  if (existing) {
    cartItems.set(
      current.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + quantity }
          : i,
      ),
    );
    return;
  }

  cartItems.set([...current, { ...item, quantity }]);
}

export function updateCartQuantity(productId: number, quantity: number) {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  cartItems.set(
    cartItems
      .get()
      .map((i) => (i.productId === productId ? { ...i, quantity } : i)),
  );
}

export function removeFromCart(productId: number) {
  cartItems.set(cartItems.get().filter((i) => i.productId !== productId));
}

export function clearCart() {
  cartItems.set([]);
}

/** Rehydrate cart from localStorage after client navigation. */
export function initCartFromStorage() {
  cartItems.set(loadFromStorage());
}
