"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pin.trim()) {
      setError("Enter your PIN");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pin.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Invalid PIN");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Thrift Collision</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl">
          <label htmlFor="pin" className="block text-xs font-semibold text-gray-600 mb-2">
            Enter Admin PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(""); }}
            placeholder="••••••"
            className={`w-full border rounded-xl px-4 py-3 text-center text-lg tracking-widest font-bold focus:outline-none transition ${
              error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"
            }`}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors text-sm disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
