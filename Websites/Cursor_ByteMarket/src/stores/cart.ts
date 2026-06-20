export type CartItem = {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  qty: number;
};

const STORAGE_KEY = "bytemarket:cart";
export const CART_UPDATE_EVENT = "bytemarket:cart-update";

export function loadCart(): Record<string, CartItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CartItem>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCart(items: Record<string, CartItem>) {
  if (typeof window === "undefined") return;
  if (Object.keys(items).length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT));
}

export function getCartLines(): CartItem[] {
  return Object.values(loadCart());
}

export function getCartCount(): number {
  return getCartLines().reduce((sum, item) => sum + item.qty, 0);
}

export function getCartSubtotalCents(): number {
  return getCartLines().reduce(
    (sum, item) => sum + item.priceCents * item.qty,
    0,
  );
}

export function addToCart(
  product: Pick<CartItem, "id" | "slug" | "name" | "priceCents">,
) {
  const cart = loadCart();
  const key = String(product.id);
  const existing = cart[key];
  cart[key] = {
    ...product,
    qty: (existing?.qty ?? 0) + 1,
  };
  saveCart(cart);
}

export function setCartQty(productId: number, qty: number) {
  const cart = loadCart();
  const key = String(productId);
  if (qty < 1) {
    delete cart[key];
  } else if (cart[key]) {
    cart[key] = { ...cart[key], qty };
  }
  saveCart(cart);
}

export function removeFromCart(productId: number) {
  const cart = loadCart();
  delete cart[String(productId)];
  saveCart(cart);
}

export function clearCart() {
  saveCart({});
}
