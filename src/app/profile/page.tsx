"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useUser } from "@/lib/user-context";
import type { SizeProfile, Order } from "@/lib/user-context";

const TSHIRT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "3XL+"];

type Tab = "details" | "orders" | "keywords";

const STATUS_CONFIG: Record<Order["status"], { label: string; color: string; bg: string }> = {
  processing:   { label: "Processing",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  stockpiled:   { label: "Stockpiled",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  shipped:      { label: "Shipped",      color: "text-[#1a6b2f]",  bg: "bg-green-50 border-green-200" },
  delivered:    { label: "Delivered",    color: "text-gray-700",   bg: "bg-gray-50 border-gray-200" },
  unsuccessful: { label: "Unsuccessful", color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

export default function ProfilePage() {
  const { user, saveUser, isSignedIn, signOut, addKeyword, removeKeyword } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("details");
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordAdded, setKeywordAdded] = useState(false);

  const [sizes, setSizes] = useState<SizeProfile>({
    tshirtSize:  user?.sizes?.tshirtSize  || "",
    chestInches: user?.sizes?.chestInches || "",
    sleeveInches:user?.sizes?.sleeveInches|| "",
    pantsWaist:  user?.sizes?.pantsWaist  || "",
    pantsLength: user?.sizes?.pantsLength || "",
    hipInches:   user?.sizes?.hipInches   || "",
    capInches:   user?.sizes?.capInches   || "",
  });

  const [personal, setPersonal] = useState({
    name:            user?.name            || "",
    phone:           user?.phone           || "",
    email:           user?.email           || "",
    deliveryAddress: user?.deliveryAddress || "",
  });

  function setSize(key: keyof SizeProfile, val: string) {
    setSizes((s) => ({ ...s, [key]: val }));
  }

  function setPersonalField(key: string, val: string) {
    setPersonal((p) => ({ ...p, [key]: val }));
    if (key === "phone" && val && !/^[\d\s+\-()+]{10,15}$/.test(val.trim())) {
      setErrors((e) => ({ ...e, phone: "Enter a valid phone number" }));
    } else if (key === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email" }));
    } else {
      setErrors((e) => ({ ...e, [key]: "" }));
    }
  }

  function validate() {
    const errs: Partial<Record<string, string>> = {};
    if (!personal.name.trim()) errs.name = "Name is required";
    if (!personal.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^[\d\s+\-()+]{10,15}$/.test(personal.phone.trim())) errs.phone = "Enter a valid phone number";
    if (!personal.deliveryAddress.trim()) errs.deliveryAddress = "Delivery address is required";
    if (personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) errs.email = "Enter a valid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    saveUser({
      ...personal,
      sizes,
      orders: user?.orders ?? [],
      keywords: user?.keywords ?? [],
    });
    setSaved(true);
    if (!isSignedIn) {
      setTimeout(() => { setSaved(false); router.push("/"); }, 2000);
    } else {
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!keywordInput.trim()) return;
    addKeyword(keywordInput.trim());
    setKeywordInput("");
    setKeywordAdded(true);
    setTimeout(() => setKeywordAdded(false), 2000);
  }

  const orders = user?.orders ?? [];
  const keywords = user?.keywords ?? [];

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a]">
              {isSignedIn ? `Hi, ${user!.name.split(" ")[0]}` : "Create Account"}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {isSignedIn ? user!.phone : "Set your sizes once — we'll remember them for every drop."}
            </p>
          </div>
          {isSignedIn && (
            <button
              onClick={() => { signOut(); router.push("/"); }}
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>

        {/* Tabs — only show when signed in */}
        {isSignedIn && (
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-8" role="tablist">
            {([
              { id: "details",  label: "My Details" },
              { id: "orders",   label: `Orders${orders.length > 0 ? ` (${orders.length})` : ""}` },
              { id: "keywords", label: "Drop Alerts" },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-white shadow-sm text-[#1a1a1a]" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Tab: Details ── */}
        {(tab === "details" || !isSignedIn) && (
          <>
            {/* Sizes */}
            <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
              <h2 className="font-bold text-lg mb-1">Size Profile</h2>
              <p className="text-sm text-gray-400 mb-5">We&apos;ll suggest drops that match your measurements.</p>

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

              <div className="grid sm:grid-cols-2 gap-4">
                <OptField label="Chest Size (inches)" hint="Armpit to armpit · Optional" value={sizes.chestInches} onChange={(v) => setSize("chestInches", v)} placeholder='e.g. 40"' />
                <OptField label="Sleeve Size (inches)" hint="Arm to wrist · Optional" value={sizes.sleeveInches} onChange={(v) => setSize("sleeveInches", v)} placeholder='e.g. 26"' />
                <OptField label="Pants Waist (inches)" hint="Waist measurement" value={sizes.pantsWaist} onChange={(v) => setSize("pantsWaist", v)} placeholder='e.g. 32"' />
                <OptField label="Pants Length (inches)" hint="Inseam length" value={sizes.pantsLength} onChange={(v) => setSize("pantsLength", v)} placeholder='e.g. 30"' />
                <OptField label="Hip Size (inches)" hint="Optional" value={sizes.hipInches} onChange={(v) => setSize("hipInches", v)} placeholder='e.g. 38"' />
                <OptField label="Cap Size (inches)" hint="Head circumference · Optional" value={sizes.capInches} onChange={(v) => setSize("capInches", v)} placeholder='e.g. 22"' />
              </div>
            </section>

            {/* Personal details */}
            <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
              <h2 className="font-bold text-lg mb-1">
                {isSignedIn ? "Personal Details" : "Save your preferences"}
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                {isSignedIn
                  ? "All fields are editable. Save when done."
                  : "Provide your details to create your account. Next time, just enter your phone to sign in."}
              </p>
              <div className="space-y-4">
                <RequiredField id="name" label="Full Name *" value={personal.name} onChange={(v) => setPersonalField("name", v)} error={errors.name} placeholder="e.g. Abubakar Zizu" autoComplete="name" />
                <RequiredField id="phone" label="Phone Number *" type="tel" value={personal.phone} onChange={(v) => setPersonalField("phone", v)} error={errors.phone} placeholder="e.g. 08012345678" autoComplete="tel" />
                <RequiredField id="email" label="Email Address" type="email" value={personal.email} onChange={(v) => setPersonalField("email", v)} error={errors.email} placeholder="e.g. you@example.com" autoComplete="email" />
                <RequiredField id="address" label="Delivery Address *" value={personal.deliveryAddress} onChange={(v) => setPersonalField("deliveryAddress", v)} error={errors.deliveryAddress} placeholder="Street address, city, state" autoComplete="street-address" />
              </div>
            </section>

            <button
              onClick={handleSave}
              className={`w-full py-4 rounded-full font-bold text-base transition-all shadow-lg ${saved ? "bg-[#1a6b2f]/80 text-white" : "bg-[#1a6b2f] text-white hover:bg-[#104020] shadow-[#1a6b2f]/20"}`}
            >
              {saved ? "✓ Saved!" : isSignedIn ? "Save Changes" : "Create Account & Save"}
            </button>

            {!isSignedIn && (
              <p className="text-center text-sm text-gray-400 mt-4">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-[#1a6b2f] font-semibold hover:underline">Sign in</Link>
              </p>
            )}
          </>
        )}

        {/* ── Tab: Orders ── */}
        {tab === "orders" && isSignedIn && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4" aria-hidden="true">📦</p>
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">No orders yet</p>
                <p className="text-gray-500 text-sm mb-6">Your order history will appear here once you make a purchase.</p>
                <Link href="/shop" className="btn-tc-primary px-6 py-3 rounded-full text-sm inline-block">Shop the Drop</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status];
                  const date = new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <div key={order.orderId} className="bg-white border border-gray-100 rounded-2xl p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="font-bold text-[#1a1a1a]">{order.orderId}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {order.items.map((item) => (
                          <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#ede8d8] shrink-0">
                              <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="32px" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1a1a1a] line-clamp-1">{item.productName}</p>
                              <p className="text-[10px] text-gray-400">Size: {item.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-500 text-xs space-y-0.5">
                          <p>Items: ₦{order.subtotal.toLocaleString()}</p>
                          {order.isStockpile
                            ? <p className="text-amber-600">Shipping: Charged on delivery request</p>
                            : <p>Shipping: {order.shippingCost === 0 ? "FREE" : `₦${order.shippingCost.toLocaleString()}`}</p>
                          }
                        </div>
                        <p className="font-bold text-[#1a6b2f]">₦{order.total.toLocaleString()}</p>
                      </div>

                      {/* Stockpile info */}
                      {order.isStockpile && order.stockpiledUntil && order.status === "stockpiled" && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                          <p className="font-semibold mb-0.5">📦 Stockpiled</p>
                          <p>Hold expires: <strong>{new Date(order.stockpiledUntil).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</strong></p>
                          <a
                            href={`https://wa.me/2348000000000?text=Hi! I'd like to request delivery for order ${order.orderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-[#1a6b2f] font-semibold underline"
                          >
                            Request delivery via SMS →
                          </a>
                        </div>
                      )}

                      {order.status === "shipped" && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-[#1a6b2f]">
                          🚚 Your order is on its way! You&apos;ll receive SMS updates.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Drop Alerts / Keywords ── */}
        {tab === "keywords" && isSignedIn && (
          <div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
              <h2 className="font-bold text-lg mb-1">Drop Alert Keywords</h2>
              <p className="text-sm text-gray-400 mb-5">
                Add keywords and we&apos;ll notify you via SMS{user?.email ? " or email" : ""} when a matching item drops.
                Use specific terms like <em>L42</em>, <em>acid wash</em>, <em>striped tee</em>, <em>rugby polo</em>, etc.
              </p>

              {/* Add keyword form */}
              <form onSubmit={handleAddKeyword} className="flex gap-2 mb-6">
                <label htmlFor="keyword-input" className="sr-only">Add keyword</label>
                <input
                  id="keyword-input"
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder='e.g. "L42" or "acid wash jeans"'
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"
                  maxLength={60}
                />
                <button
                  type="submit"
                  className="btn-tc-primary px-5 py-2.5 text-xs rounded-full shrink-0"
                >
                  {keywordAdded ? "✓ Added" : "+ Add"}
                </button>
              </form>

              {/* Active keywords */}
              {keywords.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-2xl mb-2" aria-hidden="true">🔔</p>
                  <p className="text-sm text-gray-500">No keywords yet. Add one above to get notified.</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Active alerts ({keywords.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw) => (
                      <div
                        key={kw}
                        className="flex items-center gap-2 bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-full pl-4 pr-2 py-1.5"
                      >
                        <span className="text-sm text-[#1a6b2f] font-semibold">{kw}</span>
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="text-[#1a6b2f]/50 hover:text-red-500 transition-colors w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-50"
                          aria-label={`Remove keyword "${kw}"`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification channel */}
            <div className="bg-[#f5f0e8] border border-[#1a6b2f]/10 rounded-2xl p-5">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-2">📲 Where we notify you</p>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1a6b2f]" aria-hidden="true" />
                  <span>Phone: <strong>{user?.phone}</strong></span>
                </div>
                {user?.email ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1a6b2f]" aria-hidden="true" />
                    <span>Email: <strong>{user.email}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300" aria-hidden="true" />
                    <span className="text-gray-400">
                      No email on file —{" "}
                      <button onClick={() => setTab("details")} className="text-[#1a6b2f] underline font-semibold">add one</button>
                      {" "}to get email alerts too.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
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
