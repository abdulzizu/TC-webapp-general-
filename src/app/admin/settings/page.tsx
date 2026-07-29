"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function FreeShippingSettings() {
  const supabase = createClient();
  const [threshold, setThreshold] = useState("60000");
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
