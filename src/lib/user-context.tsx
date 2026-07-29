"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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
  | "pending"
  | "processing"
  | "stockpiled"
  | "shipped"
  | "delivered"
  | "unsuccessful";

export type Order = {
  orderId: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  deliveryAddress: string;
  payMethod: string;
  status: OrderStatus;
  isStockpile: boolean;
  stockpiledUntil?: string;
};

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  sizes: SizeProfile;
  orders: Order[];
  keywords: string[];
};

type UserContextType = {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  isSignedIn: boolean;
  isLoading: boolean;
  saveUser: (profile: UserProfile) => Promise<void>;
  saveOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addKeyword: (keyword: string) => Promise<void>;
  removeKeyword: (keyword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

// ── localStorage fallback keys (kept for offline/guest use) ──
const LS_USER = "tc_user";

function lsLoad(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    const p = JSON.parse(raw) as UserProfile;
    if (!p.orders) p.orders = [];
    if (!p.keywords) p.keywords = [];
    if (!p.email) p.email = "";
    return p;
  } catch { return null; }
}

function lsSave(p: UserProfile) {
  try { localStorage.setItem(LS_USER, JSON.stringify(p)); } catch {}
}

function lsClear() {
  try { localStorage.removeItem(LS_USER); } catch {}
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load profile from Supabase ──────────────────────────────
  const loadProfile = useCallback(async (uid: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    const { data: keywordRows } = await supabase
      .from("keywords")
      .select("keyword")
      .eq("user_id", uid);

    const { data: orderRows } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!profile) return null;

    const orders: Order[] = (orderRows ?? []).map((o: any) => ({
      orderId: o.order_id,
      date: o.created_at,
      items: (o.order_items ?? []).map((i: any) => ({
        productId: i.product_id,
        productName: i.product_name,
        productImage: i.product_image,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: o.subtotal,
      shippingCost: o.shipping_cost,
      discountAmount: o.discount_amount,
      total: o.total,
      deliveryAddress: o.delivery_address,
      payMethod: o.pay_method,
      status: o.status,
      isStockpile: o.is_stockpile,
      stockpiledUntil: o.stockpiled_until ?? undefined,
    }));

    const up: UserProfile = {
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      deliveryAddress: profile.delivery_address ?? "",
      sizes: {
        tshirtSize: profile.tshirt_size ?? "",
        chestInches: profile.chest_inches ?? "",
        sleeveInches: profile.sleeve_inches ?? "",
        pantsWaist: profile.pants_waist ?? "",
        pantsLength: profile.pants_length ?? "",
        hipInches: profile.hip_inches ?? "",
        capInches: profile.cap_inches ?? "",
      },
      orders,
      keywords: (keywordRows ?? []).map((k: any) => k.keyword),
    };

    lsSave(up); // keep localStorage in sync as a cache
    return up;
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!supabaseUser) return;
    const profile = await loadProfile(supabaseUser.id);
    if (profile) setUser(profile);
  }, [supabaseUser, loadProfile]);

  // ── Auth state listener ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      } else {
        // Fall back to localStorage for guest users
        setUser(lsLoad());
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          const profile = await loadProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
          lsClear();
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  // ── saveUser — upserts profile to Supabase ──────────────────
  async function saveUser(profile: UserProfile) {
    const localProfile = { ...profile, orders: profile.orders ?? [], keywords: profile.keywords ?? [] };
    setUser(localProfile);
    lsSave(localProfile);

    if (!supabaseUser) return; // guest — localStorage only

    await supabase.from("profiles").upsert({
      id: supabaseUser.id,
      name: profile.name,
      phone: profile.phone,
      email: profile.email || null,
      delivery_address: profile.deliveryAddress || null,
      tshirt_size: profile.sizes.tshirtSize || null,
      chest_inches: profile.sizes.chestInches || null,
      sleeve_inches: profile.sizes.sleeveInches || null,
      pants_waist: profile.sizes.pantsWaist || null,
      pants_length: profile.sizes.pantsLength || null,
      hip_inches: profile.sizes.hipInches || null,
      cap_inches: profile.sizes.capInches || null,
    }, { onConflict: "id" });
  }

  // ── saveOrder — writes order + items to Supabase ────────────
  async function saveOrder(order: Order) {
    const updated = { ...(user ?? ({} as UserProfile)), orders: [order, ...(user?.orders ?? [])] };
    setUser(updated);
    lsSave(updated);

    if (!supabaseUser && !order.orderId) return;

    // Insert order row
    const { data: orderRow, error } = await supabase.from("orders").insert({
      order_id: order.orderId,
      user_id: supabaseUser?.id ?? null,
      guest_phone: supabaseUser ? null : (user?.phone ?? null),
      guest_name: supabaseUser ? null : (user?.name ?? null),
      status: order.status,
      subtotal: order.subtotal,
      shipping_cost: order.shippingCost,
      discount_amount: order.discountAmount,
      total: order.total,
      delivery_address: order.deliveryAddress,
      pay_method: order.payMethod,
      is_stockpile: order.isStockpile,
      stockpiled_until: order.stockpiledUntil ?? null,
    }).select("id").single();

    if (error || !orderRow) return;

    // Insert order items
    if (order.items.length > 0) {
      await supabase.from("order_items").insert(
        order.items.map((i) => ({
          order_id: orderRow.id,
          product_id: i.productId,
          product_name: i.productName,
          product_image: i.productImage,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        }))
      );
    }
  }

  // ── updateOrderStatus ───────────────────────────────────────
  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!user) return;
    const updated = {
      ...user,
      orders: user.orders.map((o) => o.orderId === orderId ? { ...o, status } : o),
    };
    setUser(updated);
    lsSave(updated);

    await supabase.from("orders").update({ status }).eq("order_id", orderId);
  }

  // ── keywords ────────────────────────────────────────────────
  async function addKeyword(keyword: string) {
    if (!user) return;
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || user.keywords.includes(trimmed)) return;
    const updated = { ...user, keywords: [...user.keywords, trimmed] };
    setUser(updated);
    lsSave(updated);

    if (supabaseUser) {
      await supabase.from("keywords").upsert(
        { user_id: supabaseUser.id, keyword: trimmed },
        { onConflict: "user_id,keyword" }
      );
    }
  }

  async function removeKeyword(keyword: string) {
    if (!user) return;
    const updated = { ...user, keywords: user.keywords.filter((k) => k !== keyword) };
    setUser(updated);
    lsSave(updated);

    if (supabaseUser) {
      await supabase.from("keywords").delete()
        .eq("user_id", supabaseUser.id)
        .eq("keyword", keyword);
    }
  }

  // ── signOut ─────────────────────────────────────────────────
  async function signOut() {
    setUser(null);
    lsClear();
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{
      user,
      supabaseUser,
      session,
      isSignedIn: !!supabaseUser,
      isLoading,
      saveUser,
      saveOrder,
      updateOrderStatus,
      addKeyword,
      removeKeyword,
      signOut,
      refreshProfile,
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
