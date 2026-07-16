"use client";

import { useState } from "react";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!orderId.trim()) { setError("Enter your Order ID"); return; }

    setLoading(true);
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("orders")
      .select("order_id, status, created_at, delivery_address, is_stockpile, stockpiled_until")
      .eq("order_id", orderId.trim().toUpperCase())
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError("Order not found. Check the ID and try again.");
      return;
    }
    setOrder(data);
  }

  const statusSteps = ["processing", "stockpiled", "shipped", "delivered"];

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-4">Order Tracking</h1>
        <p className="text-gray-500 text-sm mb-8">Enter your Order ID (e.g. TC-A1B2C3) to check the status.</p>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <input
            type="text"
            value={orderId}
            onChange={(e) => { setOrderId(e.target.value); setError(""); }}
            placeholder="TC-XXXXXX"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-[#1a6b2f]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-60"
          >
            {loading ? "Checking…" : "Track"}
          </button>
        </form>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-lg">{order.order_id}</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                order.status === "delivered" ? "bg-green-100 text-green-700" :
                order.status === "shipped" ? "bg-purple-100 text-purple-700" :
                order.status === "processing" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>{order.status}</span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-1">
              {statusSteps.map((step, i) => {
                const currentIdx = statusSteps.indexOf(order.status);
                const isActive = i <= currentIdx;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-1.5 w-full rounded-full ${isActive ? "bg-[#1a6b2f]" : "bg-gray-200"}`} />
                    <span className={`text-[10px] capitalize ${isActive ? "text-[#1a6b2f] font-semibold" : "text-gray-400"}`}>{step}</span>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-gray-600 space-y-1 pt-2">
              <p><span className="text-gray-400">Placed:</span> {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p><span className="text-gray-400">Delivery to:</span> {order.delivery_address}</p>
              {order.is_stockpile && order.stockpiled_until && (
                <p className="text-blue-600">Stockpiled until {new Date(order.stockpiled_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
