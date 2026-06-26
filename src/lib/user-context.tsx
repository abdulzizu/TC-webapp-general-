"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SizeProfile = {
  tshirtSize: string;
  chestInches: string;
  sleeveInches: string;
  pantsWaist: string;
  pantsLength: string;
  hipInches: string;
  capInches: string;
};

export type OrderItem = {
  productId: number;
  productName: string;
  productImage: string;
  size: string;
  quantity: number;
  price: number;
};

export type OrderStatus =
  | "processing"   // paid, being prepared
  | "stockpiled"   // paid, held for later delivery
  | "shipped"      // dispatched
  | "delivered"    // received
  | "unsuccessful"; // payment failed / item sold out

export type Order = {
  orderId: string;
  date: string; // ISO string
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  deliveryAddress: string;
  payMethod: string;
  status: OrderStatus;
  isStockpile: boolean;
  stockpiledUntil?: string; // ISO string — 1 month from order date
};

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  sizes: SizeProfile;
  orders: Order[];
  keywords: string[]; // drop notification keywords
};

type UserContextType = {
  user: UserProfile | null;
  saveUser: (profile: UserProfile) => void;
  saveOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;
  signOut: () => void;
  isSignedIn: boolean;
};

const UserContext = createContext<UserContextType | null>(null);
const STORAGE_KEY = "tc_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (!parsed.orders) parsed.orders = [];
        if (!parsed.keywords) parsed.keywords = [];
        if (!parsed.email) parsed.email = "";
        setUser(parsed);
      }
    } catch {}
  }, []);

  function persist(profile: UserProfile) {
    setUser(profile);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch {}
  }

  function saveUser(profile: UserProfile) {
    persist({
      ...profile,
      orders: profile.orders ?? [],
      keywords: profile.keywords ?? [],
      email: profile.email ?? "",
    });
  }

  function saveOrder(order: Order) {
    if (!user) return;
    persist({ ...user, orders: [order, ...(user.orders ?? [])] });
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!user) return;
    persist({
      ...user,
      orders: user.orders.map((o) => o.orderId === orderId ? { ...o, status } : o),
    });
  }

  function addKeyword(keyword: string) {
    if (!user) return;
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || user.keywords.includes(trimmed)) return;
    persist({ ...user, keywords: [...user.keywords, trimmed] });
  }

  function removeKeyword(keyword: string) {
    if (!user) return;
    persist({ ...user, keywords: user.keywords.filter((k) => k !== keyword) });
  }

  function signOut() {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return (
    <UserContext.Provider value={{
      user, saveUser, saveOrder, updateOrderStatus,
      addKeyword, removeKeyword, signOut, isSignedIn: !!user,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
