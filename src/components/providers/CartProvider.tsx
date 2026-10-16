"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addToCart as addToCartAction, getCart, mergeCart, removeFromCart as removeFromCartAction, type CartItem } from "@/actions/cart.action";

const GUEST_CART_ID_KEY = "agitek-guest-cart-id";
const CART_QUERY_KEY = ["cart"] as const;
type CartContextValue = {
  items: CartItem[];
  isLoading: boolean;
  guestSessionId: string;
  addItem: (productId: number, quantity: number) => Promise<boolean>;
  removeItem: (productId: number) => Promise<boolean>;
  clearItems: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

function getOrCreateGuestSessionId() {
  const existingId = window.localStorage.getItem(GUEST_CART_ID_KEY);
  if (existingId) return existingId;
  const guestSessionId = crypto.randomUUID();
  window.localStorage.setItem(GUEST_CART_ID_KEY, guestSessionId);
  return guestSessionId;
}

export function CartProvider({ isLogin, children }: { isLogin: boolean; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [guestSessionId, setGuestSessionId] = useState("");
  const [mergeComplete, setMergeComplete] = useState(false);
  const [mergeRetry, setMergeRetry] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(false);
    setMergeComplete(false);
    setGuestSessionId(getOrCreateGuestSessionId());
    setSessionReady(true);
  }, [isLogin]);

  const cartQuery = useQuery({
    queryKey: [...CART_QUERY_KEY, isLogin ? "user" : guestSessionId],
    queryFn: async () => {
      const response = await getCart(guestSessionId);
      return response.success && Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!guestSessionId && sessionReady && mergeComplete,
  });

  useEffect(() => {
    if (!guestSessionId || !sessionReady) return;
    if (!isLogin) {
      setMergeComplete(true);
      return;
    }
    const storedGuestId = window.localStorage.getItem(GUEST_CART_ID_KEY);
    if (!storedGuestId) {
      setMergeComplete(true);
      return;
    }

    let cancelled = false;
    void mergeCart(storedGuestId).then((response) => {
      if (cancelled) return;
      if (response.success) {
        window.localStorage.removeItem(GUEST_CART_ID_KEY);
        queryClient.setQueryData([...CART_QUERY_KEY, "user"], response.data ?? []);
        setMergeComplete(true);
      } else {
        setMergeComplete(true);
        window.setTimeout(() => {
          if (!cancelled) {
            setMergeComplete(false);
            setMergeRetry((retry) => retry + 1);
          }
        }, 5000);
      }
    }).catch(() => {
      if (!cancelled) {
        setMergeComplete(true);
        window.setTimeout(() => {
          if (!cancelled) {
            setMergeComplete(false);
            setMergeRetry((retry) => retry + 1);
          }
        }, 5000);
      }
    });

    return () => { cancelled = true; };
  }, [guestSessionId, isLogin, mergeRetry, queryClient, sessionReady]);

  const addItem = async (productId: number, quantity: number) => {
    if (!guestSessionId) return false;
    const response = await addToCartAction(guestSessionId, productId, quantity);
    if (!response.success) return false;
    if (Array.isArray(response.data)) {
      queryClient.setQueryData([...CART_QUERY_KEY, isLogin ? "user" : guestSessionId], response.data);
    } else {
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    }
    return true;
  };

  const removeItem = async (productId: number) => {
    if (!guestSessionId) return false;
    const response = await removeFromCartAction(guestSessionId, productId);
    if (!response.success) return false;
    if (Array.isArray(response.data)) {
      queryClient.setQueryData([...CART_QUERY_KEY, isLogin ? "user" : guestSessionId], response.data);
    } else {
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    }
    return true;
  };

  const clearItems = async () => {
    const results = await Promise.all((cartQuery.data ?? []).map((item) => removeFromCartAction(guestSessionId, item.productId)));
    if (results.some((response) => !response.success)) {
      await queryClient.invalidateQueries({ queryKey: [...CART_QUERY_KEY, isLogin ? "user" : guestSessionId] });
      return false;
    }
    queryClient.setQueryData([...CART_QUERY_KEY, isLogin ? "user" : guestSessionId], []);
    return true;
  };

  return (
    <CartContext.Provider value={{ items: cartQuery.data ?? [], isLoading: cartQuery.isLoading || !sessionReady || !mergeComplete, guestSessionId, addItem, removeItem, clearItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
