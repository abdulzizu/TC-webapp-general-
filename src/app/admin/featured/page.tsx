"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type FeaturedItem = {
  id: number;
  label: string;
  price: string;
  size: string;
  tag: string;
  image_url: string;
  display_order: number;
  product_id: number | null;
};

export default function AdminFeaturedPage() {
  const supabase = createClient();
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FeaturedItem | null>(null);
  const [form, setForm] = useState({ label: "", price: "", size: "", tag: "NEW", image_url: "", display_order: 1, product_id: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from("featured_products").select("*").order("display_order", { ascending: true });
    if (data) setItems(data as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadItems(); }, [loadItems]);

  function startEdit(item: FeaturedItem) {
    setEditing(item);
    setForm({
      label: item.label,
      price: item.price,
      size: item.size,
      tag: item.tag,
      image_url: item.image_url,
      display_order: item.display_order,
      product_id: item.product_id?.toString() ?? "",
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("featured_products").update({
      label: form.label,
      price: form.price,
      size: form.size,
      tag: form.tag,
      image_url: form.image_url,
      display_order: form.display_order,
      product_id: form.product_id ? Number(form.product_id) : null,
    }).eq("id", editing.id);

    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    setSaving(false);
    setEditing(null);
    loadItems();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `featured/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: publicUrl }));
    setUploading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">Featured Products</h1>
        <p className="text-sm text-gray-500 mt-1">These are the 4 hero cards shown on the homepage. Update them weekly — no code changes needed.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : editing ? (
        /* Edit form */
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-bold text-sm">Edit Card #{editing.display_order}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price (display)</label>
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="₦12,500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Size</label>
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tag</label>
              <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="NEW">NEW</option>
                <option value="2 LEFT">2 LEFT</option>
                <option value="1 LEFT">1 LEFT</option>
                <option value="SOLD OUT">SOLD OUT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order</label>
              <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={1} max={4} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product ID (optional — links to product page)</label>
            <input value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. 11" />
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Image</label>
            {form.image_url && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 mb-2">
                <Image src={form.image_url} alt="" fill className="object-cover" sizes="96px" />
              </div>
            )}
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] mb-2" placeholder="Paste URL or upload" />
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-200 transition">
              {uploading ? "Uploading…" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelEdit} className="px-5 py-2 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Card list */
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
              <div className="relative aspect-square bg-gray-100">
                {item.image_url && <Image src={item.image_url} alt={item.label} fill className="object-cover" sizes="200px" />}
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.tag === "NEW" ? "bg-[#1a6b2f] text-white" : item.tag === "SOLD OUT" ? "bg-black text-white" : "bg-amber-400 text-black"
                }`}>{item.tag}</span>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-[#1a1a1a] truncate">{item.label}</p>
                <p className="text-xs text-gray-500">{item.price} · {item.size}</p>
                <button
                  onClick={() => startEdit(item)}
                  className="mt-2 text-xs text-[#1a6b2f] font-semibold hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
