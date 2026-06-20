import { atom, computed } from 'nanostores';

export type CartLine = {
  productId: number;
  name: string;
  priceCents: number;
  quantity: number;
};

const STORAGE_KEY = 'sg-cart';

export const cartLines = atom<CartLine[]>([]);

if (typeof window !== 'undefined') {
  cartLines.set(loadCart());
}

export const cartCount = computed(cartLines, (lines) =>
  lines.reduce((sum, line) => sum + line.quantity, 0),
);

export const cartTotalCents = computed(cartLines, (lines) =>
  lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
);

function loadCart(): CartLine[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCart(lines: CartLine[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

function setLines(lines: CartLine[]) {
  cartLines.set(lines);
  persistCart(lines);
}

export function addToCart(line: Omit<CartLine, 'quantity'>, quantity = 1) {
  const current = cartLines.get();
  const existing = current.find((l) => l.productId === line.productId);

  if (existing) {
    setLines(
      current.map((l) =>
        l.productId === line.productId
          ? { ...l, quantity: l.quantity + quantity }
          : l,
      ),
    );
  } else {
    setLines([...current, { ...line, quantity }]);
  }
}

export function removeFromCart(productId: number) {
  setLines(cartLines.get().filter((l) => l.productId !== productId));
}

export function setCartQuantity(productId: number, quantity: number) {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  setLines(
    cartLines.get().map((l) =>
      l.productId === productId ? { ...l, quantity } : l,
    ),
  );
}

export function clearCart() {
  setLines([]);
}
