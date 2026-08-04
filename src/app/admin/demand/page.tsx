"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";

type KeywordDemand = {
  keyword: string;
  count: number;
  users: { email: string; name: string }[];
};

export default function AdminDemandPage() {
  const supabase = createClient();
  const [demands, setDemands] = useState<KeywordDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadDemand = useCallback(async () => {
    setLoading(true);

    // Get all keywords with user info
    const { data: keywords } = await supabase
      .from("keywords")
      .select("keyword, user_id");

    if (!keywords || keywords.length === 0) {
      setDemands([]);
      setTotalUsers(0);
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(keywords.map((k) => k.user_id))];
    setTotalUsers(userIds.length);

    // Get user profiles for names/emails
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profileMap = new Map<string, { name: string; email: string }>();
    (profiles || []).forEach((p: any) => {
      profileMap.set(p.id, { name: p.name || "Anonymous", email: p.email || "" });
    });

    // Aggregate keywords
    const keywordMap = new Map<string, { count: number; users: { email: string; name: string }[] }>();
    keywords.forEach((k) => {
      const normalized = k.keyword.toLowerCase().trim();
      if (!keywordMap.has(normalized)) {
        keywordMap.set(normalized, { count: 0, users: [] });
      }
      const entry = keywordMap.get(normalized)!;
      entry.count++;
      const profile = profileMap.get(k.user_id);
      if (profile) {
        entry.users.push(profile);
      }
    });

    // Sort by demand (count descending)
    const sorted = Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.count - a.count);

    setDemands(sorted);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadDemand();
  }, [loadDemand]);

  const filtered = search
    ? demands.filter((d) => d.keyword.includes(search.toLowerCase()))
    : demands;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Demand Insights</h1>
          <p className="text-sm text-gray-400 mt-1">What your customers are looking for — ranked by number of requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 bg-[#1a6b2f]/10 rounded-xl">
            <p className="text-lg font-bold text-[#1a6b2f]">{totalUsers}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Users with wishlists</p>
          </div>
          <div className="text-center px-4 py-2 bg-[#1a6b2f]/10 rounded-xl">
            <p className="text-lg font-bold text-[#1a6b2f]">{demands.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Unique keywords</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search keywords…"
        className="w-full sm:w-72 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
      />

      {loading ? (
        <div className="text-sm text-gray-400">Loading demand data…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-sm">
            {demands.length === 0
              ? "No wishlist keywords yet. As users add items to their wishlist, demand data will appear here."
              : "No keywords match your search."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left w-8">#</th>
                  <th className="px-4 py-2.5 text-left">Keyword</th>
                  <th className="px-4 py-2.5 text-center">Requests</th>
                  <th className="px-4 py-2.5 text-left">Demand</th>
                  <th className="px-4 py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item, i) => {
                  const maxCount = filtered[0]?.count || 1;
                  const barWidth = Math.max(8, (item.count / maxCount) * 100);
                  const isExpanded = expanded === item.keyword;

                  return (
                    <Fragment key={item.keyword}>
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#1a1a1a] capitalize">{item.keyword}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1a6b2f]/10 text-[#1a6b2f] font-bold text-sm">
                            {item.count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#1a6b2f] h-2 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : item.keyword)}
                            className="text-xs text-[#1a6b2f] hover:underline font-semibold"
                          >
                            {isExpanded ? "Hide" : `${item.count} user${item.count > 1 ? "s" : ""}`}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="space-y-1.5">
                              {item.users.map((u, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="w-5 h-5 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center text-[10px] font-bold text-[#1a6b2f]">
                                    {(u.name || "?")[0].toUpperCase()}
                                  </span>
                                  <span>{u.name || "Anonymous"}</span>
                                  {u.email && <span className="text-gray-400">({u.email})</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sourcing tips */}
      {demands.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">💡 Sourcing tip</p>
          <p className="text-xs text-amber-700">
            Top requested items represent unmet demand. Prioritise sourcing these for your next drop — 
            users will be automatically notified via email when matching items go live.
          </p>
        </div>
      )}
    </div>
  );
}
