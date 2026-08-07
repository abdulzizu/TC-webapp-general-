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
  suggest_essential: boolean;
};

type Pairing = { item: string; reason: string };

const EMPTY_PRODUCT: Omit<Product, "id"> & { pairs_with: Pairing[] } = {
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
  suggest_essential: false,
  pairs_with: [],
};

const DEFAULT_CATEGORIES = ["Clothing", "Accessories", "Shoes"];
const TAGS = ["NEW", "2 LEFT", "1 LEFT", "SOLD OUT", "ESSENTIAL", "STAFF PICK", ""];
const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Clothing: ["Jackets", "T-shirts", "Shirts", "Jerseys", "Cargo pants", "Jeans", "Shorts", "Track suits", "Trackpants", "Sweatpants", "Sweatshirts", "Hoodies", "Dresses"],
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
  const [form, setForm] = useState<Omit<Product, "id"> & { pairs_with: Pairing[] }>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [colourInput, setColourInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pairingSearch, setPairingSearch] = useState("");
  const [customCatInput, setCustomCatInput] = useState("");
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customSubInput, setCustomSubInput] = useState("");
  const [showCustomSub, setShowCustomSub] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>(DEFAULT_SUBCATEGORIES);
  const [managingSubs, setManagingSubs] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (data) {
      setProducts(data as any);
      // Build dynamic categories/subcategories from existing products
      const cats = new Set<string>(DEFAULT_CATEGORIES);
      const subs: Record<string, Set<string>> = {};
      DEFAULT_CATEGORIES.forEach((c) => { subs[c] = new Set(DEFAULT_SUBCATEGORIES[c] || []); });
      (data as any[]).forEach((p: any) => {
        if (p.category) {
          cats.add(p.category);
          if (!subs[p.category]) subs[p.category] = new Set();
          if (p.subcategory) subs[p.category].add(p.subcategory);
        }
      });
      setCategories(Array.from(cats).sort());
      const subsArr: Record<string, string[]> = {};
      Object.entries(subs).forEach(([cat, set]) => { subsArr[cat] = Array.from(set).sort(); });
      setSubcategories(subsArr);
    }
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
    setPairingSearch("");
  }

  function startEdit(p: Product) {
    setForm({ ...p, pairs_with: (p as any).pairs_with ?? [] });
    setEditing(p);
    setCreating(false);
    setPairingSearch("");
  }

  function cancelForm() {
    setEditing(null);
    setCreating(false);
  }

  async function handleSave() {
    setSaving(true);
    const { pairs_with, ...productFields } = form;
    // Ensure price is always a whole number
    const payload = { ...productFields, price: Math.round(productFields.price), pairs_with };
    if (creating) {
      const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
      const { error } = await supabase.from("products").insert({ id: maxId + 1, ...payload });
      if (error) { alert("Error: " + error.message); setSaving(false); return; }
    } else if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { alert("Error: " + error.message); setSaving(false); return; }
    }
    setSaving(false);
    cancelForm();
    loadProducts();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
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
              {showCustomCat ? (
                <div className="flex gap-2">
                  <input
                    value={customCatInput}
                    onChange={(e) => setCustomCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = customCatInput.trim();
                        if (val) {
                          if (!categories.includes(val)) setCategories((c) => [...c, val].sort());
                          setForm({ ...form, category: val, subcategory: "" });
                          setCustomCatInput("");
                          setShowCustomCat(false);
                        }
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
                    placeholder="Type new category"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customCatInput.trim();
                      if (val) {
                        if (!categories.includes(val)) setCategories((c) => [...c, val].sort());
                        setForm({ ...form, category: val, subcategory: "" });
                      }
                      setCustomCatInput("");
                      setShowCustomCat(false);
                    }}
                    className="px-3 py-2 bg-[#1a6b2f] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button type="button" onClick={() => setShowCustomCat(false)} className="px-2 py-2 text-xs text-gray-400 hover:text-gray-600">✕</button>
                </div>
              ) : (
                <select
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setShowCustomCat(true);
                      return;
                    }
                    setForm({ ...form, category: e.target.value, subcategory: "" });
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">+ Add custom category…</option>
                </select>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600">Subcategory</label>
                <button
                  type="button"
                  onClick={() => setManagingSubs(!managingSubs)}
                  className="text-[10px] text-gray-400 hover:text-red-500"
                >
                  {managingSubs ? "Done" : "Manage"}
                </button>
              </div>
              {managingSubs ? (
                <div className="border border-gray-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                  {(subcategories[form.category] ?? []).map((sub) => (
                    <div key={sub} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                      <span className="text-xs text-gray-700">{sub}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSubcategories((prev) => ({
                            ...prev,
                            [form.category]: (prev[form.category] ?? []).filter((s) => s !== sub),
                          }));
                          if (form.subcategory === sub) setForm({ ...form, subcategory: "" });
                        }}
                        className="text-xs text-red-400 hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(subcategories[form.category] ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No subcategories</p>
                  )}
                </div>
              ) : showCustomSub ? (
                <div className="flex gap-2">
                  <input
                    value={customSubInput}
                    onChange={(e) => setCustomSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = customSubInput.trim();
                        if (val) {
                          setSubcategories((prev) => ({
                            ...prev,
                            [form.category]: [...(prev[form.category] ?? []), val].sort(),
                          }));
                          setForm({ ...form, subcategory: val });
                          setCustomSubInput("");
                          setShowCustomSub(false);
                        }
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
                    placeholder="Type new subcategory"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customSubInput.trim();
                      if (val) {
                        setSubcategories((prev) => ({
                          ...prev,
                          [form.category]: [...(prev[form.category] ?? []), val].sort(),
                        }));
                        setForm({ ...form, subcategory: val });
                      }
                      setCustomSubInput("");
                      setShowCustomSub(false);
                    }}
                    className="px-3 py-2 bg-[#1a6b2f] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button type="button" onClick={() => setShowCustomSub(false)} className="px-2 py-2 text-xs text-gray-400 hover:text-gray-600">✕</button>
                </div>
              ) : (
                <>
                  <select
                    value={(subcategories[form.category] ?? []).includes(form.subcategory) ? form.subcategory : ""}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setShowCustomSub(true);
                        return;
                      }
                      setForm({ ...form, subcategory: e.target.value });
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
                  >
                    <option value="">Select subcategory</option>
                    {(subcategories[form.category] ?? []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="__custom__">+ Add custom…</option>
                  </select>
                  {form.subcategory && !(subcategories[form.category] ?? []).includes(form.subcategory) && (
                    <p className="text-[10px] text-[#1a6b2f] mt-1">Custom: &ldquo;{form.subcategory}&rdquo;</p>
                  )}
                </>
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

          {/* Tag + Available + Essential */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tag</label>
              <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {TAGS.map((t) => <option key={t} value={t}>{t || "— No tag —"}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-[#1a6b2f]" />
                  Visible on store
                </label>
                <p className="text-[10px] text-gray-400 mt-0.5">Uncheck to hide from customers (e.g. for upcoming drops)</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.suggest_essential} onChange={(e) => setForm({ ...form, suggest_essential: e.target.checked })} className="accent-purple-500" />
                  Suggest for Essentials
                </label>
                <p className="text-[10px] text-gray-400 mt-0.5">Item appears in the Essentials carousel on the homepage</p>
              </div>
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
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-200 transition">
                {uploading ? "Uploading…" : "Upload Image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "image")} disabled={uploading} />
              </label>
              {form.image && (
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={async () => {
                    setAiLoading(true);
                    try {
                      const res = await fetch("/api/admin/ai-describe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imageUrl: form.image }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        alert(data.error || "AI analysis failed");
                        return;
                      }
                      // Auto-populate form fields from AI response
                      setForm((f) => ({
                        ...f,
                        name: data.name || f.name,
                        category: data.category || f.category,
                        subcategory: data.subcategory || f.subcategory,
                        colours: data.colours?.length ? data.colours : f.colours,
                        size: data.size || f.size,
                        description: data.description || f.description,
                      }));
                      // Add subcategory to list if new
                      if (data.subcategory && !(subcategories[data.category] ?? []).includes(data.subcategory)) {
                        setSubcategories((prev) => ({
                          ...prev,
                          [data.category]: [...(prev[data.category] ?? []), data.subcategory].sort(),
                        }));
                      }
                    } catch (err: any) {
                      alert("Failed to analyze image: " + err.message);
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1a6b2f] text-white rounded-lg text-xs font-semibold hover:bg-[#104020] transition disabled:opacity-50"
                >
                  {aiLoading ? "Analyzing…" : "✨ Auto-fill from image"}
                </button>
              )}
            </div>
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

          {/* Pairs With */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pairs With (Style suggestions — up to 3)</label>
            <p className="text-[10px] text-gray-400 mb-3">Select products that go well with this item. Auto-suggestions are based on complementary categories.</p>

            {/* Current pairings */}
            {form.pairs_with.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.pairs_with.map((pairing, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-xl">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {(() => { const p = products.find(x => x.name === pairing.item); return p?.image ? <Image src={p.image} alt="" fill className="object-cover" sizes="48px" /> : null; })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{pairing.item}</p>
                      <input
                        value={pairing.reason}
                        onChange={(e) => {
                          const updated = [...form.pairs_with];
                          updated[i] = { ...updated[i], reason: e.target.value };
                          setForm((f) => ({ ...f, pairs_with: updated }));
                        }}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs mt-1 focus:outline-none focus:border-[#1a6b2f]"
                        placeholder="Why do they pair well?"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, pairs_with: f.pairs_with.filter((_, idx) => idx !== i) }))}
                      className="text-xs text-red-400 hover:text-red-600 shrink-0 mt-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-suggest + Manual select */}
            {form.pairs_with.length < 3 && (
              <div className="space-y-3">
                {/* Auto-suggest button */}
                {form.pairs_with.length === 0 && form.name && (
                  <button
                    type="button"
                    onClick={() => {
                      // Group subcategories into tops, bottoms, accessories, shoes
                      const TOPS = ["T-shirts", "Shirts", "Jerseys", "Sweatshirts", "Hoodies", "Jackets", "Gilets"];
                      const BOTTOMS = ["Jeans", "Sweatpants", "Trackpants", "Cargo pants", "Shorts", "Track suits"];
                      const ACCESSORIES = ["Caps and hats", "Socks", "Ties", "Beanies", "Gloves", "Bags", "Belts", "Scarves"];
                      const SHOES = ["Sneakers", "Clogs", "Slippers", "Sandals", "Boots", "Loafers"];

                      let targetSubs: string[] = [];
                      const sub = form.subcategory;

                      if (TOPS.includes(sub)) {
                        // Tops → suggest bottoms + accessories + shoes (layering tops like jackets can suggest other tops)
                        targetSubs = [...BOTTOMS, ...ACCESSORIES, ...SHOES];
                        if (["Jackets", "Gilets"].includes(sub)) {
                          // Outerwear can also pair with inner tops
                          targetSubs = [...targetSubs, "T-shirts", "Shirts", "Hoodies", "Sweatshirts"];
                        }
                      } else if (BOTTOMS.includes(sub)) {
                        // Bottoms → suggest tops + accessories + shoes, never other bottoms
                        targetSubs = [...TOPS, ...ACCESSORIES, ...SHOES];
                      } else if (ACCESSORIES.includes(sub)) {
                        // Accessories → suggest both tops and bottoms
                        targetSubs = [...TOPS, ...BOTTOMS, ...SHOES];
                      } else if (SHOES.includes(sub)) {
                        // Shoes → suggest tops and bottoms
                        targetSubs = [...TOPS, ...BOTTOMS, ...ACCESSORIES];
                      } else {
                        // Fallback
                        targetSubs = [...TOPS, ...BOTTOMS, ...ACCESSORIES, ...SHOES];
                      }

                      // Remove the current item's subcategory from targets (no same-type pairing)
                      targetSubs = targetSubs.filter((s) => s !== sub);

                      // Get matching products and shuffle
                      const candidates = products
                        .filter((p) => targetSubs.includes(p.subcategory) && p.name !== form.name && p.available);
                      // Fisher-Yates shuffle
                      for (let i = candidates.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                      }
                      // Try to pick from different subcategories for variety
                      const picked: typeof candidates = [];
                      const usedSubs = new Set<string>();
                      for (const c of candidates) {
                        if (picked.length >= 3) break;
                        if (!usedSubs.has(c.subcategory)) {
                          picked.push(c);
                          usedSubs.add(c.subcategory);
                        }
                      }
                      // If we couldn't get 3 unique subcategories, fill from remaining
                      if (picked.length < 3) {
                        for (const c of candidates) {
                          if (picked.length >= 3) break;
                          if (!picked.includes(c)) picked.push(c);
                        }
                      }

                      const suggestions = picked.map((p) => ({ item: p.name, reason: "" }));
                      if (suggestions.length > 0) {
                        setForm((f) => ({ ...f, pairs_with: suggestions }));
                      }
                    }}
                    className="w-full py-2 text-xs font-semibold text-[#1a6b2f] border border-[#1a6b2f]/30 rounded-lg hover:bg-[#1a6b2f]/5 transition"
                  >
                    ✨ Auto-suggest pairings based on category
                  </button>
                )}

                {/* Search + visual grid */}
                <div>
                  <input
                    type="text"
                    value={pairingSearch}
                    onChange={(e) => setPairingSearch(e.target.value)}
                    placeholder="Search for a product to pair with…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] mb-2"
                  />
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                    {(() => {
                      // Apply same tops/bottoms logic to manual grid
                      const TOPS = ["T-shirts", "Shirts", "Jerseys", "Sweatshirts", "Hoodies", "Jackets", "Gilets"];
                      const BOTTOMS = ["Jeans", "Sweatpants", "Trackpants", "Cargo pants", "Shorts", "Track suits"];
                      const sub = form.subcategory;
                      let excludeSubs: string[] = [];
                      if (TOPS.includes(sub) && !["Jackets", "Gilets"].includes(sub)) {
                        // Non-outerwear tops: exclude ALL tops
                        excludeSubs = [...TOPS];
                      } else if (BOTTOMS.includes(sub)) {
                        // Bottoms: exclude ALL bottoms
                        excludeSubs = [...BOTTOMS];
                      }

                      return products
                        .filter((p) =>
                          (pairingSearch ? p.name.toLowerCase().includes(pairingSearch.toLowerCase()) : true) &&
                          !form.pairs_with.some((pw) => pw.item === p.name) &&
                          p.name !== form.name &&
                          p.id !== editing?.id &&
                          !excludeSubs.includes(p.subcategory)
                        )
                        .slice(0, 20)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                pairs_with: [...f.pairs_with, { item: p.name, reason: "" }],
                              }));
                              setPairingSearch("");
                            }}
                          className="bg-white border border-gray-100 rounded-lg p-2 text-left hover:border-[#1a6b2f] transition group"
                        >
                          <div className="relative aspect-square rounded overflow-hidden bg-gray-100 mb-1">
                            {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="100px" />}
                            <div className="absolute inset-0 bg-[#1a6b2f]/0 group-hover:bg-[#1a6b2f]/10 transition flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white bg-[#1a6b2f] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition">+</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-medium truncate">{p.name}</p>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {form.pairs_with.length >= 3 && (
              <p className="text-xs text-gray-400 mt-2">Maximum 3 pairings. Remove one to add another.</p>
            )}
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
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
