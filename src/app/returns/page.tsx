"use client";

import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

export default function ReturnsPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Returns Policy</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Return Window</h2>
            <p>Items can be returned within <strong>7 days</strong> of delivery, provided they are in their original condition — unworn, unwashed, and with tags still attached where applicable.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">How to Return</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Contact us via SMS or email with your Order ID and reason for return.</li>
              <li>We&apos;ll confirm eligibility and provide return instructions.</li>
              <li>Ship the item back to us (return shipping is on the buyer).</li>
              <li>Once we receive and inspect the item, we&apos;ll issue store credit or a refund within 3–5 business days.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Non-Returnable Items</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Items marked as &quot;Final Sale&quot;</li>
              <li>Socks and undergarments</li>
              <li>Items that have been worn, washed, or altered</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Exchanges</h2>
            <p>Since each piece is one-of-one, exchanges depend on availability. If you&apos;d like a different item, we&apos;ll issue store credit that you can use on any future purchase.</p>
          </section>
        </div>
      </main>
    </>
  );
}
