"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Zone = {
  id: number;
  zone_name: string;
  region: string;
  price_min: number;
  price_max: number | null;
  delivery_days: string;
  notes: string | null;
  active: boolean;
};

const REGIONS = ["Abuja", "Lagos", "Other States"];

export default function AdminShippingPage() {
  const supabase = createClient();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ zone_name: "", region: "Abuja", price_min: 0, price_max: "", delivery_days: "1–2 business days", notes: "", active: true });
  const [saving, setSaving] = useState(false);

  const loadZones = useCallback(async () => {
    const { data } = await supabase.from("shipping_zones").select("*").order("region").order("zone_name");
    if (data) setZones(data as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadZones(); }, [loadZones]);

  function startCreate() {
    setForm({ zone_name: "", region: "Abuja", price_min: 0, price_max: "", delivery_days: "1–2 business days", notes: "", active: true });
    setCreating(true);
    setEditing(null);
  }

  function startEdit(z: Zone) {
    setForm({
      zone_name: z.zone_name,
      region: z.region,
      price_min: z.price_min,
      price_max: z.price_max?.toString() ?? "",
      delivery_days: z.delivery_days,
      notes: z.notes ?? "",
      active: z.active,
    });
    setEditing(z);
    setCreating(false);
  }

  function cancel() { setEditing(null); setCreating(false); }

  async function handleSave() {
    setSaving(true);
    const payload = {
      zone_name: form.zone_name,
      region: form.region,
      price_min: form.price_min,
      price_max: form.price_max ? Number(form.price_max) : null,
      delivery_days: form.delivery_days,
      notes: form.notes || null,
      active: form.active,
    };

    let error;
    if (creating) {
      ({ error } = await supabase.from("shipping_zones").insert(payload));
    } else if (editing) {
      ({ error } = await supabase.from("shipping_zones").update(payload).eq("id", editing.id));
    }
    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    setSaving(false);
    cancel();
    loadZones();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this shipping zone?")) return;
    const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
    loadZones();
  }

  if (creating || editing) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{creating ? "Add Zone" : "Edit Zone"}</h1>
          <button onClick={cancel} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Zone Name</label>
            <input value={form.zone_name} onChange={(e) => setForm({ ...form, zone_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. Garki, Lugbe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Region</label>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Time</label>
              <input value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="1–2 business days" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price Min (₦)</label>
              <input type="number" value={form.price_min} onChange={(e) => setForm({ ...form, price_min: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price Max (₦, optional)</label>
              <input type="number" value={form.price_max} onChange={(e) => setForm({ ...form, price_max: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="Leave blank if fixed" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. Customer picks up at GUO station" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[#1a6b2f]" />
            Active
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.zone_name} className="px-5 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
            {saving ? "Saving…" : creating ? "Add Zone" : "Save"}
          </button>
          <button onClick={cancel} className="px-5 py-2 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 transition">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Shipping Zones</h1>
        <button onClick={startCreate} className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">+ Add Zone</button>
      </div>
      <p className="text-sm text-gray-500">Manage delivery areas and pricing. Changes are reflected on the website instantly.</p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Zone</th>
                  <th className="px-4 py-2.5 text-left">Region</th>
                  <th className="px-4 py-2.5 text-right">Price</th>
                  <th className="px-4 py-2.5 text-left">Delivery</th>
                  <th className="px-4 py-2.5 text-center">Active</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {zones.map((z) => (
                  <tr key={z.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium">{z.zone_name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{z.region}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      ₦{z.price_min.toLocaleString()}{z.price_max ? ` – ₦${z.price_max.toLocaleString()}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{z.delivery_days}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`w-2 h-2 rounded-full inline-block ${z.active ? "bg-green-500" : "bg-red-400"}`} />
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2">
                      <button onClick={() => startEdit(z)} className="text-xs text-[#1a6b2f] hover:underline font-semibold">Edit</button>
                      <button onClick={() => handleDelete(z.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
