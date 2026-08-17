"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { Product } from "./products";
import Link from "next/link";

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
  const [toast, setToast] = useState<{ name: string; image: string } | null>(null);

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
          if (product.tag === "SOLD OUT") return;
          dispatch({ type: "ADD", product, size });
          setToast({ name: product.name, image: product.image });
          setTimeout(() => setToast(null), 3000);
        },
        removeItem: (id, size) => dispatch({ type: "REMOVE", id, size }),
        updateQty: (id, size, quantity) => dispatch({ type: "UPDATE_QTY", id, size, quantity }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        totalItems,
        subtotal,
      }}
    >
      {/* Cart toast notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-[60] animate-[slideIn_0.3s_ease] bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-center gap-3 max-w-xs">
          {toast.image && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#ede8d8] shrink-0">
              <img src={toast.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1a6b2f] mb-0.5">Added to cart ✓</p>
            <p className="text-xs text-gray-600 truncate">{toast.name}</p>
          </div>
          <Link href="/cart" className="text-xs font-bold text-[#1a6b2f] hover:underline shrink-0">
            View
          </Link>
        </div>
      )}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
