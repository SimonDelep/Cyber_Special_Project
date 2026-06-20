"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { CartItem, CartItemInput } from "@/types/cart";

const STORAGE_KEY = "roastritual-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  hydrated: boolean;
  addItem: (item: CartItemInput, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item.productId &&
        item.name &&
        typeof item.priceCents === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipNextPersist = useRef(true);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const persistCart = useCallback((next: CartItem[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    skipNextPersist.current = true;
  }, []);

  const addItem = useCallback(
    (item: CartItemInput, quantity = 1) => {
      const qty = Math.max(1, Math.min(99, quantity));
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        const next = existing
          ? prev.map((i) =>
              i.productId === item.productId
                ? {
                    ...i,
                    ...item,
                    quantity: Math.min(99, i.quantity + qty),
                  }
                : i,
            )
          : [...prev, { ...item, quantity: qty }];
        if (hydrated) persistCart(next);
        return next;
      });
    },
    [hydrated, persistCart],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        if (hydrated) persistCart(next);
        return next;
      });
    },
    [hydrated, persistCart],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      setItems((prev) => {
        const next =
          quantity < 1
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: Math.min(99, quantity) }
                  : i,
              );
        if (hydrated) persistCart(next);
        return next;
      });
    },
    [hydrated, persistCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    persistCart([]);
  }, [persistCart]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotalCents,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotalCents,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
