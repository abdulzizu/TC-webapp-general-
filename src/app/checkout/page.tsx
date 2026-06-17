"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/lib/user-context";

type FormErrors = Partial<Record<string, string>>;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useUser();

  const shippingCost = Number(searchParams.get("shipping") || 3500);
  const discountPct = Number(searchParams.get("discount") || 0);
  const discountCode = searchParams.get("code") || "";
  const discountAmount = discountPct ? Math.round((subtotal * discountPct) / 100) : 0;
  const total = subtotal - discountAmount + shippingCost;

  const [step, setStep] = useState<"details" | "payment">("details");
  const [asGuest, setAsGuest] = useState(true);
  const [payMethod, setPayMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: "",
    address: user?.deliveryAddress || "",
    city: "",
    state: "",
  });

  // Autofill from user profile
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.name, phone: user.phone, address: user.deliveryAddress }));
    }
  }, [user]);

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // Real-time inline validation
    setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  }

  function validateField(field: string, value: string): string {
    switch (field) {
      case "name": return value.trim().length < 2 ? "Please enter your full name" : "";
      case "phone": return !/^[\d\s+\-()]{10,15}$/.test(value.trim()) ? "Enter a valid phone number" : "";
      case "email": return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Enter a valid email" : "";
      case "address": return value.trim().length < 5 ? "Enter your delivery address" : "";
      case "city": return value.trim().length < 2 ? "Enter your city" : "";
      case "state": return value.trim().length < 2 ? "Enter your state" : "";
      default: return "";
    }
  }

  function validateStep(): boolean {
    const requiredFields = ["name", "phone", "address", "city", "state"];
    const newErrors: FormErrors = {};
    requiredFields.forEach((f) => {
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

  function handleContinue() {
    if (validateStep()) setStep("payment");
  }

  async function handlePlaceOrder() {
    setSubmitting(true);
    // Simulate order processing
    await new Promise((r) => setTimeout(r, 1500));
    const orderId = "TC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    clearCart();
    router.push(`/order-confirmation?orderId=${orderId}&name=${encodeURIComponent(form.name)}&guest=${asGuest}`);
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
      {/* Distraction-free header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Checkout</h1>
        <Link href="/cart" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors">← Back to cart</Link>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-8" aria-label="Checkout steps">
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === "details" ? "text-[#1a6b2f]" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "details" ? "bg-[#1a6b2f] text-white" : "bg-gray-200 text-gray-500"}`}>1</span>
          Details
        </div>
        <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === "payment" ? "text-[#1a6b2f]" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "payment" ? "bg-[#1a6b2f] text-white" : "bg-gray-200 text-gray-500"}`}>2</span>
          Payment
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {step === "details" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              {/* Guest vs Account */}
              <div className="flex gap-3 mb-6">
                <button onClick={() => setAsGuest(true)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold border transition-all ${asGuest ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"}`}>
                  Guest Checkout
                </button>
                <Link href="/auth/signin"
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold border text-center transition-all ${!asGuest ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"}`}>
                  Sign In
                </Link>
              </div>

              <h2 className="font-bold text-base mb-4">Delivery Details</h2>
              <div className="space-y-4">
                <Field id="name" label="Full Name *" value={form.name} onChange={(v) => setField("name", v)} error={errors.name} placeholder="e.g. Abubakar Zizu" autoComplete="name" />
                <Field id="phone" label="Phone Number *" type="tel" value={form.phone} onChange={(v) => setField("phone", v)} error={errors.phone} placeholder="e.g. 08012345678" autoComplete="tel" />
                <Field id="email" label="Email (optional)" type="email" value={form.email} onChange={(v) => setField("email", v)} error={errors.email} placeholder="For order confirmation" autoComplete="email" />
                <Field id="address" label="Delivery Address *" value={form.address} onChange={(v) => setField("address", v)} error={errors.address} placeholder="Street address" autoComplete="street-address" />
                <div className="grid grid-cols-2 gap-4">
                  <Field id="city" label="City *" value={form.city} onChange={(v) => setField("city", v)} error={errors.city} placeholder="e.g. Abuja" autoComplete="address-level2" />
                  <Field id="state" label="State *" value={form.state} onChange={(v) => setField("state", v)} error={errors.state} placeholder="e.g. FCT" autoComplete="address-level1" />
                </div>
              </div>

              <button onClick={handleContinue}
                className="w-full mt-6 py-4 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20">
                Continue to Payment
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <button onClick={() => setStep("details")} className="text-sm text-gray-400 hover:text-[#1a6b2f] mb-4 block">← Edit details</button>
              <h2 className="font-bold text-base mb-4">Payment Method</h2>

              <div className="space-y-3 mb-6" role="group" aria-label="Choose payment method">
                {[
                  { id: "card", label: "Debit / Credit Card", icon: "💳" },
                  { id: "transfer", label: "Bank Transfer", icon: "🏦" },
                  { id: "wallet", label: "Digital Wallet (coming soon)", icon: "📱", disabled: true },
                ].map((m) => (
                  <label key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${payMethod === m.id ? "border-[#1a6b2f] bg-[#1a6b2f]/5" : "border-gray-100 hover:border-gray-200"} ${m.disabled ? "opacity-40 pointer-events-none" : ""}`}>
                    <input type="radio" name="payment" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)}
                      disabled={m.disabled} className="accent-[#1a6b2f]" />
                    <span className="text-lg" aria-hidden="true">{m.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>

              {payMethod === "card" && (
                <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl">
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
                  <p>Account Number: <span className="font-bold text-[#1a1a1a]">1234567890</span></p>
                  <p>Account Name: Thrift Collision</p>
                  <p className="text-xs text-gray-400 mt-2">Use your order ID as the transfer reference after placing order.</p>
                </div>
              )}

              {/* Transparent total */}
              <div className="p-4 bg-[#1a6b2f]/5 rounded-xl mb-6 border border-[#1a6b2f]/10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-2">Order Total</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-[#1a6b2f]"><span>Discount ({discountPct}%)</span><span>−₦{discountAmount.toLocaleString()}</span></div>}
                  <div className="flex justify-between"><span>Shipping</span><span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span></div>
                  <div className="flex justify-between font-bold text-base text-[#1a1a1a] pt-2 border-t border-[#1a6b2f]/10 mt-2">
                    <span>Total (inc. all charges)</span><span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full py-4 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 disabled:opacity-70 disabled:cursor-not-allowed text-base"
              >
                {submitting ? "Processing…" : `Place Order — ₦${total.toLocaleString()}`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">🔒 Secure & encrypted payment</p>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 rounded-2xl bg-white p-5 sticky top-24">
            <h2 className="font-bold mb-4">Your Items</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-3 text-sm">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#ede8d8] shrink-0">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1a1a1a] line-clamp-1">{item.product.name}</p>
                    <p className="text-gray-400 text-xs">Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[#1a6b2f] shrink-0">₦{(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm text-gray-600">
              {discountAmount > 0 && <div className="flex justify-between text-[#1a6b2f]"><span>Discount</span><span>−₦{discountAmount.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span></div>
              <div className="flex justify-between font-bold text-base text-[#1a1a1a] pt-2 border-t border-gray-100">
                <span>Total</span><span>₦{total.toLocaleString()}</span>
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
        placeholder={placeholder}
        autoComplete={autoComplete}
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
