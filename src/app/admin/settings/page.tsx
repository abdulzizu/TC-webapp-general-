"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function FreeShippingSettings() {
  const supabase = createClient();
  const [threshold, setThreshold] = useState("65000");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("store_settings").select("value").eq("key", "free_shipping_threshold").single()
      .then(({ data }) => { if (data) setThreshold(data.value); });
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("store_settings").upsert({ key: "free_shipping_threshold", value: threshold, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-bold text-sm mb-1">Free Shipping Threshold</h2>
      <p className="text-xs text-gray-400 mb-4">Orders above this amount get free delivery. Change it anytime for promotions.</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₦)</label>
          <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]" min={0} />
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Update"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Currently: Free delivery on orders above ₦{Number(threshold).toLocaleString()}</p>
    </div>
  );
}

function DropDaySettings() {
  const supabase = createClient();
  const [day, setDay] = useState("5"); // Default Friday
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const days = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ];

  useEffect(() => {
    supabase.from("store_settings").select("value").eq("key", "drop_day").single()
      .then(({ data }) => { if (data) setDay(data.value); });
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("store_settings").upsert({ key: "drop_day", value: day, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-bold text-sm mb-1">Drop Day</h2>
      <p className="text-xs text-gray-400 mb-4">The countdown timer on the homepage targets this day at noon. Change it when your drop schedule shifts.</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Day of Week</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]">
            {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Update"}
        </button>
      </div>
    </div>
  );
}

function MarqueeSettings() {
  const supabase = createClient();
  const [items, setItems] = useState<string[]>([
    "NEW DROP EVERY WEEK", "UNISEX STREETWEAR", "SUSTAINABLY THRIFTED",
    "FREE DELIVERY OVER ₦65,000", "GOOD-AS-NEW QUALITY",
  ]);
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("store_settings").select("value").eq("key", "marquee_items").single()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
          } catch {}
        }
      });
  }, [supabase]);

  function addItem() {
    const text = newItem.trim().toUpperCase();
    if (!text || items.includes(text)) return;
    setItems([...items, text]);
    setNewItem("");
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("store_settings").upsert(
      { key: "marquee_items", value: JSON.stringify(items), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-bold text-sm mb-1">Marquee Banner</h2>
      <p className="text-xs text-gray-400 mb-4">The scrolling text at the top of the website. Edit items or add new ones.</p>

      <div className="space-y-2 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-xs font-bold uppercase flex-1">{item}</span>
            <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600 shrink-0">×</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder="Add new item (e.g. BACK IN STOCK)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-[#1a6b2f]"
        />
        <button onClick={addItem} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Add</button>
      </div>

      <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Banner"}
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult("");

    if (!currentPassword || !newPassword) {
      setError("Fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to change password");
      return;
    }

    setResult("Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-[#1a1a1a]">Settings</h1>

      {/* Free Shipping Threshold */}
      <FreeShippingSettings />

      {/* Drop Day */}
      <DropDaySettings />

      {/* Marquee Banner */}
      <MarqueeSettings />

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-bold text-sm mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {result && <p className="text-[#1a6b2f] text-xs font-semibold">{result}</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition disabled:opacity-50"
          >
            {loading ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
