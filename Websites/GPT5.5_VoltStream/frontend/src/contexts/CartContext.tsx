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
import * as cartApi from "../api/cart";
import type { Cart } from "../api/cart";
import { fetchProduct } from "../api/products";
import type { Product } from "../types/product";
import { useAuth } from "./AuthContext";
import {
  addToGuestCart,
  clearGuestCart,
  guestCartCount,
  loadGuestCart,
  removeFromGuestCart,
  updateGuestCartItem,
} from "../lib/guestCart";

interface CartContextValue {
  itemCount: number;
  loading: boolean;
  cart: Cart | null;
  guestProducts: Map<number, Product>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [guestProducts, setGuestProducts] = useState<Map<number, Product>>(new Map());
  const [loading, setLoading] = useState(false);

  const loadGuestProducts = useCallback(async () => {
    const entries = loadGuestCart();
    setGuestCount(guestCartCount(entries));
    const map = new Map<number, Product>();
    await Promise.all(
      entries.map(async (e) => {
        try {
          const p = await fetchProduct(e.product_id);
          map.set(e.product_id, p);
        } catch {
          /* product may have been removed */
        }
      })
    );
    setGuestProducts(map);
  }, []);

  const refreshCart = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const data = await cartApi.fetchCart();
        setCart(data);
      } catch {
        setCart(null);
      } finally {
        setLoading(false);
      }
    } else {
      await loadGuestProducts();
      setCart(null);
    }
  }, [user, loadGuestProducts]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const mergeGuestOnLogin = useCallback(async () => {
    const guest = loadGuestCart();
    if (guest.length === 0) return;
    await cartApi.mergeGuestCart(guest);
    clearGuestCart();
    setGuestCount(0);
    setGuestProducts(new Map());
  }, []);

  const hadUser = useRef(false);
  useEffect(() => {
    if (user && !hadUser.current) {
      mergeGuestOnLogin().then(() => refreshCart());
    }
    hadUser.current = Boolean(user);
  }, [user, mergeGuestOnLogin, refreshCart]);

  const addItem = useCallback(
    async (productId: number, quantity = 1) => {
      if (user) {
        await cartApi.addCartItem(productId, quantity);
        await refreshCart();
      } else {
        addToGuestCart(productId, quantity);
        await loadGuestProducts();
      }
    },
    [user, refreshCart, loadGuestProducts]
  );

  const updateQuantity = useCallback(
    async (productId: number, quantity: number) => {
      if (user) {
        if (quantity <= 0) {
          await cartApi.removeCartItem(productId);
        } else {
          await cartApi.updateCartItem(productId, quantity);
        }
        await refreshCart();
      } else {
        updateGuestCartItem(productId, quantity);
        await loadGuestProducts();
      }
    },
    [user, refreshCart, loadGuestProducts]
  );

  const removeItem = useCallback(
    async (productId: number) => {
      if (user) {
        await cartApi.removeCartItem(productId);
        await refreshCart();
      } else {
        removeFromGuestCart(productId);
        await loadGuestProducts();
      }
    },
    [user, refreshCart, loadGuestProducts]
  );

  const itemCount = user ? (cart?.item_count ?? 0) : guestCount;

  const value = useMemo(
    () => ({
      itemCount,
      loading,
      cart,
      guestProducts,
      addItem,
      updateQuantity,
      removeItem,
      refreshCart,
    }),
    [itemCount, loading, cart, guestProducts, addItem, updateQuantity, removeItem, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
