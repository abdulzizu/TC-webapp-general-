"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

function ReviewContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [orderId, setOrderId] = useState(searchParams.get("order") || "");
  const [firstName, setFirstName] = useState("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!orderId.trim()) { setError("Please enter your order ID"); return; }
    if (!firstName.trim()) { setError("Please enter your first name"); return; }
    if (comment.trim().length < 10) { setError("Please write a bit more about your experience"); return; }

    setSubmitting(true);

    // Verify order exists
    const { data: order } = await supabase
      .from("orders")
      .select("order_id, status")
      .eq("order_id", orderId.trim().toUpperCase())
      .single();

    if (!order) {
      setError("We couldn't find that order ID. Please check and try again.");
      setSubmitting(false);
      return;
    }

    // Save review as pending
    const { error: insertError } = await supabase.from("reviews").insert({
      order_id: orderId.trim().toUpperCase(),
      first_name: firstName.trim(),
      comment: comment.trim(),
      photo: photo || null,
      status: "pending",
      featured: false,
    });

    setSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setDone(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file);
      if (upErr) { setError("Photo upload failed"); return; }
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      setPhoto(publicUrl);
    } catch {
      setError("Photo upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (done) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Thank you! 🙏</h1>
        <p className="text-gray-500 mb-8">
          Your review has been submitted. We&apos;ll review it and it&apos;ll appear on our site soon.
        </p>
        <Link href="/shop" className="btn-tc-primary px-8 py-3.5 rounded-full text-sm inline-block">
          Keep Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Leave a review</h1>
      <p className="text-gray-500 text-sm mb-8">
        Shopped with us? Tell others about your experience. Your words help the community.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="orderId" className="block text-xs font-semibold text-gray-600 mb-1">Order ID *</label>
          <input
            id="orderId"
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="TC-XXXXXX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-[#1a6b2f]"
          />
        </div>

        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Abdul"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a6b2f]"
          />
        </div>

        <div>
          <label htmlFor="comment" className="block text-xs font-semibold text-gray-600 mb-1">Your Review *</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="How was your experience? Quality, delivery, anything you'd tell a friend."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a6b2f] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Photo (optional)</label>
          <p className="text-[11px] text-gray-400 mb-2">Add a selfie or fit pic — or skip it and we&apos;ll use your initial.</p>
          {photo && (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mb-2">
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <label className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-xs font-semibold transition ${uploading ? "opacity-50" : "cursor-pointer hover:bg-gray-200"}`}>
            {uploading ? "Uploading…" : photo ? "Change photo" : "Add photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>

        {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading…</div>}>
        <ReviewContent />
      </Suspense>
    </>
  );
}
