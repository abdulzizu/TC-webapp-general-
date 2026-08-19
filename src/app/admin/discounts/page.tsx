"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Discount = {
  id: number;
  code: string;
  name: string;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  max_uses_per_user: number;
  uses_count: number;
  product_scope: "all" | "specific";
  product_ids: number[];
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

const EMPTY_FORM = {
  code: "",
  name: "",
  discount_type: "percentage" as "percentage" | "fixed" | "free_shipping",
  discount_value: 10,
  min_purchase: 0,
  max_uses: "",
  max_uses_per_user: 1,
  product_scope: "all" as "all" | "specific",
  product_ids: [] as number[],
  start_date: "",
  end_date: "",
  active: true,
};

export default function AdminDiscountsPage() {
  const supabase = createClient();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);

  const loadDiscounts = useCallback(async () => {
    const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
    if (data) setDiscounts(data as any);
    setLoading(false);
  }, [supabase]);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("id, name").eq("available", true).neq("tag", "SOLD").order("name");
    if (data) setProducts(data as any);
  }, [supabase]);

  useEffect(() => { loadDiscounts(); loadProducts(); }, [loadDiscounts, loadProducts]);

  function startCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function startEdit(d: Discount) {
    setForm({
      code: d.code,
      name: d.name,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      min_purchase: d.min_purchase,
      max_uses: d.max_uses?.toString() ?? "",
      max_uses_per_user: d.max_uses_per_user,
      product_scope: d.product_scope,
      product_ids: d.product_ids,
      start_date: d.start_date ? new Date(d.start_date).toISOString().slice(0, 16) : "",
      end_date: d.end_date ? new Date(d.end_date).toISOString().slice(0, 16) : "",
      active: d.active,
    });
    setEditing(d);
    setCreating(false);
  }

  function cancel() { setEditing(null); setCreating(false); }

  async function handleSave() {
    if (!form.code.trim()) { alert("Code is required"); return; }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_type === "free_shipping" ? 0 : form.discount_value,
      min_purchase: form.min_purchase,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      max_uses_per_user: form.max_uses_per_user,
      product_scope: form.product_scope,
      product_ids: form.product_scope === "specific" ? form.product_ids : [],
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      active: form.active,
    };

    let error;
    if (creating) {
      ({ error } = await supabase.from("discount_codes").insert(payload));
    } else if (editing) {
      ({ error } = await supabase.from("discount_codes").update(payload).eq("id", editing.id));
    }
    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    setSaving(false);
    cancel();
    loadDiscounts();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this discount code?")) return;
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
    loadDiscounts();
  }

  async function toggleActive(d: Discount) {
    await supabase.from("discount_codes").update({ active: !d.active }).eq("id", d.id);
    loadDiscounts();
  }

  // ── Form ────────────────────────────────────────────────────
  if (creating || editing) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{creating ? "Create Discount" : "Edit Discount"}</h1>
          <button onClick={cancel} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[#1a6b2f]" placeholder="SUMMER20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Internal Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="Summer sale promo" />
            </div>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off (₦)</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
            {form.discount_type !== "free_shipping" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {form.discount_type === "percentage" ? "Percentage (%)" : "Amount (₦)"}
                </label>
                <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={0} />
              </div>
            )}
          </div>

          {/* Min purchase */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Purchase (₦, 0 = no minimum)</label>
            <input type="number" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={0} />
          </div>

          {/* Usage limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Total Uses (empty = unlimited)</label>
              <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={1} placeholder="∞" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Uses Per Customer</label>
              <input type="number" value={form.max_uses_per_user} onChange={(e) => setForm({ ...form, max_uses_per_user: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={1} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date (optional)</label>
              <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date (optional)</label>
              <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
            </div>
          </div>

          {/* Product targeting */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Applies to</label>
            <select value={form.product_scope} onChange={(e) => setForm({ ...form, product_scope: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2">
              <option value="all">All products</option>
              <option value="specific">Specific products only</option>
            </select>
            {form.product_scope === "specific" && (
              <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.product_ids.includes(p.id)}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          product_ids: e.target.checked
                            ? [...f.product_ids, p.id]
                            : f.product_ids.filter((id) => id !== p.id),
                        }));
                      }}
                      className="accent-[#1a6b2f]"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-[#1a6b2f]" />
            Active
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.code.trim()} className="px-5 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
            {saving ? "Saving…" : creating ? "Create Code" : "Save Changes"}
          </button>
          <button onClick={cancel} className="px-5 py-2 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 transition">Cancel</button>
        </div>
      </div>
    );
  }

  // ── List ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Discount Codes ({discounts.length})</h1>
        <button onClick={startCreate} className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">+ Create Code</button>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : discounts.length === 0 ? (
        <p className="text-sm text-gray-400">No discount codes yet.</p>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => {
            const isExpired = d.end_date && new Date(d.end_date) < new Date();
            const isScheduled = d.start_date && new Date(d.start_date) > new Date();
            const isMaxed = d.max_uses !== null && d.uses_count >= d.max_uses;
            return (
              <div key={d.id} className={`bg-white rounded-xl border border-gray-100 p-4 ${!d.active || isExpired || isMaxed ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm bg-gray-100 px-3 py-1 rounded-lg">{d.code}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {d.discount_type === "percentage" && `${d.discount_value}% off`}
                        {d.discount_type === "fixed" && `₦${d.discount_value.toLocaleString()} off`}
                        {d.discount_type === "free_shipping" && "Free shipping"}
                        {d.min_purchase > 0 && ` · min ₦${d.min_purchase.toLocaleString()}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.name && <span className="text-xs text-gray-400">{d.name}</span>}
                        <span className="text-xs text-gray-400">· {d.uses_count} used</span>
                        {d.max_uses && <span className="text-xs text-gray-400">/ {d.max_uses} max</span>}
                        {isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Expired</span>}
                        {isScheduled && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Scheduled</span>}
                        {isMaxed && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">Maxed out</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(d)} className={`text-xs px-2 py-1 rounded-full border ${d.active ? "border-green-200 text-green-700" : "border-gray-200 text-gray-400"}`}>
                      {d.active ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => startEdit(d)} className="text-xs text-[#1a6b2f] hover:underline font-semibold">Edit</button>
                    <button onClick={() => handleDelete(d.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
