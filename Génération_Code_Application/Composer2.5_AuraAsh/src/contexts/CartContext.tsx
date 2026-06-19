"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCartItemCount,
  getCartTotal,
  readCart,
  writeCart,
} from "@/lib/cart/storage";
import type { CartItem, ProductItem } from "@/types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  isReady: boolean;
  addItem: (product: ProductItem, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function toCartItem(product: ProductItem, quantity: number): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    quantity,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setIsReady(true);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  }, []);

  const addItem = useCallback(
    (product: ProductItem, quantity = 1) => {
      if (!product.inStock || quantity < 1) return;

      setItems((current) => {
        const existing = current.find((item) => item.productId === product.id);
        const next = existing
          ? current.map((item) =>
              item.productId === product.id
                ? {
                    ...toCartItem(product, item.quantity + quantity),
                  }
                : item,
            )
          : [...current, toCartItem(product, quantity)];

        writeCart(next);
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((current) => {
        const next = current.filter((item) => item.productId !== productId);
        writeCart(next);
        return next;
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(productId);
        return;
      }

      setItems((current) => {
        const next = current.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        );
        writeCart(next);
        return next;
      });
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartItemCount(items),
      total: getCartTotal(items),
      isReady,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, isReady, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
