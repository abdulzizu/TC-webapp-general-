"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  phone: string;
  email: string | null;
  verified: boolean;
  created_at: string;
};

export default function AdminLeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showNotify, setShowNotify] = useState(false);
  const [subject, setSubject] = useState("New drop dropping in 30 minutes 🔥");
  const [message, setMessage] = useState("A fresh batch of curated streetwear is about to go live on Thrift Collision.\n\nBe there early — stock moves fast and these are all one-of-one pieces.\n\nSee you in 30.");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const perPage = 15;

  const loadLeads = useCallback(async () => {
    const { data } = await supabase.from("temp_leads").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function handleSendNotification() {
    setSending(true);
    setSendResult("");

    const res = await fetch("/api/admin/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setSendResult(`Sent to ${data.sent} of ${data.total} leads`);
    } else {
      setSendResult(`Error: ${data.error}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this lead?")) return;
    const { error } = await supabase.from("temp_leads").delete().eq("id", id);
    if (error) { alert("Failed to remove: " + error.message); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  const emailLeads = leads.filter((l) => l.email);
  const paginated = leads.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(leads.length / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Drop Notification Leads ({leads.length})</h1>
          <p className="text-sm text-gray-500 mt-0.5">{emailLeads.length} with email addresses (can receive notifications)</p>
        </div>
        <button
          onClick={() => setShowNotify(!showNotify)}
          className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition"
        >
          📢 Send Drop Alert
        </button>
      </div>

      {/* Notification composer */}
      {showNotify && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-bold text-sm">Compose Drop Notification</h2>
          <p className="text-xs text-gray-400">This will email all leads who provided an email address ({emailLeads.length} people).</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendNotification}
              disabled={sending || emailLeads.length === 0}
              className="px-5 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50"
            >
              {sending ? "Sending…" : `Send to ${emailLeads.length} leads`}
            </button>
            <button onClick={() => setShowNotify(false)} className="text-xs text-gray-400 hover:text-gray-700">Cancel</button>
          </div>

          {sendResult && (
            <p className={`text-sm font-semibold ${sendResult.startsWith("Error") ? "text-red-500" : "text-[#1a6b2f]"}`}>
              {sendResult}
            </p>
          )}
        </div>
      )}

      {/* Leads list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-gray-400">No leads yet.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left w-10">#</th>
                    <th className="px-4 py-2.5 text-left">Phone</th>
                    <th className="px-4 py-2.5 text-left">Email</th>
                    <th className="px-4 py-2.5 text-left">Signed up</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((lead, i) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-bold">{(page - 1) * perPage + i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{lead.phone}</td>
                      <td className="px-4 py-2.5 text-gray-500">{lead.email || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">
                        {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => handleDelete(lead.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, leads.length)} of {leads.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:border-[#1a6b2f] disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-[#1a6b2f]">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:border-[#1a6b2f] disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
