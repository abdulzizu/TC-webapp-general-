"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  size: string;
  waist: string | null;
  length: string | null;
  elastic_waist: boolean;
  colours: string[];
  tag: string;
  image: string;
  images: string[];
  description: string;
  available: boolean;
};

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  category: "Clothing",
  subcategory: "",
  price: 0,
  size: "",
  waist: null,
  length: null,
  elastic_waist: false,
  colours: [],
  tag: "NEW",
  image: "",
  images: [],
  description: "",
  available: true,
};

const CATEGORIES = ["Clothing", "Accessories", "Shoes"];
const TAGS = ["NEW", "2 LEFT", "1 LEFT", "SOLD OUT", "👀 HOT", "🔥 TRENDING"];
const SUBCATEGORIES: Record<string, string[]> = {
  Clothing: ["Jackets", "T-shirts", "Shirts", "Cargo pants", "Jeans", "Shorts", "Track suits", "Sweatpants", "Sweatshirts", "Hoodies", "Dresses"],
  Accessories: ["Caps and hats", "Socks", "Ties", "Beanies", "Gloves", "Bags", "Belts", "Scarves"],
  Shoes: ["Clogs", "Slippers", "Sneakers", "Sandals", "Boots", "Loafers"],
};

export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "newest">("newest");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [colourInput, setColourInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (data) setProducts(data as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filtered = products
    .filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (!search) return true;
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "name": return a.name.localeCompare(b.name);
        default: return b.id - a.id;
      }
    });

  function startCreate() {
    setForm(EMPTY_PRODUCT);
    setCreating(true);
    setEditing(null);
  }

  function startEdit(p: Product) {
    setForm({ ...p });
    setEditing(p);
    setCreating(false);
  }

  function cancelForm() {
    setEditing(null);
    setCreating(false);
  }

  async function handleSave() {
    setSaving(true);
    if (creating) {
      // Get next ID
      const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
      const { error } = await supabase.from("products").insert({ id: maxId + 1, ...form });
      if (error) { alert("Error: " + error.message); setSaving(false); return; }
    } else if (editing) {
      const { error } = await supabase.from("products").update(form).eq("id", editing.id);
      if (error) { alert("Error: " + error.message); setSaving(false); return; }
    }
    setSaving(false);
    cancelForm();
    loadProducts();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product permanently?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: "image" | "images") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);

    if (field === "image") {
      setForm((f) => ({ ...f, image: publicUrl }));
    } else {
      setForm((f) => ({ ...f, images: [...f.images, publicUrl] }));
    }
    setUploading(false);
  }

  function removeExtraImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function addColour() {
    const c = colourInput.trim();
    if (c && !form.colours.includes(c)) {
      setForm((f) => ({ ...f, colours: [...f.colours, c] }));
    }
    setColourInput("");
  }

  function removeColour(c: string) {
    setForm((f) => ({ ...f, colours: f.colours.filter((x) => x !== c) }));
  }

  // ── Form Modal ──────────────────────────────────────────────
  if (creating || editing) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{creating ? "Add Product" : "Edit Product"}</h1>
          <button onClick={cancelForm} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subcategory</label>
              <select
                value={(SUBCATEGORIES[form.category] ?? []).includes(form.subcategory) ? form.subcategory : "__custom__"}
                onChange={(e) => {
                  if (e.target.value === "__custom__") return;
                  setForm({ ...form, subcategory: e.target.value });
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
              >
                <option value="">Select subcategory</option>
                {(SUBCATEGORIES[form.category] ?? []).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                <option value="__custom__">+ Add custom…</option>
              </select>
              {(!(SUBCATEGORIES[form.category] ?? []).includes(form.subcategory) || form.subcategory === "") && (
                <input
                  value={(SUBCATEGORIES[form.category] ?? []).includes(form.subcategory) ? "" : form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] mt-2"
                  placeholder="Type custom subcategory (e.g. Hoodie)"
                />
              )}
            </div>
          </div>

          {/* Price + Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₦)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Size</label>
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. M, L, 32" />
            </div>
          </div>

          {/* Waist + Length (pants) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Waist</label>
              <input value={form.waist ?? ""} onChange={(e) => setForm({ ...form, waist: e.target.value || null })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder='W32" or W28"–34"' />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Length</label>
              <input value={form.length ?? ""} onChange={(e) => setForm({ ...form, length: e.target.value || null })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder='L30"' />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.elastic_waist} onChange={(e) => setForm({ ...form, elastic_waist: e.target.checked })} className="accent-[#1a6b2f]" />
                Elastic waist
              </label>
            </div>
          </div>

          {/* Tag + Available */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tag</label>
              <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-[#1a6b2f]" />
                Available for sale
              </label>
            </div>
          </div>

          {/* Colours */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Colours</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.colours.map((c) => (
                <span key={c} className="bg-gray-100 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  {c}
                  <button onClick={() => removeColour(c)} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={colourInput} onChange={(e) => setColourInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColour())} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="Add colour" />
              <button type="button" onClick={addColour} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Add</button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] resize-none" />
          </div>

          {/* Primary Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Image</label>
            {form.image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 mb-2">
                <Image src={form.image} alt="" fill className="object-cover" sizes="96px" />
              </div>
            )}
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] mb-2" placeholder="Image URL or upload below" />
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-200 transition">
              {uploading ? "Uploading…" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "image")} disabled={uploading} />
            </label>
          </div>

          {/* Additional Images */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 group">
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  <button onClick={() => removeExtraImage(i)} className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition">×</button>
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-200 transition">
              {uploading ? "Uploading…" : "Add Image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "images")} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.name} className="px-6 py-2.5 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
            {saving ? "Saving…" : creating ? "Create Product" : "Save Changes"}
          </button>
          <button onClick={cancelForm} className="px-6 py-2.5 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 transition">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Product List ────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Products ({products.length})</h1>
        <button onClick={startCreate} className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition self-start">
          + Add Product
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full sm:w-60 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
        >
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Image</th>
                  <th className="px-4 py-2.5 text-left">Name</th>
                  <th className="px-4 py-2.5 text-left">Category</th>
                  <th className="px-4 py-2.5 text-right">Price</th>
                  <th className="px-4 py-2.5 text-center">Tag</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                        {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="40px" />}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium text-[#1a1a1a]">{p.name}</td>
                    <td className="px-4 py-2 text-gray-500">{p.subcategory}</td>
                    <td className="px-4 py-2 text-right font-semibold">₦{p.price.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.tag === "SOLD OUT" ? "bg-red-100 text-red-600" :
                        p.tag === "NEW" ? "bg-green-100 text-green-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{p.tag}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`w-2 h-2 rounded-full inline-block ${p.available ? "bg-green-500" : "bg-red-400"}`} />
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button onClick={() => startEdit(p)} className="text-xs text-[#1a6b2f] hover:underline font-semibold">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Delete</button>
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
