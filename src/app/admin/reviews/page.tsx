"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  order_id: string;
  first_name: string;
  comment: string;
  photo: string | null;
  status: string;
  featured: boolean;
  created_at: string;
};

export default function AdminReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data) setReviews(data as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  async function setStatus(id: string, status: string) {
    setUpdating(id);
    await supabase.from("reviews").update({ status }).eq("id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    setUpdating(null);
  }

  async function toggleFeatured(id: string, featured: boolean) {
    setUpdating(id);
    await supabase.from("reviews").update({ featured }).eq("id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, featured } : r));
    setUpdating(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const counts = {
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1a1a1a]">Reviews</h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition capitalize ${
              filter === f ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"
            }`}
          >
            {f} {f !== "all" ? `(${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No {filter !== "all" ? filter : ""} reviews.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {r.photo ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    <img src={r.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1a6b2f]/10 flex items-center justify-center text-[#1a6b2f] font-bold shrink-0">
                    {r.first_name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1a1a1a]">{r.first_name}</span>
                    <span className="text-[10px] font-mono text-gray-400">{r.order_id}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "approved" ? "bg-green-100 text-green-700" :
                      r.status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>{r.status}</span>
                    {r.featured && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">★ Featured</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.status !== "approved" && (
                      <button onClick={() => setStatus(r.id, "approved")} disabled={updating === r.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1a6b2f] text-white hover:bg-[#104020] transition disabled:opacity-50">Approve</button>
                    )}
                    {r.status !== "rejected" && (
                      <button onClick={() => setStatus(r.id, "rejected")} disabled={updating === r.id} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-500 transition disabled:opacity-50">Reject</button>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => toggleFeatured(r.id, !r.featured)} disabled={updating === r.id} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition disabled:opacity-50 ${r.featured ? "border-purple-400 text-purple-600 bg-purple-50" : "border-gray-200 text-gray-600 hover:border-purple-400"}`}>
                        {r.featured ? "★ Featured on homepage" : "Feature on homepage"}
                      </button>
                    )}
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1.5">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
