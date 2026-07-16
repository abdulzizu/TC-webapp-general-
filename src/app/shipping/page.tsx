"use client";

import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

export default function ShippingPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Shipping Info</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Delivery Areas</h2>
            <p>We currently deliver across Nigeria. Shipping times vary by location:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Lagos:</strong> 1–3 business days</li>
              <li><strong>Abuja, Port Harcourt, Ibadan:</strong> 3–5 business days</li>
              <li><strong>Other states:</strong> 5–7 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Shipping Costs</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Standard delivery:</strong> ₦3,500</li>
              <li><strong>Express delivery:</strong> ₦5,500</li>
              <li><strong>Free delivery</strong> on orders above ₦55,000</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Stockpile Option</h2>
            <p>
              Want to buy now but receive later? Use our stockpile option at checkout — we hold your items for up to 30 days at no extra cost. When you&apos;re ready, just let us know and we&apos;ll ship with the standard delivery fee.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Tracking</h2>
            <p>
              Once your order ships, you&apos;ll receive an SMS with tracking information. You can also check your order status on your <Link href="/profile" className="text-[#1a6b2f] font-semibold hover:underline">profile page</Link>.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
