"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

type DropProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  available: boolean;
  drop_id: number | null;
};

function NewDropContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); // If editing an existing drop

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [dropId, setDropId] = useState<number | null>(editId ? Number(editId) : null);
  const [products, setProducts] = useState<DropProduct[]>([]);
  const [allProducts, setAllProducts] = useState<DropProduct[]>([]);
  const [step, setStep] = useState<"details" | "products" | "review">(editId ? "products" : "details");

  // Load available products (hidden ones not assigned to another drop)
  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, image, price, available, drop_id, tag")
      .eq("available", false)
      .neq("tag", "SOLD")
      .order("id", { ascending: false });
    if (data) setAllProducts(data as any);
  }, [supabase]);

  // Load existing drop data if editing
  const loadDrop = useCallback(async () => {
    if (!editId) return;
    const id = Number(editId);
    const { data: drop } = await supabase.from("drops").select("*").eq("id", id).single();
    if (drop) {
      setName(drop.name);
      setDescription(drop.description ?? "");
      setScheduledAt(drop.scheduled_at ? new Date(drop.scheduled_at).toISOString().slice(0, 16) : "");
      setDropId(drop.id);
    }
    // Load products in this drop
    const { data: dropProducts } = await supabase
      .from("products")
      .select("id, name, image, price, available, drop_id")
      .eq("drop_id", id);
    if (dropProducts) setProducts(dropProducts as any);
  }, [supabase, editId]);

  useEffect(() => { loadProducts(); loadDrop(); }, [loadProducts, loadDrop]);

  // Products available to add: hidden, not sold, not assigned to another drop
  const unassignedProducts = allProducts.filter(
    (p) => !products.find((dp) => dp.id === p.id) && (p.drop_id === null || p.drop_id === dropId)
  );

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

  async function handleUpdateDrop() {
    if (!dropId) return;
    setSaving(true);
    const { error } = await supabase.from("drops").update({
      name: name.trim(),
      description: description.trim() || null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }).eq("id", dropId);
    if (error) { alert("Error: " + error.message); }
    setSaving(false);
  }

  async function addProductToDrop(productId: number) {
    if (!dropId) return;
    const { error } = await supabase.from("products").update({ drop_id: dropId }).eq("id", productId);
    if (error) { alert("Error adding product: " + error.message); return; }
    const product = allProducts.find((p) => p.id === productId);
    if (product) setProducts((prev) => [...prev, { ...product, drop_id: dropId }]);
  }

  async function removeProductFromDrop(productId: number) {
    const { error } = await supabase.from("products").update({ drop_id: null }).eq("id", productId);
    if (error) { alert("Error removing product: " + error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  async function releaseDrop() {
    if (!dropId) return;
    setSaving(true);
    const { error: prodError } = await supabase.from("products").update({ available: true, tag: "NEW", visible_at: new Date().toISOString() }).eq("drop_id", dropId);
    if (prodError) { alert("Error releasing products: " + prodError.message); setSaving(false); return; }
    const { error } = await supabase.from("drops").update({
      status: "live",
      released_at: new Date().toISOString(),
    }).eq("id", dropId);
    if (error) { alert("Error updating drop status: " + error.message); setSaving(false); return; }

    // Notify users whose wishlist keywords match the new products
    fetch("/api/drops/notify-matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId }),
    }).catch(() => {});

    setSaving(false);
    router.push("/admin/drops");
  }

  async function scheduleDrop() {
    if (!dropId || !scheduledAt) return;
    setSaving(true);
    const { error } = await supabase.from("drops").update({
      status: "scheduled",
      scheduled_at: new Date(scheduledAt).toISOString(),
    }).eq("id", dropId);
    if (error) { alert("Error scheduling: " + error.message); setSaving(false); return; }
    setSaving(false);
    router.push("/admin/drops");
  }

  // ── Step 1: Drop details ────────────────────────────────────
  if (step === "details") {
    return (
      <div className="space-y-6 max-w-lg">
        <h1 className="text-xl font-bold">{editId ? "Edit Drop" : "Start New Drop"}</h1>
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
        <div className="flex gap-3">
          <button onClick={editId ? () => { handleUpdateDrop(); setStep("products"); } : handleCreateDrop} disabled={saving || !name.trim()} className="px-6 py-2.5 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
            {saving ? "Saving…" : editId ? "Save & Manage Products" : "Create Drop & Add Products"}
          </button>
          <button onClick={() => router.push("/admin/drops")} className="px-6 py-2.5 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 transition">Cancel</button>
        </div>
      </div>
    );
  }

  // ── Step 2: Add products ────────────────────────────────────
  if (step === "products") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">&quot;{name}&quot; — Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Only hidden products (not in another drop) are shown.{" "}
              <a href="/admin/products" target="_blank" className="text-[#1a6b2f] font-semibold hover:underline">Add new products</a> with "Visible on store" unchecked.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("details")} className="px-3 py-2 border border-gray-200 rounded-full text-xs font-semibold hover:border-gray-300 transition">Edit Details</button>
            <button onClick={() => setStep("review")} className="px-4 py-2 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">
              Review ({products.length})
            </button>
          </div>
        </div>

        {/* Selected */}
        {products.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">In this drop ({products.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {products.map((p) => (
                <div key={p.id} className="relative bg-white border border-[#1a6b2f]/20 rounded-lg p-2">
                  <div className="relative aspect-square rounded overflow-hidden bg-gray-100 mb-1">
                    {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="100px" />}
                  </div>
                  <p className="text-[10px] font-medium truncate">{p.name}</p>
                  <button
                    onClick={() => removeProductFromDrop(p.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available to add */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Available to add ({unassignedProducts.length})</p>
          {unassignedProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No hidden products available. Add products with "Visible on store" unchecked first.</p>
          ) : (
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
          )}
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
        {description && <p className="text-sm"><span className="text-gray-500">Description:</span> {description}</p>}

        {/* Schedule editor */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Schedule (change anytime before release)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
          />
        </div>

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

        <button
          onClick={scheduleDrop}
          disabled={saving || products.length === 0 || !scheduledAt}
          className="w-full py-3 border-2 border-[#1a6b2f] text-[#1a6b2f] font-bold rounded-full text-sm hover:bg-[#1a6b2f]/5 transition disabled:opacity-50"
        >
          {saving ? "Scheduling…" : scheduledAt ? `⏰ Schedule for ${new Date(scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "⏰ Set a date above to schedule"}
        </button>

        <button
          onClick={() => { handleUpdateDrop(); router.push("/admin/drops"); }}
          disabled={saving}
          className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-full text-sm hover:border-gray-300 transition"
        >
          Save as Draft
        </button>

        <button onClick={() => setStep("products")} className="w-full text-center text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to products
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Releasing marks all products in this drop as visible with the &quot;NEW&quot; tag. Customers will see them immediately.
      </p>
    </div>
  );
}

export default function NewDropPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <NewDropContent />
    </Suspense>
  );
}
