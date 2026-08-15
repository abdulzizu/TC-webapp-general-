"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type StockRow = {
  subcategory: string;
  available: number;
  unreleased: number;
  soldOut: number;
  total: number;
};

export default function AdminStockPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ available: 0, unreleased: 0, soldOut: 0, total: 0 });

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("subcategory, available, tag");
    if (!data) { setLoading(false); return; }

    const map = new Map<string, { available: number; unreleased: number; soldOut: number; total: number }>();

    data.forEach((p: any) => {
      const sub = p.subcategory || "Uncategorized";
      if (!map.has(sub)) map.set(sub, { available: 0, unreleased: 0, soldOut: 0, total: 0 });
      const row = map.get(sub)!;
      row.total++;
      if (p.tag === "SOLD OUT") {
        row.soldOut++;
      } else if (p.available) {
        row.available++;
      } else {
        row.unreleased++;
      }
    });

    const sorted = Array.from(map.entries())
      .map(([subcategory, counts]) => ({ subcategory, ...counts }))
      .sort((a, b) => b.total - a.total);

    setRows(sorted);
    setTotals(sorted.reduce((acc, r) => ({
      available: acc.available + r.available,
      unreleased: acc.unreleased + r.unreleased,
      soldOut: acc.soldOut + r.soldOut,
      total: acc.total + r.total,
    }), { available: 0, unreleased: 0, soldOut: 0, total: 0 }));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">Stock Levels</h1>
        <p className="text-sm text-gray-400 mt-1">Inventory breakdown by subcategory.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a6b2f]">{totals.available}</p>
          <p className="text-xs text-gray-500 mt-1">Available on store</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totals.unreleased}</p>
          <p className="text-xs text-gray-500 mt-1">Hidden / Unreleased</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{totals.soldOut}</p>
          <p className="text-xs text-gray-500 mt-1">Sold Out</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]">{totals.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Products</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Subcategory</th>
                  <th className="px-4 py-2.5 text-center">Available</th>
                  <th className="px-4 py-2.5 text-center">Unreleased</th>
                  <th className="px-4 py-2.5 text-center">Sold Out</th>
                  <th className="px-4 py-2.5 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.subcategory} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{row.subcategory}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1a6b2f]/10 text-[#1a6b2f] font-bold text-xs">{row.available}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-600 font-bold text-xs">{row.unreleased}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-500 font-bold text-xs">{row.soldOut}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{row.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 text-xs font-bold uppercase">
                <tr>
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 text-center text-[#1a6b2f]">{totals.available}</td>
                  <td className="px-4 py-2.5 text-center text-amber-600">{totals.unreleased}</td>
                  <td className="px-4 py-2.5 text-center text-red-500">{totals.soldOut}</td>
                  <td className="px-4 py-2.5 text-center">{totals.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
