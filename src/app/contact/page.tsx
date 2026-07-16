"use client";

import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Contact Us</h1>

        <div className="space-y-6 text-gray-700">
          <p className="text-base">Got a question, need help with an order, or just want to chat? Reach out — we&apos;re here for you.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Phone / SMS</p>
              <a href="tel:+2348061979299" className="text-[#1a6b2f] font-bold text-lg hover:underline">0806 197 9299</a>
              <p className="text-xs text-gray-400 mt-1">Mon–Sat, 9am–6pm WAT</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Instagram</p>
              <a href="https://www.instagram.com/thriftcollision/" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-bold text-lg hover:underline">@thriftcollision</a>
              <p className="text-xs text-gray-400 mt-1">DMs open — we reply fast</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Email</p>
              <a href="mailto:hello@thriftcollision.com" className="text-[#1a6b2f] font-bold hover:underline">hello@thriftcollision.com</a>
              <p className="text-xs text-gray-400 mt-1">We respond within 24 hours</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">WhatsApp</p>
              <a href="https://wa.me/2348061979299" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-bold hover:underline">Chat on WhatsApp</a>
              <p className="text-xs text-gray-400 mt-1">Quick questions and order updates</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
