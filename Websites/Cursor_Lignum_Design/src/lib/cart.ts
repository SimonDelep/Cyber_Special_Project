import { cookies } from "next/headers";

const CART_COOKIE_NAME = "lignum_cart";

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Cart = CartItem[];

function parseCart(raw: unknown): Cart {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const productId = (item as any).productId;
      const quantity = Number((item as any).quantity);
      if (typeof productId !== "string" || !productId || !Number.isFinite(quantity)) return null;
      const q = Math.max(1, Math.min(99, Math.round(quantity)));
      return { productId, quantity: q };
    })
    .filter((x): x is CartItem => !!x);
}

export function getCart(): Cart {
  const store = cookies();
  const raw = store.get(CART_COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parseCart(parsed);
  } catch {
    return [];
  }
}

export function setCart(cart: Cart) {
  const store = cookies();
  if (!cart.length) {
    store.set(CART_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return;
  }
  store.set(CART_COOKIE_NAME, JSON.stringify(cart), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function addToCart(productId: string, quantity: number = 1): Cart {
  const cart = getCart();
  const q = Math.max(1, Math.min(99, Math.round(quantity || 1)));
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity = Math.max(1, Math.min(99, existing.quantity + q));
  } else {
    cart.push({ productId, quantity: q });
  }
  setCart(cart);
  return cart;
}

export function updateCartItem(productId: string, quantity: number): Cart {
  const cart = getCart();
  const q = Math.round(quantity);
  const next =
    q <= 0
      ? cart.filter((item) => item.productId !== productId)
      : cart.map((item) =>
          item.productId === productId ? { ...item, quantity: Math.min(99, q) } : item,
        );
  setCart(next);
  return next;
}

export function removeFromCart(productId: string): Cart {
  const cart = getCart().filter((item) => item.productId !== productId);
  setCart(cart);
  return cart;
}

export function clearCart(): void {
  setCart([]);
}

