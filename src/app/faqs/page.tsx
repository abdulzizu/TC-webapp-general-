"use client";

import { useState } from "react";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

const FAQS = [
  {
    q: "Are these items really thrifted?",
    a: "Yes — every piece is sourced from thrift markets, vintage stores, and clearance collections. We hand-pick, clean, and authenticate each item before listing.",
  },
  {
    q: "Why is each item one-of-one?",
    a: "Because thrifted items are unique by nature. We don't stock multiples of the same piece. Once it's gone, it's gone.",
  },
  {
    q: "How do drops work?",
    a: "We drop new collections just about weekly — Fridays through Mondays. Sign up for email notifications to be first in line. Stock sells out fast.",
  },
  {
    q: "What if the item doesn't fit?",
    a: "Check the size guide on each product page. If it still doesn't work, you must reach out within 24 hours of receiving your order to initiate a return. See our Returns Policy for details.",
  },
  {
    q: "Do you ship outside Nigeria?",
    a: "Yes! Reach out via WhatsApp or Instagram DM for an international shipping quote.",
  },
  {
    q: "How do I pay?",
    a: "We accept bank transfers and card payments at checkout. Pay-on-delivery is not available at this time.",
  },
  {
    q: "What's the stockpile option?",
    a: "It lets you buy now and receive later — we hold your items for up to 30 days. Useful if you're saving up for a bigger haul or want to combine shipping.",
  },
  {
    q: "Can I return an item?",
    a: "Yes — just reach out to us as soon as you receive it. We want returns initiated same day if possible. Contact us via WhatsApp, email (help@thriftcollision.com), or Instagram DM with your Order ID.",
  },
  {
    q: "How do I track my order?",
    a: "Once shipped, you'll get a WhatsApp message with tracking info. You can also check your order status on the Order Tracking page or your profile.",
  },
];

export default function FaqsPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Frequently Asked Questions</h1>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition"
              >
                <span className="font-semibold text-sm text-[#1a1a1a] pr-4">{faq.q}</span>
                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
