"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_id: string;
  user_id: string | null;
  guest_phone: string | null;
  guest_name: string | null;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  delivery_address: string;
  pay_method: string;
  is_stockpile: boolean;
  stockpiled_until: string | null;
  created_at: string;
  order_items: any[];
};

const STATUSES = ["pending", "processing", "stockpiled", "shipped", "delivered", "unsuccessful"];

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (data) setOrders(data as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) { alert("Failed to update: " + error.message); setUpdating(null); return; }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdating(null);
  }

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.order_id.toLowerCase().includes(q) ||
        (o.guest_name ?? "").toLowerCase().includes(q) ||
        (o.guest_phone ?? "").toLowerCase().includes(q) ||
        o.delivery_address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1a1a1a]">Orders ({orders.length})</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterTab label="All" count={orders.length} active={filter === "all"} onClick={() => setFilter("all")} />
        {STATUSES.map((s) => (
          <FilterTab key={s} label={s} count={statusCounts[s] ?? 0} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by order ID, name, phone, or address…"
        className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Order header */}
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#1a1a1a]">{order.order_id}</span>
                  <span className="text-xs text-gray-500">{order.guest_name || "Signed-in user"}</span>
                  {order.user_id && <span className="text-[9px] bg-[#1a6b2f]/10 text-[#1a6b2f] font-semibold px-1.5 py-0.5 rounded">Signed in</span>}
                  {!order.user_id && <span className="text-[9px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded">Guest</span>}
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-semibold">₦{order.total.toLocaleString()}</span>
                  {order.is_stockpile && <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">Stockpile</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expanded === order.id && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                  {/* Customer info */}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customer</p>
                      <p className="font-medium">{order.guest_name || "Signed-in user"}</p>
                      <p className="text-gray-500">{order.guest_phone || ""}</p>
                      {order.user_id && <p className="text-xs text-gray-400 mt-0.5">Account ID: {order.user_id.slice(0, 8)}…</p>}
                      {/* Possible match hint */}
                      {(() => {
                        const matchCount = orders.filter((o) =>
                          o.id !== order.id &&
                          ((order.guest_phone && o.guest_phone === order.guest_phone) ||
                           (order.guest_name && o.guest_name === order.guest_name))
                        ).length;
                        return matchCount > 0 ? (
                          <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                            🔗 {matchCount} other order{matchCount > 1 ? "s" : ""} with same {order.guest_phone ? "phone" : "name"}
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Delivery Address</p>
                      <p className="text-gray-600">{order.delivery_address}</p>
                    </div>
                  </div>

                  {/* Order items */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Items</p>
                    <div className="space-y-2">
                      {(order.order_items ?? []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                          {item.product_image && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                              <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="40px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{item.product_name}</span>
                            <span className="text-xs text-gray-400">Size: {item.size} · Qty: {item.quantity}</span>
                          </div>
                          <span className="font-semibold shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="text-sm space-y-1 border-t border-gray-100 pt-3">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span></div>
                    {order.discount_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-green-600">-₦{order.discount_amount.toLocaleString()}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping_cost === 0 ? "FREE" : `₦${order.shipping_cost.toLocaleString()}`}</span></div>
                    <div className="flex justify-between font-bold text-base"><span>Total</span><span>₦{order.total.toLocaleString()}</span></div>
                  </div>

                  {/* Stockpile info */}
                  {order.is_stockpile && order.stockpiled_until && (
                    <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                      Stockpiled until {new Date(order.stockpiled_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}

                  {/* Update status */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={order.status === s || updating === order.id}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                            order.status === s
                              ? "bg-[#1a6b2f] border-[#1a6b2f] text-white"
                              : "border-gray-200 text-gray-600 hover:border-[#1a6b2f] hover:text-[#1a6b2f]"
                          } disabled:opacity-40`}
                        >
                          {updating === order.id ? "…" : s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition capitalize ${
        active ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    processing: "bg-amber-100 text-amber-700",
    stockpiled: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    unsuccessful: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
