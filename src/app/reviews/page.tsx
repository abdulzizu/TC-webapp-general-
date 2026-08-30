"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  first_name: string;
  comment: string;
  photo: string | null;
  created_at: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reviews")
      .select("id, first_name, comment, photo, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data as any);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <span className="text-xs font-700 tracking-widest uppercase text-[#1a6b2f] mb-2 block">
            From the community
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">What people are saying</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 text-sm">Loading…</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4" aria-hidden="true">💬</p>
            <p className="text-lg font-semibold text-[#1a1a1a] mb-2">Reviews are rolling in</p>
            <p className="text-gray-500 text-sm mb-6">
              Check back soon — or if you&apos;ve shopped with us, be the first to leave one.
            </p>
            <Link href="/review" className="btn-tc-primary px-6 py-3 rounded-full text-sm inline-block">
              Leave a review
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {r.photo ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        <img src={r.photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#1a6b2f]/10 flex items-center justify-center text-[#1a6b2f] font-bold shrink-0">
                        {r.first_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#1a1a1a] text-sm">{r.first_name}</p>
                      <p className="text-[10px] text-[#1a6b2f] font-semibold">✓ Verified purchase</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <p className="text-sm text-gray-500 mb-3">Shopped with us?</p>
              <Link href="/review" className="btn-tc-outline px-6 py-3 rounded-full text-sm inline-block">
                Leave a review
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
