"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Drop = {
  id: number;
  title: string;
  subtitle: string;
  timing: string;
  emoji: string;
  display_order: number;
  active: boolean;
};

type ScheduledDrop = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  scheduled_at: string | null;
  released_at: string | null;
  created_at: string;
  product_count?: number;
};

export default function AdminDropsPage() {
  const supabase = createClient();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [scheduledDrops, setScheduledDrops] = useState<ScheduledDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Drop | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", timing: "", emoji: "🔥", display_order: 1, active: true });
  const [saving, setSaving] = useState(false);

  const loadDrops = useCallback(async () => {
    const { data } = await supabase.from("upcoming_drops").select("*").order("display_order");
    if (data) setDrops(data as any);

    // Load scheduled/draft drops
    const { data: scheduled } = await supabase
      .from("drops")
      .select("*")
      .in("status", ["draft", "scheduled"])
      .order("created_at", { ascending: false });

    if (scheduled) {
      // Get product counts for each drop
      const withCounts = await Promise.all(
        scheduled.map(async (d: any) => {
          const { count } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("drop_id", d.id);
          return { ...d, product_count: count ?? 0 };
        })
      );
      setScheduledDrops(withCounts);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadDrops(); }, [loadDrops]);

  function startCreate() {
    setForm({ title: "", subtitle: "", timing: "", emoji: "🔥", display_order: drops.length + 1, active: true });
    setCreating(true);
    setEditing(null);
  }

  function startEdit(d: Drop) {
    setForm({ title: d.title, subtitle: d.subtitle, timing: d.timing, emoji: d.emoji, display_order: d.display_order, active: d.active });
    setEditing(d);
    setCreating(false);
  }

  function cancel() { setEditing(null); setCreating(false); }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form };
    if (creating) {
      await supabase.from("upcoming_drops").insert(payload);
    } else if (editing) {
      await supabase.from("upcoming_drops").update(payload).eq("id", editing.id);
    }
    setSaving(false);
    cancel();
    loadDrops();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this drop?")) return;
    await supabase.from("upcoming_drops").delete().eq("id", id);
    loadDrops();
  }

  if (creating || editing) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{creating ? "Add Drop" : "Edit Drop"}</h1>
          <button onClick={cancel} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. Soja, not soldier" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subtitle</label>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. Camo capsule drop" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Timing</label>
              <input value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="Coming soon" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Emoji</label>
              <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#1a6b2f]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order</label>
              <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={1} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[#1a6b2f]" />
            Active (shown on website)
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.title} className="px-5 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
            {saving ? "Saving…" : creating ? "Add Drop" : "Save"}
          </button>
          <button onClick={cancel} className="px-5 py-2 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 transition">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Scheduled Drops Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Drop Queue</h2>
            <p className="text-sm text-gray-500 mt-0.5">Plan drops ahead of time. Add products, set a date, release when ready.</p>
          </div>
          <Link href="/admin/drops/new" className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">
            🚀 Start New Drop
          </Link>
        </div>

        {scheduledDrops.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">No queued drops. Start one to plan your next release.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledDrops.map((drop) => (
              <div key={drop.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-8 rounded-full ${drop.status === "scheduled" ? "bg-blue-500" : "bg-gray-300"}`} />
                  <div>
                    <p className="font-semibold text-sm text-[#1a1a1a]">{drop.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        drop.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}>{drop.status}</span>
                      <span className="text-xs text-gray-400">{drop.product_count} products</span>
                      {drop.scheduled_at && (
                        <span className="text-xs text-gray-400">
                          · {new Date(drop.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/drops/new?edit=${drop.id}`}
                  className="text-xs text-[#1a6b2f] font-semibold hover:underline"
                >
                  Edit / Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Drops Announcements (navbar) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Drop Announcements (Navbar)</h1>
            <p className="text-sm text-gray-500 mt-1">Manage the drops shown in the navbar dropdown. Changes appear on the website instantly.</p>
          </div>
          <button onClick={startCreate} className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">+ Add Announcement</button>
        </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : drops.length === 0 ? (
        <p className="text-sm text-gray-400">No upcoming drops. Add one to show in the menu.</p>
      ) : (
        <div className="space-y-3">
          {drops.map((drop) => (
            <div key={drop.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{drop.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-[#1a1a1a]">{drop.title}</p>
                  <p className="text-xs text-gray-500">{drop.subtitle}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide bg-[#1a6b2f]/10 text-[#1a6b2f] px-2 py-0.5 rounded-full">
                    {drop.timing}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!drop.active && <span className="text-xs text-gray-400">Hidden</span>}
                <button onClick={() => startEdit(drop)} className="text-xs text-[#1a6b2f] hover:underline font-semibold">Edit</button>
                <button onClick={() => handleDelete(drop.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
