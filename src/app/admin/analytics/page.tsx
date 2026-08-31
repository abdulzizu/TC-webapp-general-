"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// Paid/fulfilled order statuses — these count as a real sale.
const PAID_STATUSES = ["processing", "stockpiled", "shipped", "delivered"];

type Drop = {
  id: number;
  name: string | null;
  released_at: string | null;
  status: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  drop_id: number | null;
  tag: string | null;
  available: boolean;
};

// product_id -> earliest paid-order timestamp (ms) for that product
type SaleMap = Map<number, number>;

const WINDOWS = [
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
  { label: "1 week", hours: 168 },
];

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleMap, setSaleMap] = useState<SaleMap>(new Map());
  const [windowHours, setWindowHours] = useState(48);
  const [selectedDropId, setSelectedDropId] = useState<number | "all">("all");

  // repeat-customer estimate
  const [returnStats, setReturnStats] = useState<{ total: number; repeat: number } | null>(null);
  // unfulfilled demand
  const [demand, setDemand] = useState<{ keyword: string; count: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    // Drops that have actually been released
    const { data: dropRows } = await supabase
      .from("drops")
      .select("id, name, released_at, status")
      .not("released_at", "is", null)
      .order("released_at", { ascending: false });

    // Products tied to a drop (include tag so we can detect manually-sold items)
    const { data: prodRows } = await supabase
      .from("products")
      .select("id, name, category, subcategory, price, drop_id, tag, available")
      .not("drop_id", "is", null);

    // Order items joined with their order (for sale time + paid status)
    const { data: itemRows } = await supabase
      .from("order_items")
      .select("product_id, orders!inner(created_at, status)");

    // Build product -> earliest paid sale time
    const map: SaleMap = new Map();
    for (const row of (itemRows ?? []) as any[]) {
      const order = row.orders;
      if (!order || !PAID_STATUSES.includes(order.status)) continue;
      if (!row.product_id) continue;
      const t = new Date(order.created_at).getTime();
      const existing = map.get(row.product_id);
      if (existing === undefined || t < existing) map.set(row.product_id, t);
    }

    setDrops((dropRows ?? []) as Drop[]);
    setProducts((prodRows ?? []) as Product[]);
    setSaleMap(map);

    // ── Return-customer estimate ──────────────────────────────
    // Match orders to a buyer identity: user_id if signed in, else guest_phone,
    // else guest_email. Count identities with >1 paid order as repeat.
    const { data: orderRows } = await supabase
      .from("orders")
      .select("user_id, guest_phone, guest_email, status");
    const buyerCounts = new Map<string, number>();
    for (const o of (orderRows ?? []) as any[]) {
      if (!PAID_STATUSES.includes(o.status)) continue;
      const key = o.user_id || o.guest_phone || o.guest_email;
      if (!key) continue;
      buyerCounts.set(key, (buyerCounts.get(key) ?? 0) + 1);
    }
    const total = buyerCounts.size;
    let repeat = 0;
    buyerCounts.forEach((c) => { if (c > 1) repeat++; });
    setReturnStats({ total, repeat });

    // ── Unfulfilled demand (wishlist keywords) ────────────────
    const { data: kwRows } = await supabase.from("keywords").select("keyword");
    const kwCounts = new Map<string, number>();
    for (const k of (kwRows ?? []) as any[]) {
      const key = (k.keyword || "").trim().toLowerCase();
      if (!key) continue;
      kwCounts.set(key, (kwCounts.get(key) ?? 0) + 1);
    }
    const demandList = [...kwCounts.entries()]
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    setDemand(demandList);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Scope products to selected drop (or all released drops)
  const dropById = new Map(drops.map((d) => [d.id, d]));

  // Only drops that actually have linked products are meaningful to analyse.
  // (Some released drops have had their products' drop_id cleared.)
  const dropsWithItems = new Set(
    products.filter((p) => p.drop_id != null).map((p) => p.drop_id as number)
  );
  const analysableDrops = drops.filter((d) => dropsWithItems.has(d.id));
  const releasedDropIds = new Set(analysableDrops.map((d) => d.id));

  const scopedProducts = products.filter((p) => {
    if (!p.drop_id || !releasedDropIds.has(p.drop_id)) return false;
    if (selectedDropId !== "all" && p.drop_id !== selectedDropId) return false;
    return true;
  });

  // Determine if a product sold within the window of ITS drop's release
  function soldWithinWindow(p: Product): boolean {
    const drop = p.drop_id ? dropById.get(p.drop_id) : null;
    if (!drop?.released_at) return false;
    const saleTime = saleMap.get(p.id);
    if (saleTime === undefined) return false;
    const releaseTime = new Date(drop.released_at).getTime();
    return saleTime <= releaseTime + windowHours * 3600 * 1000;
  }

  // Sold at all — either a paid order exists, or it was marked SOLD manually.
  function soldEver(p: Product): boolean {
    return saleMap.get(p.id) !== undefined || p.tag === "SOLD";
  }

  // ── Aggregate metrics for scoped selection ──────────────────
  const totalItems = scopedProducts.length;
  const soldInWindow = scopedProducts.filter(soldWithinWindow).length;
  const soldTotal = scopedProducts.filter(soldEver).length;
  const sellThroughPct = totalItems > 0 ? Math.round((soldInWindow / totalItems) * 100) : 0;
  const revenue = scopedProducts.filter(soldEver).reduce((sum, p) => sum + p.price, 0);

  // Category velocity: avg hours from release to sale, per category (sold items only)
  const catAgg = new Map<string, { totalHours: number; count: number; sold: number; total: number }>();
  for (const p of scopedProducts) {
    const cur = catAgg.get(p.category) ?? { totalHours: 0, count: 0, sold: 0, total: 0 };
    cur.total++;
    const drop = p.drop_id ? dropById.get(p.drop_id) : null;
    const saleTime = saleMap.get(p.id);
    if (drop?.released_at && saleTime !== undefined) {
      const hours = (saleTime - new Date(drop.released_at).getTime()) / 3600000;
      if (hours >= 0) { cur.totalHours += hours; cur.count++; cur.sold++; }
    }
    catAgg.set(p.category, cur);
  }
  const categoryVelocity = [...catAgg.entries()]
    .map(([category, v]) => ({
      category,
      avgHours: v.count > 0 ? v.totalHours / v.count : null,
      sold: v.sold,
      total: v.total,
    }))
    .sort((a, b) => {
      if (a.avgHours === null) return 1;
      if (b.avgHours === null) return -1;
      return a.avgHours - b.avgHours;
    });

  // Item velocity: every scoped product with its time-to-sell (or lingering)
  const itemVelocity = scopedProducts
    .map((p) => {
      const drop = p.drop_id ? dropById.get(p.drop_id) : null;
      const saleTime = saleMap.get(p.id);
      const hours = drop?.released_at && saleTime !== undefined
        ? (saleTime - new Date(drop.released_at).getTime()) / 3600000
        : null;
      return { name: p.name, category: p.subcategory, price: p.price, hours };
    })
    .sort((a, b) => {
      if (a.hours === null && b.hours === null) return 0;
      if (a.hours === null) return 1;
      if (b.hours === null) return -1;
      return a.hours - b.hours;
    });

  function fmtDuration(hours: number): string {
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
    if (hours < 48) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Analytics</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectedDrop = selectedDropId !== "all" ? dropById.get(selectedDropId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Drop Performance</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Drop</label>
          <select
            value={selectedDropId}
            onChange={(e) => setSelectedDropId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a6b2f]"
          >
            <option value="all">All released drops</option>
            {analysableDrops.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || `Drop #${d.id}`} — {d.released_at ? new Date(d.released_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Sell-through window</label>
          <select
            value={windowHours}
            onChange={(e) => setWindowHours(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a6b2f]"
          >
            {WINDOWS.map((w) => <option key={w.hours} value={w.hours}>{w.label}</option>)}
          </select>
        </div>
      </div>

      {selectedDrop?.released_at && (
        <p className="text-xs text-gray-400">
          Released {new Date(selectedDrop.released_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {/* Headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={`Sell-through (${WINDOWS.find((w) => w.hours === windowHours)?.label})`}
          value={`${sellThroughPct}%`}
          sub={`${soldInWindow} of ${totalItems} sold in window`}
          color="text-[#1a6b2f]"
        />
        <MetricCard
          label="Sold overall"
          value={`${soldTotal} / ${totalItems}`}
          sub={totalItems > 0 ? `${Math.round((soldTotal / totalItems) * 100)}% all-time` : "—"}
          color="text-[#1a1a1a]"
        />
        <MetricCard
          label="Revenue"
          value={`₦${revenue.toLocaleString()}`}
          sub="From items sold"
          color="text-[#1a6b2f]"
        />
        <MetricCard
          label="Items in scope"
          value={`${totalItems}`}
          sub={selectedDropId === "all" ? "Across all drops" : "This drop"}
          color="text-[#1a1a1a]"
        />
      </div>
      <p className="text-[11px] text-gray-400 -mt-2">
        Sell timing is based on when the order was placed. Figures are directional, not to-the-second.
      </p>

      {/* Category velocity */}
      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-sm text-[#1a1a1a]">Which categories move fastest</h2>
        </div>
        {categoryVelocity.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No data for this selection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-2.5 text-left">Category</th>
                  <th className="px-5 py-2.5 text-left">Avg time to sell</th>
                  <th className="px-5 py-2.5 text-right">Sold / Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categoryVelocity.map((c) => (
                  <tr key={c.category} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium">{c.category}</td>
                    <td className="px-5 py-3 text-gray-600">{c.avgHours === null ? "— (none sold)" : fmtDuration(c.avgHours)}</td>
                    <td className="px-5 py-3 text-right">{c.sold} / {c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Item velocity */}
      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-sm text-[#1a1a1a]">Item velocity — what flew vs. what's lingering</h2>
        </div>
        {itemVelocity.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No items for this selection.</p>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                <tr>
                  <th className="px-5 py-2.5 text-left">Item</th>
                  <th className="px-5 py-2.5 text-left">Type</th>
                  <th className="px-5 py-2.5 text-right">Price</th>
                  <th className="px-5 py-2.5 text-right">Time to sell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itemVelocity.map((it, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium max-w-[220px] truncate">{it.name}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{it.category}</td>
                    <td className="px-5 py-3 text-right text-gray-600">₦{it.price.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      {it.hours === null
                        ? <span className="text-gray-400">Unsold</span>
                        : <span className={it.hours <= 1 ? "text-[#1a6b2f] font-semibold" : "text-gray-700"}>{fmtDuration(it.hours)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Return customers + Demand side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-[#1a1a1a] mb-1">Return customers</h2>
          <p className="text-[11px] text-gray-400 mb-4">
            Estimate — guests are matched by phone/email, so some repeats may be missed.
          </p>
          {returnStats && returnStats.total > 0 ? (
            <div className="flex items-end gap-6">
              <div>
                <p className="text-3xl font-bold text-[#1a6b2f]">
                  {Math.round((returnStats.repeat / returnStats.total) * 100)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">repeat buyers</p>
              </div>
              <div className="text-sm text-gray-600 pb-1">
                <p>{returnStats.repeat} returning</p>
                <p>{returnStats.total - returnStats.repeat} one-time</p>
                <p className="text-gray-400 text-xs mt-1">{returnStats.total} total buyers</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Not enough data yet.</p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-[#1a1a1a] mb-1">Unfulfilled demand</h2>
          <p className="text-[11px] text-gray-400 mb-4">
            Top wishlist keywords customers are watching for — a sourcing signal.
          </p>
          {demand.length === 0 ? (
            <p className="text-sm text-gray-400">No wishlist signals yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {demand.map((d) => (
                <span key={d.keyword} className="inline-flex items-center gap-1.5 bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-full px-3 py-1 text-xs">
                  <span className="text-[#1a1a1a] font-medium">{d.keyword}</span>
                  <span className="text-[#1a6b2f] font-bold">{d.count}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <p className="text-[11px] text-gray-400">
        Note: real-time site traffic and concurrent visitors are tracked in your Vercel Analytics dashboard, not here.
      </p>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
