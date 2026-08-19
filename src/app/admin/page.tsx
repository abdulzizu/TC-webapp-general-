"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Metrics = {
  totalProducts: number;
  availableProducts: number;
  soldOutProducts: number;
  totalOrders: number;
  processingOrders: number;
  totalCustomers: number;
  totalLeads: number;
  revenue: number;
};

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [approachingStockpiles, setApproachingStockpiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [
        { data: products },
        { data: orders },
        { data: profiles },
        { data: leads },
      ] = await Promise.all([
        supabase.from("products").select("id, available, tag, price"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id"),
        supabase.from("temp_leads").select("id"),
      ]);

      const prods = products ?? [];
      const ords = orders ?? [];

      setMetrics({
        totalProducts: prods.length,
        availableProducts: prods.filter((p: any) => p.available && p.tag !== "SOLD").length,
        soldOutProducts: prods.filter((p: any) => p.tag === "SOLD").length,
        totalOrders: ords.length,
        processingOrders: ords.filter((o: any) => o.status === "processing").length,
        totalCustomers: (profiles ?? []).length,
        totalLeads: (leads ?? []).length,
        revenue: ords
          .filter((o: any) => o.status !== "unsuccessful")
          .reduce((sum: number, o: any) => sum + (o.total ?? 0), 0),
      });

      setRecentOrders(ords.slice(0, 5));

      // Find stockpiled orders approaching deadline (within 5 days)
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      const approaching = ords.filter((o: any) =>
        o.status === "stockpiled" && o.stockpiled_until &&
        new Date(o.stockpiled_until) <= fiveDaysFromNow &&
        new Date(o.stockpiled_until) > new Date()
      );
      setApproachingStockpiles(approaching);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const m = metrics!;

  const cards = [
    { label: "Total Products", value: m.totalProducts, color: "text-[#1a1a1a]" },
    { label: "Available", value: m.availableProducts, color: "text-[#1a6b2f]" },
    { label: "Sold", value: m.soldOutProducts, color: "text-red-500" },
    { label: "Total Orders", value: m.totalOrders, color: "text-[#1a1a1a]" },
    { label: "Processing", value: m.processingOrders, color: "text-amber-600" },
    { label: "Customers", value: m.totalCustomers, color: "text-[#1a1a1a]" },
    { label: "Drop Leads", value: m.totalLeads, color: "text-[#1a6b2f]" },
    { label: "Revenue", value: `₦${m.revenue.toLocaleString()}`, color: "text-[#1a6b2f]" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Overview</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Stockpile deadline alerts */}
      {approachingStockpiles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-bold text-amber-800 text-sm mb-2">⚠️ Stockpile deadlines approaching ({approachingStockpiles.length})</p>
          <div className="space-y-2">
            {approachingStockpiles.map((o: any) => {
              const daysLeft = Math.ceil((new Date(o.stockpiled_until).getTime() - Date.now()) / 86400000);
              return (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono font-bold text-xs">{o.order_id}</span>
                    <span className="text-gray-500 ml-2">{o.guest_name || "Signed-in user"}</span>
                  </div>
                  <span className={`text-xs font-semibold ${daysLeft <= 2 ? "text-red-600" : "text-amber-700"}`}>
                    {daysLeft <= 0 ? "Expires today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-sm text-[#1a1a1a]">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-2.5 text-left">Order ID</th>
                  <th className="px-5 py-2.5 text-left">Status</th>
                  <th className="px-5 py-2.5 text-right">Total</th>
                  <th className="px-5 py-2.5 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs font-bold">{o.order_id}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">₦{(o.total ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
