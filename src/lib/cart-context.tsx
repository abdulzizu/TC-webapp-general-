"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import type { Product } from "./products";

export type CartItem = {
  product: Product;
  size: string;
  quantity: number;
};

type CartState = { items: CartItem[] };

type CartAction =
  | { type: "ADD"; product: Product; size: string }
  | { type: "REMOVE"; id: number; size: string }
  | { type: "UPDATE_QTY"; id: number; size: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const exists = state.items.findIndex(
        (i) => i.product.id === action.product.id && i.size === action.size
      );
      if (exists >= 0) {
        const items = [...state.items];
        items[exists] = { ...items[exists], quantity: items[exists].quantity + 1 };
        return { items };
      }
      return { items: [...state.items, { product: action.product, size: action.size, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => !(i.product.id === action.id && i.size === action.size)) };
    case "UPDATE_QTY": {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => !(i.product.id === action.id && i.size === action.size)) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.id && i.size === action.size ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    case "HYDRATE":
      return { items: action.items };
    default:
      return state;
  }
}

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, size: string) => void;
  removeItem: (id: number, size: string) => void;
  updateQty: (id: number, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "tc_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from localStorage on mount (persistent cart)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        dispatch({ type: "HYDRATE", items: parsed });
      }
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem: (product, size) => {
          if (product.tag === "SOLD OUT") return; // Safety net — never add sold-out items
          dispatch({ type: "ADD", product, size });
        },
        removeItem: (id, size) => dispatch({ type: "REMOVE", id, size }),
        updateQty: (id, size, quantity) => dispatch({ type: "UPDATE_QTY", id, size, quantity }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
