"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/lib/user-context";
import type { Order } from "@/lib/user-context";

type FormErrors = Partial<Record<string, string>>;

// Simple shipping estimate based on state
function getShippingEstimate(state: string): string {
  const Lagos = ["lagos"];
  const SameDay = ["abuja", "fct"];
  const s = state.toLowerCase();
  if (Lagos.some((x) => s.includes(x))) return "2–3 business days";
  if (SameDay.some((x) => s.includes(x))) return "1–2 business days";
  return "3–5 business days";
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useUser();

  const cartShippingCost = subtotal >= 60000 ? 0 : Number(searchParams.get("shipping") || 3500);
  const discountPct = Number(searchParams.get("discount") || 0);
  const discountCode = searchParams.get("code") || "";

  const [step, setStep] = useState<"details" | "payment">("details");
  const [asGuest, setAsGuest] = useState(!user);
  const [deliveryChoice, setDeliveryChoice] = useState<"ship" | "stockpile">("ship");
  const [payMethod, setPayMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.deliveryAddress || "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (user) {
      setAsGuest(false);
      setForm((f) => ({
        ...f,
        name: user.name,
        phone: user.phone,
        email: user.email || "",
        address: user.deliveryAddress,
      }));
    }
  }, [user]);

  // Costs
  const discountAmount = discountPct ? Math.round((subtotal * discountPct) / 100) : 0;
  const shippingCost = deliveryChoice === "stockpile" ? 0 : cartShippingCost;
  const total = subtotal - discountAmount + shippingCost;
  const shippingEstimate = form.state ? getShippingEstimate(form.state) : null;

  // Stockpile expiry = 1 month from today
  const stockpiledUntil = new Date();
  stockpiledUntil.setMonth(stockpiledUntil.getMonth() + 1);
  const stockpileDeadline = stockpiledUntil.toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  }

  function validateField(field: string, value: string): string {
    switch (field) {
      case "name": return value.trim().length < 2 ? "Please enter your full name" : "";
      case "phone": return !/^[\d\s+\-()+]{10,15}$/.test(value.trim()) ? "Enter a valid phone number" : "";
      case "email": return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Enter a valid email" : "";
      case "address": return value.trim().length < 5 ? "Enter your delivery address" : "";
      case "city": return value.trim().length < 2 ? "Enter your city" : "";
      case "state": return value.trim().length < 2 ? "Enter your state" : "";
      default: return "";
    }
  }

  function validateStep(): boolean {
    const required = ["name", "phone", "address", "city", "state"];
    const newErrors: FormErrors = {};
    required.forEach((f) => {
      const err = validateField(f, form[f as keyof typeof form]);
      if (err) newErrors[f] = err;
    });
    if (form.email) {
      const err = validateField("email", form.email);
      if (err) newErrors.email = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePlaceOrder() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const orderId = "TC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const fullAddress = [form.address, form.city, form.state].filter(Boolean).join(", ");
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    const order: Order = {
      orderId,
      date: new Date().toISOString(),
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        productImage: i.product.image,
        size: i.size,
        quantity: i.quantity,
        price: i.product.price,
      })),
      subtotal,
      shippingCost,
      discountAmount,
      total,
      deliveryAddress: fullAddress,
      payMethod,
      status: deliveryChoice === "stockpile" ? "stockpiled" : "processing",
      isStockpile: deliveryChoice === "stockpile",
      stockpiledUntil: deliveryChoice === "stockpile" ? expiry.toISOString() : undefined,
    };

    try {
      sessionStorage.setItem(`tc_pending_order_${orderId}`, JSON.stringify(order));
    } catch {}

    clearCart();
    router.push(
      `/order-confirmation?orderId=${orderId}&name=${encodeURIComponent(form.name)}&guest=${asGuest}&stockpile=${deliveryChoice === "stockpile"}`
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-2xl font-bold mb-4">Your cart is empty</p>
        <Link href="/shop" className="btn-tc-primary px-6 py-3 rounded-full text-sm inline-block">Shop the Drop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Checkout</h1>
        <Link href="/cart" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors">← Back to cart</Link>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8" aria-label="Checkout steps">
        {["Details", "Payment"].map((label, i) => {
          const active = (i === 0 && step === "details") || (i === 1 && step === "payment");
          const done = i === 0 && step === "payment";
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="w-12 h-px bg-gray-200" aria-hidden="true" />}
              <div className={`flex items-center gap-2 text-sm font-semibold ${active ? "text-[#1a6b2f]" : done ? "text-gray-400" : "text-gray-300"}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-[#1a6b2f] text-white" : done ? "bg-gray-300 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {done ? "✓" : i + 1}
                </span>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">

          {/* ── Step 1: Details ── */}
          {step === "details" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              {/* Guest / Sign in toggle */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setAsGuest(true)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold border transition-all ${asGuest ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"}`}
                >
                  Guest Checkout
                </button>
                <Link
                  href="/auth/signin"
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:border-[#1a6b2f] text-center transition-all"
                >
                  Sign In
                </Link>
              </div>

              <h2 className="font-bold text-base mb-4">Your Details</h2>
              <div className="space-y-4 mb-6">
                <Field id="name" label="Full Name *" value={form.name} onChange={(v) => setField("name", v)} error={errors.name} placeholder="e.g. Abubakar Zizu" autoComplete="name" />
                <Field id="phone" label="Phone Number *" type="tel" value={form.phone} onChange={(v) => setField("phone", v)} error={errors.phone} placeholder="e.g. 08012345678" autoComplete="tel" />
                <Field id="email" label="Email (optional)" type="email" value={form.email} onChange={(v) => setField("email", v)} error={errors.email} placeholder="For order updates" autoComplete="email" />
                <Field id="address" label="Delivery Address *" value={form.address} onChange={(v) => setField("address", v)} error={errors.address} placeholder="Street address" autoComplete="street-address" />
                <div className="grid grid-cols-2 gap-4">
                  <Field id="city" label="City *" value={form.city} onChange={(v) => setField("city", v)} error={errors.city} placeholder="e.g. Abuja" autoComplete="address-level2" />
                  <Field id="state" label="State *" value={form.state} onChange={(v) => setField("state", v)} error={errors.state} placeholder="e.g. FCT" autoComplete="address-level1" />
                </div>
              </div>

              {/* ── Delivery choice ── */}
              <div className="border-t border-gray-100 pt-6">
                <h2 className="font-bold text-base mb-1">Delivery Option</h2>
                <p className="text-xs text-gray-400 mb-4">Choose how you want your items handled after payment.</p>

                <div className="space-y-3" role="group" aria-label="Delivery option">
                  {/* Ship now */}
                  <label className={`flex gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${deliveryChoice === "ship" ? "border-[#1a6b2f] bg-[#1a6b2f]/5" : "border-gray-100 hover:border-gray-200"}`}>
                    <input
                      type="radio" name="delivery" value="ship"
                      checked={deliveryChoice === "ship"}
                      onChange={() => setDeliveryChoice("ship")}
                      className="accent-[#1a6b2f] mt-1 shrink-0"
                    />
                      <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#1a1a1a] text-sm">Ship Immediately</p>
                        <span className="text-xs font-bold text-[#1a1a1a]">{cartShippingCost === 0 ? "FREE" : `+₦${cartShippingCost.toLocaleString()}`}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {cartShippingCost === 0
                          ? <span className="text-[#1a6b2f] font-semibold">Free delivery for orders above ₦60,000 🎉</span>
                          : "We dispatch your order right away."
                        }
                        {shippingEstimate && form.state && (
                          <span className="text-[#1a6b2f] font-semibold"> Estimated delivery to {form.state}: {shippingEstimate}.</span>
                        )}
                      </p>
                      {deliveryChoice === "ship" && (
                        <p className="text-xs text-[#1a6b2f] mt-2 font-semibold">
                          📲 You&apos;ll be notified via SMS when your order ships.
                        </p>
                      )}
                    </div>
                  </label>

                  {/* Stockpile */}
                  <label className={`flex gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${deliveryChoice === "stockpile" ? "border-[#1a6b2f] bg-[#1a6b2f]/5" : "border-gray-100 hover:border-gray-200"}`}>
                    <input
                      type="radio" name="delivery" value="stockpile"
                      checked={deliveryChoice === "stockpile"}
                      onChange={() => setDeliveryChoice("stockpile")}
                      className="accent-[#1a6b2f] mt-1 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#1a1a1a] text-sm">Stockpile (Hold for later)</p>
                        <span className="text-xs font-bold text-[#1a6b2f]">No shipping now</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Pay for your items now, request delivery later when you&apos;re ready.
                        Shipping is charged separately when you request delivery.
                      </p>
                      {deliveryChoice === "stockpile" && (
                        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-xs text-amber-800 font-semibold">
                            ⏰ Stockpile limit: 1 month
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Your items will be held until <strong>{stockpileDeadline}</strong>. After that, you must request delivery or items may be released.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={() => { if (validateStep()) setStep("payment"); }}
                className="w-full mt-6 py-4 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === "payment" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <button onClick={() => setStep("details")} className="text-sm text-gray-400 hover:text-[#1a6b2f] mb-4 block transition-colors">
                ← Edit details
              </button>

              {/* Delivery confirmation banner */}
              <div className={`flex items-start gap-3 p-3 rounded-xl mb-6 text-sm ${deliveryChoice === "stockpile" ? "bg-amber-50 border border-amber-200" : "bg-[#1a6b2f]/5 border border-[#1a6b2f]/20"}`}>
                <span className="text-base shrink-0" aria-hidden="true">
                  {deliveryChoice === "stockpile" ? "📦" : "🚚"}
                </span>
                <p className={deliveryChoice === "stockpile" ? "text-amber-800" : "text-[#1a6b2f]"}>
                  {deliveryChoice === "stockpile"
                    ? `Your items will be stockpiled until ${stockpileDeadline}. Shipping charged separately when you request delivery.`
                    : `Shipping immediately to ${form.city || "your address"}${shippingEstimate ? ` — estimated ${shippingEstimate}` : ""}. You'll be notified via SMS.`
                  }
                </p>
              </div>

              <h2 className="font-bold text-base mb-4">Payment Method</h2>
              <div className="space-y-3 mb-6" role="group" aria-label="Choose payment method">
                {[
                  { id: "card", label: "Debit / Credit Card", icon: "💳" },
                  { id: "transfer", label: "Bank Transfer", icon: "🏦" },
                  { id: "wallet", label: "Digital Wallet (coming soon)", icon: "📱", disabled: true },
                ].map((m) => (
                  <label key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${payMethod === m.id ? "border-[#1a6b2f] bg-[#1a6b2f]/5" : "border-gray-100 hover:border-gray-200"} ${m.disabled ? "opacity-40 pointer-events-none" : ""}`}>
                    <input type="radio" name="payment" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} disabled={m.disabled} className="accent-[#1a6b2f]" />
                    <span className="text-lg" aria-hidden="true">{m.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>

              {payMethod === "card" && (
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Card Details</p>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="Card number" type="text" inputMode="numeric" aria-label="Card number" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="MM / YY" aria-label="Expiry date" />
                    <input className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a6b2f]" placeholder="CVV" type="password" aria-label="CVV" />
                  </div>
                </div>
              )}

              {payMethod === "transfer" && (
                <div className="p-4 bg-gray-50 rounded-xl mb-6 text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-[#1a1a1a]">Transfer to:</p>
                  <p>Bank: First Bank of Nigeria</p>
                  <p>Account: <span className="font-bold text-[#1a1a1a]">1234567890</span> — Thrift Collision</p>
                  <p className="text-xs text-gray-400 mt-1">Use your Order ID as reference.</p>
                </div>
              )}

              {/* Transparent totals */}
              <div className="p-4 bg-[#1a6b2f]/5 rounded-xl mb-6 border border-[#1a6b2f]/10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-3">Order Total</p>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Items subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#1a6b2f] font-semibold">
                      <span>Discount ({discountPct}%)</span><span>−₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {deliveryChoice === "stockpile"
                        ? <span className="text-amber-600 font-semibold">Charged later</span>
                        : shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-[#1a1a1a] pt-2 border-t border-[#1a6b2f]/10 mt-1">
                    <span>Total charged now</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full py-4 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 disabled:opacity-70 disabled:cursor-not-allowed text-base"
              >
                {submitting
                  ? "Processing…"
                  : `Place Order — ₦${total.toLocaleString()}`
                }
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">🔒 Secure & encrypted payment</p>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 rounded-2xl bg-white p-5 sticky top-24">
            <h2 className="font-bold mb-4">Your Items</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-3 text-sm">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#ede8d8] shrink-0">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1a1a1a] line-clamp-1 text-xs">{item.product.name}</p>
                    <p className="text-gray-400 text-[10px]">Size: {item.size}</p>
                  </div>
                  <p className="font-semibold text-[#1a6b2f] shrink-0 text-xs">₦{item.product.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5 text-sm text-gray-600">
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#1a6b2f] text-xs"><span>Discount</span><span>−₦{discountAmount.toLocaleString()}</span></div>
              )}
              <div className="flex justify-between text-xs">
                <span>Shipping</span>
                <span>{deliveryChoice === "stockpile" ? <span className="text-amber-600">Later</span> : shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1a1a1a] pt-2 border-t border-gray-100">
                <span>Total now</span><span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, error, placeholder, type = "text", autoComplete }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; error?: string;
  placeholder?: string; type?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${error ? "border-red-400 focus:border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
      />
      {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main>
        <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
          <CheckoutContent />
        </Suspense>
      </main>
    </>
  );
}
