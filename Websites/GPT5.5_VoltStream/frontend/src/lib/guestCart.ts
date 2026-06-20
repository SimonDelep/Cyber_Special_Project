const GUEST_CART_KEY = "gamergrid_guest_cart";

export interface GuestCartEntry {
  product_id: number;
  quantity: number;
}

export function loadGuestCart(): GuestCartEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as GuestCartEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartEntry[]): void {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCart(): void {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function guestCartCount(items: GuestCartEntry[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function addToGuestCart(productId: number, quantity = 1): GuestCartEntry[] {
  const items = loadGuestCart();
  const existing = items.find((i) => i.product_id === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 99);
  } else {
    items.push({ product_id: productId, quantity });
  }
  saveGuestCart(items);
  return items;
}

export function updateGuestCartItem(productId: number, quantity: number): GuestCartEntry[] {
  let items = loadGuestCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.product_id !== productId);
  } else {
    const entry = items.find((i) => i.product_id === productId);
    if (entry) entry.quantity = quantity;
  }
  saveGuestCart(items);
  return items;
}

export function removeFromGuestCart(productId: number): GuestCartEntry[] {
  const items = loadGuestCart().filter((i) => i.product_id !== productId);
  saveGuestCart(items);
  return items;
}
