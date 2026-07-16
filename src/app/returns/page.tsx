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
            <p>You must reach out <strong>within 24 hours</strong> of receiving your order to initiate a return.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Abuja customers:</strong> Return must be completed within 24 hours of delivery.</li>
              <li><strong>Outside Abuja:</strong> Contact us within 24 hours of receiving your item so we can process the return immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">How to Return</h2>
            <p>Contact us through any of these channels with your Order ID and reason for return:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>WhatsApp:</strong>{" "}
                <a href="https://wa.me/2348061979299" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-semibold hover:underline">Chat with us</a>
              </li>
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:gradedthriftshop@gmail.com" className="text-[#1a6b2f] font-semibold hover:underline">gradedthriftshop@gmail.com</a>
              </li>
              <li>
                <strong>Instagram:</strong>{" "}
                <a href="https://www.instagram.com/thriftcollision/" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-semibold hover:underline">@thriftcollision</a>
              </li>
            </ul>
            <p className="mt-3">Once confirmed, we&apos;ll provide return instructions. After we receive and inspect the item, we&apos;ll issue store credit or a refund within 3–5 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Conditions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Items must be in original condition — unworn, unwashed, and with tags attached where applicable.</li>
              <li>Return shipping is on the buyer.</li>
            </ul>
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
