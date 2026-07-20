"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type DropProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  available: boolean;
};

export default function NewDropPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [dropId, setDropId] = useState<number | null>(null);
  const [products, setProducts] = useState<DropProduct[]>([]);
  const [allProducts, setAllProducts] = useState<DropProduct[]>([]);
  const [step, setStep] = useState<"details" | "products" | "review">("details");

  const loadProducts = useCallback(async () => {
    // Only show hidden (unavailable) products — these are the ones ready for a drop
    const { data } = await supabase.from("products").select("id, name, image, price, available").eq("available", false).order("id", { ascending: false });
    if (data) setAllProducts(data as any);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function handleCreateDrop() {
    if (!name.trim()) return;
    setSaving(true);

    const { data, error } = await supabase.from("drops").insert({
      name: name.trim(),
      description: description.trim() || null,
      status: "draft",
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }).select("id").single();

    if (error || !data) {
      alert("Error creating drop: " + (error?.message ?? "Unknown"));
      setSaving(false);
      return;
    }

    setDropId(data.id);
    setSaving(false);
    setStep("products");
  }

  async function addProductToDrop(productId: number) {
    if (!dropId) return;
    // Hide product from store — it will become visible when the drop is released
    await supabase.from("products").update({ drop_id: dropId, available: false }).eq("id", productId);
    const product = allProducts.find((p) => p.id === productId);
    if (product) setProducts((prev) => [...prev, { ...product, available: false }]);
  }

  async function removeProductFromDrop(productId: number) {
    await supabase.from("products").update({ drop_id: null }).eq("id", productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  async function releaseDrop() {
    if (!dropId) return;
    setSaving(true);

    // Mark all products in this drop as available with NEW tag
    await supabase.from("products").update({ available: true, tag: "NEW" }).eq("drop_id", dropId);

    // Update drop status
    await supabase.from("drops").update({
      status: "live",
      released_at: new Date().toISOString(),
    }).eq("id", dropId);

    setSaving(false);
    router.push("/admin/drops");
  }

  async function scheduleDrop() {
    if (!dropId || !scheduledAt) return;
    setSaving(true);
    await supabase.from("drops").update({
      status: "scheduled",
      scheduled_at: new Date(scheduledAt).toISOString(),
    }).eq("id", dropId);
    setSaving(false);
    router.push("/admin/drops");
  }

  const unassignedProducts = allProducts.filter(
    (p) => !products.find((dp) => dp.id === p.id)
  );

  // ── Step 1: Drop details ────────────────────────────────────
  if (step === "details") {
    return (
      <div className="space-y-6 max-w-lg">
        <h1 className="text-xl font-bold">Start New Drop</h1>
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Drop Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="e.g. Soja, not soldier" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f] resize-none" placeholder="Camo capsule drop — military-inspired pieces" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Schedule for (optional — leave blank to release manually)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" />
          </div>
        </div>
        <button onClick={handleCreateDrop} disabled={saving || !name.trim()} className="px-6 py-2.5 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
          {saving ? "Creating…" : "Create Drop & Add Products"}
        </button>
      </div>
    );
  }

  // ── Step 2: Add products ────────────────────────────────────
  if (step === "products") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Add Products to &quot;{name}&quot;</h1>
            <p className="text-sm text-gray-500 mt-1">Only hidden products are shown here. <a href="/admin/products" target="_blank" className="text-[#1a6b2f] font-semibold hover:underline">Add new products</a> with &quot;Visible on store&quot; unchecked, then come back to assign them to this drop.</p>
          </div>
          <button onClick={() => setStep("review")} className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">
            Review & Release ({products.length} items)
          </button>
        </div>

        {/* Selected */}
        {products.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">In this drop ({products.length})</p>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-lg px-3 py-1.5">
                  <div className="relative w-6 h-6 rounded overflow-hidden">
                    {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="24px" />}
                  </div>
                  <span className="text-xs font-medium">{p.name}</span>
                  <button onClick={() => removeProductFromDrop(p.id)} className="text-xs text-red-400 hover:text-red-600 ml-1">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available to add */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Available products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {unassignedProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addProductToDrop(p.id)}
                className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-[#1a6b2f] transition group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="150px" />}
                  <div className="absolute inset-0 bg-[#1a6b2f]/0 group-hover:bg-[#1a6b2f]/10 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white bg-[#1a6b2f] rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition">+</span>
                  </div>
                </div>
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-500">₦{p.price.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Review & Release ────────────────────────────────
  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold">Review &quot;{name}&quot;</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <p className="text-sm"><span className="text-gray-500">Products:</span> <strong>{products.length} items</strong></p>
        {scheduledAt && (
          <p className="text-sm"><span className="text-gray-500">Scheduled:</span> <strong>{new Date(scheduledAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          {products.map((p) => (
            <div key={p.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100">
              {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" sizes="48px" />}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={releaseDrop}
          disabled={saving || products.length === 0}
          className="w-full py-3 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50"
        >
          {saving ? "Releasing…" : "🚀 Release Now (Go Live)"}
        </button>

        {scheduledAt && (
          <button
            onClick={scheduleDrop}
            disabled={saving || products.length === 0}
            className="w-full py-3 border-2 border-[#1a6b2f] text-[#1a6b2f] font-bold rounded-full text-sm hover:bg-[#1a6b2f]/5 transition disabled:opacity-50"
          >
            {saving ? "Scheduling…" : `⏰ Schedule for ${new Date(scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
          </button>
        )}

        <button onClick={() => setStep("products")} className="w-full text-center text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to add more products
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Releasing marks all products in this drop as available with the &quot;NEW&quot; tag. Customers will see them immediately on the website.
      </p>
    </div>
  );
}
