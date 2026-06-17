"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useUser } from "@/lib/user-context";
import type { SizeProfile } from "@/lib/user-context";

const TSHIRT_SIZES = ["Small (S)", "Medium (M)", "Large (L)", "XL", "2XL", "3XL", "Above 3XL"];

export default function ProfilePage() {
  const { user, saveUser, isSignedIn, signOut } = useUser();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [sizes, setSizes] = useState<SizeProfile>({
    tshirtSize: user?.sizes?.tshirtSize || "",
    chestInches: user?.sizes?.chestInches || "",
    sleeveInches: user?.sizes?.sleeveInches || "",
    pantsWaist: user?.sizes?.pantsWaist || "",
    pantsLength: user?.sizes?.pantsLength || "",
    hipInches: user?.sizes?.hipInches || "",
    capInches: user?.sizes?.capInches || "",
  });

  const [personal, setPersonal] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    deliveryAddress: user?.deliveryAddress || "",
  });

  function setSize(key: keyof SizeProfile, val: string) {
    setSizes((s) => ({ ...s, [key]: val }));
  }

  function setPersonalField(key: string, val: string) {
    setPersonal((p) => ({ ...p, [key]: val }));
    // Real-time validation
    if (key === "phone" && val && !/^[\d\s+\-()]{10,15}$/.test(val.trim())) {
      setErrors((e) => ({ ...e, phone: "Enter a valid phone number" }));
    } else {
      setErrors((e) => ({ ...e, [key]: "" }));
    }
  }

  function validate() {
    const errs: Partial<Record<string, string>> = {};
    if (!personal.name.trim()) errs.name = "Name is required";
    if (!personal.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^[\d\s+\-()]{10,15}$/.test(personal.phone.trim())) errs.phone = "Enter a valid phone number";
    if (!personal.deliveryAddress.trim()) errs.deliveryAddress = "Delivery address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    saveUser({ ...personal, sizes });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/");
    }, 2000);
  }

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a]">{isSignedIn ? "My Profile" : "Create Account"}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {isSignedIn ? "Update your sizes and details below." : "Set your sizes once — we'll remember them for every drop."}
            </p>
          </div>
          {isSignedIn && (
            <button onClick={() => { signOut(); router.push("/"); }}
              className="text-sm text-red-400 hover:text-red-600 transition-colors">
              Sign out
            </button>
          )}
        </div>

        {/* Size Preferences */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">Your Size Profile</h2>
          <p className="text-sm text-gray-400 mb-5">We&apos;ll use these to suggest the best items for you.</p>

          {/* T-shirt size */}
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">T-Shirt / Top Size</label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="T-shirt size">
              {TSHIRT_SIZES.map((s) => (
                <button key={s} type="button" onClick={() => setSize("tshirtSize", s)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${sizes.tshirtSize === s ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"}`}
                  aria-pressed={sizes.tshirtSize === s}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Optional measurements */}
          <div className="grid sm:grid-cols-2 gap-4">
            <OptField label="Chest Size (inches)" hint="Armpit to armpit · Optional"
              value={sizes.chestInches} onChange={(v) => setSize("chestInches", v)} placeholder='e.g. 40"' />
            <OptField label="Sleeve Size (inches)" hint="Arm to wrist · Optional"
              value={sizes.sleeveInches} onChange={(v) => setSize("sleeveInches", v)} placeholder='e.g. 26"' />
            <OptField label="Pants Waist (inches)" hint="Required for bottoms"
              value={sizes.pantsWaist} onChange={(v) => setSize("pantsWaist", v)} placeholder='e.g. 32"' />
            <OptField label="Pants Length (inches)" hint="Required for bottoms"
              value={sizes.pantsLength} onChange={(v) => setSize("pantsLength", v)} placeholder='e.g. 30"' />
            <OptField label="Hip Size (inches)" hint="Optional"
              value={sizes.hipInches} onChange={(v) => setSize("hipInches", v)} placeholder='e.g. 38"' />
            <OptField label="Cap Size (inches)" hint="Head circumference · Optional"
              value={sizes.capInches} onChange={(v) => setSize("capInches", v)} placeholder='e.g. 22"' />
          </div>
        </section>

        {/* Personal Details — save to sign up */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">
            {isSignedIn ? "Personal Details" : "Save your preferences"}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            {isSignedIn
              ? "Your saved name, number, and address."
              : "Provide your details to save your size profile and sign up. Next time, just enter your phone to sign in."}
          </p>

          <div className="space-y-4">
            <RequiredField id="name" label="Full Name *" value={personal.name}
              onChange={(v) => setPersonalField("name", v)} error={errors.name} placeholder="e.g. Abubakar Zizu" autoComplete="name" />
            <RequiredField id="phone" label="Phone Number *" type="tel" value={personal.phone}
              onChange={(v) => setPersonalField("phone", v)} error={errors.phone} placeholder="e.g. 08012345678" autoComplete="tel" />
            <RequiredField id="address" label="Delivery Address *" value={personal.deliveryAddress}
              onChange={(v) => setPersonalField("deliveryAddress", v)} error={errors.deliveryAddress}
              placeholder="Street address, city, state" autoComplete="street-address" />
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-full font-bold text-base transition-all shadow-lg ${saved ? "bg-[#1a6b2f]/80 text-white" : "bg-[#1a6b2f] text-white hover:bg-[#104020] shadow-[#1a6b2f]/20"}`}
        >
          {saved ? "✓ Saved! Redirecting…" : isSignedIn ? "Save Changes" : "Create Account & Save"}
        </button>

        {!isSignedIn && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-[#1a6b2f] font-semibold hover:underline">Sign in</Link>
          </p>
        )}
      </main>
    </>
  );
}

function OptField({ label, hint, value, onChange, placeholder }: {
  label: string; hint: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-0.5">{label}</label>
      <p className="text-[10px] text-gray-400 mb-1">{hint}</p>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20" />
    </div>
  );
}

function RequiredField({ id, label, value, onChange, error, placeholder, type = "text", autoComplete }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; error?: string;
  placeholder?: string; type?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${error ? "border-red-400 focus:border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"}`}
        aria-describedby={error ? `${id}-error` : undefined} aria-invalid={!!error} />
      {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
    </div>
  );
}
