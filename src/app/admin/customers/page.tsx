"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  delivery_address: string | null;
  created_at: string;
  orders: any[];
};

export default function AdminCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadCustomers = useCallback(async () => {
    // Load profiles with their orders
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    // Load orders grouped by user
    const { data: orders } = await supabase
      .from("orders")
      .select("order_id, total, status, created_at, user_id")
      .order("created_at", { ascending: false });

    const ordersByUser: Record<string, any[]> = {};
    (orders ?? []).forEach((o: any) => {
      if (o.user_id) {
        if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = [];
        ordersByUser[o.user_id].push(o);
      }
    });

    const mapped: Customer[] = profiles.map((p: any) => ({
      ...p,
      orders: ordersByUser[p.id] ?? [],
    }));

    setCustomers(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1a1a1a]">Customers ({customers.length})</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name, phone, or email…"
        className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No customers found.</p>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.slice((page - 1) * perPage, page * perPage).map((customer, index) => (
              <div key={customer.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Customer header */}
                <button
                  onClick={() => setExpanded(expanded === customer.id ? null : customer.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400 w-6">{(page - 1) * perPage + index + 1}.</span>
                    <div className="w-9 h-9 rounded-full bg-[#1a6b2f]/10 flex items-center justify-center text-[#1a6b2f] font-bold text-sm">
                      {customer.name ? customer.name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[#1a1a1a]">{customer.name || "No name"}</p>
                      <p className="text-xs text-gray-400">{customer.phone || customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {customer.orders.length} order{customer.orders.length !== 1 ? "s" : ""}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === customer.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

              {/* Expanded details */}
              {expanded === customer.id && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                  {/* Info grid */}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contact</p>
                      <p>Phone: <strong>{customer.phone}</strong></p>
                      {customer.email && <p>Email: <strong>{customer.email}</strong></p>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Details</p>
                      {customer.delivery_address && <p className="text-gray-600">{customer.delivery_address}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(customer.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Purchase history */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Purchase History</p>
                    {customer.orders.length === 0 ? (
                      <p className="text-sm text-gray-400">No orders yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {customer.orders.map((o: any) => (
                          <div key={o.order_id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold">{o.order_id}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <div className="text-right">
                              <span className="font-semibold">₦{(o.total ?? 0).toLocaleString()}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total spent */}
                  {customer.orders.length > 0 && (
                    <div className="text-sm border-t border-gray-100 pt-3">
                      <span className="text-gray-500">Total spent: </span>
                      <span className="font-bold text-[#1a6b2f]">
                        ₦{customer.orders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Delete customer */}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ${customer.name || customer.email || customer.phone}? This removes their account and cannot be undone.`)) return;
                        const res = await fetch(`/api/admin/customers?id=${customer.id}`, { method: "DELETE" });
                        if (res.ok) {
                          setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
                        } else {
                          const data = await res.json();
                          alert("Failed to delete: " + (data.error || "Unknown error"));
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold"
                    >
                      Delete customer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Pagination */}
          {filtered.length > perPage && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:border-[#1a6b2f] disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-[#1a6b2f]">
                  {page} / {Math.ceil(filtered.length / perPage)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / perPage), p + 1))}
                  disabled={page >= Math.ceil(filtered.length / perPage)}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:border-[#1a6b2f] disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processing: "bg-amber-100 text-amber-700",
    stockpiled: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    unsuccessful: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
