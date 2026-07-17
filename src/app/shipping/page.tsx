"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type Zone = {
  zone_name: string;
  region: string;
  price_min: number;
  price_max: number | null;
  delivery_days: string;
  notes: string | null;
};

export default function ShippingPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("shipping_zones")
      .select("zone_name, region, price_min, price_max, delivery_days, notes")
      .eq("active", true)
      .order("region")
      .order("price_min")
      .then(({ data }) => {
        if (data) setZones(data as any);
        setLoading(false);
      });
  }, []);

  const abujaZones = zones.filter((z) => z.region === "Abuja");
  const lagosZones = zones.filter((z) => z.region === "Lagos");
  const otherZones = zones.filter((z) => z.region === "Other States");

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Shipping Info</h1>

        <div className="space-y-8 text-gray-700">
          {/* Overview */}
          <div className="bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-xl p-4 text-sm text-[#1a6b2f]">
            <strong>Free delivery</strong> on single orders above ₦60,000. Does not apply to stockpiled purchases that accumulate to this figure.
          </div>

          {/* Abuja */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Delivery in Abuja</h2>
            <p className="text-sm text-gray-500 mb-3">Same day – 1 business day</p>
            {loading ? (
              <p className="text-sm text-gray-400">Loading zones…</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Area</th>
                      <th className="px-4 py-2.5 text-right">Cost</th>
                      <th className="px-4 py-2.5 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {abujaZones.map((z) => (
                      <tr key={z.zone_name} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-medium">{z.zone_name}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          ₦{z.price_min.toLocaleString()}{z.price_max ? `–₦${z.price_max.toLocaleString()}` : ""}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{z.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Outside Abuja */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Delivery outside Abuja</h2>
            <p className="text-sm text-gray-500 mb-3">2–4 business days. Park delivery (Kaduna, Jos, Bauchi, Kano, Adamawa, Calabar, Osun, Ekiti, etc). For other states, customer can pick up at nearest GUO station or request home delivery from GUO.</p>
            {!loading && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Destination</th>
                      <th className="px-4 py-2.5 text-right">Cost</th>
                      <th className="px-4 py-2.5 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...lagosZones, ...otherZones].map((z) => (
                      <tr key={z.zone_name} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-medium">{z.zone_name}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          ₦{z.price_min.toLocaleString()}{z.price_max ? `–₦${z.price_max.toLocaleString()}` : ""}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{z.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* International */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">International Shipping</h2>
            <p className="text-sm">
              Yes, we ship outside Nigeria. Reach out via{" "}
              <a href="https://wa.me/2348061979299" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-semibold hover:underline">WhatsApp</a>
              {" "}or{" "}
              <a href="https://www.instagram.com/thriftcollision/" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-semibold hover:underline">Instagram DM</a>
              {" "}for a quote.
            </p>
          </section>

          {/* Stockpile */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Stockpile Option</h2>
            <p className="text-sm">
              Buy now, receive later. We hold your items for up to 30 days at no extra cost. When you&apos;re ready, let us know and we&apos;ll ship with the standard delivery fee. Note: free delivery does not apply to stockpiled orders.
            </p>
          </section>

          {/* Pickup */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Pickup</h2>
            <p className="text-sm">
              We don&apos;t have a physical store, but customers can pick up in <strong>Gwarinpa, Abuja</strong> for free. Message us to arrange a pickup time.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
