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
import { createClient } from "@/lib/supabase/client";

type FormErrors = Partial<Record<string, string>>;

// Simple shipping estimate based on state
function getShippingEstimate(state: string): string {
  const Lagos = ["lagos"];
  const SameDay = ["abuja", "fct"];
  const s = state.toLowerCase();
  if (SameDay.some((x) => s.includes(x))) return "Same day – 1 day";
  if (Lagos.some((x) => s.includes(x))) return "2–4 business days";
  return "2–4 business days";
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, subtotal, clearCart, removeItem } = useCart();
  const { user, saveOrder, isSignedIn, supabaseUser } = useUser();

  const discountPct = Number(searchParams.get("discount") || 0);
  const discountType = searchParams.get("dtype") || "percentage";
  const discountValue = Number(searchParams.get("dvalue") || 0);
  const discountCode = searchParams.get("code") || "";

  const [step, setStep] = useState<"details" | "payment">("details");
  const [asGuest, setAsGuest] = useState(!user);
  const [deliveryChoice, setDeliveryChoice] = useState<"ship" | "stockpile">("ship");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [matchedZone, setMatchedZone] = useState<any>(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(65000);
  const [hasActiveStockpile, setHasActiveStockpile] = useState(false);
  const [stockpileInfo, setStockpileInfo] = useState("");
  const [heldWarning, setHeldWarning] = useState("");
  // When payment is blocked because item(s) are being checked out by someone
  // else, we hold the details here to render an inline "continue with the rest" card.
  // `permanent` = item is gone for good (SOLD); otherwise it's a temporary hold that may free up.
  const [heldBlock, setHeldBlock] = useState<{ names: string[]; message: string; permanent?: boolean } | null>(null);

  // Auto-detect existing stockpile for signed-in users
  useEffect(() => {
    if (user?.orders) {
      const active = user.orders.find(
        (o) => o.status === "stockpiled" && o.stockpiledUntil && new Date(o.stockpiledUntil) > new Date()
      );
      if (active) {
        setHasActiveStockpile(true);
        setDeliveryChoice("stockpile");
        const deadline = new Date(active.stockpiledUntil!).toLocaleDateString("en-NG", { day: "numeric", month: "long" });
        setStockpileInfo(`You have items stockpiled (due ${deadline}). This order will be added to your stockpile.`);
      }
    }
  }, [user]);

  // Soft heads-up: if any cart item is currently being checked out by someone
  // else (a fresh hold), warn the customer before they fill in their details.
  useEffect(() => {
    const productIds = items.map((i) => i.product.id).filter(Boolean);
    if (productIds.length === 0) { setHeldWarning(""); return; }

    const supabase = createClient();
    supabase
      .from("products")
      .select("name, held_until")
      .in("id", productIds)
      .then(({ data }) => {
        const now = Date.now();
        const held = (data ?? []).filter(
          (p: any) => p.held_until && new Date(p.held_until).getTime() > now
        );
        if (held.length > 0) {
          const names = held.map((p: any) => p.name).join(", ");
          setHeldWarning(
            `Heads up — ${names} ${held.length > 1 ? "are" : "is"} currently being checked out by someone else. ` +
            `${held.length > 1 ? "They're" : "It's"} one-of-one, so if they complete payment it'll be gone. You can still try — it may free up.`
          );
        } else {
          setHeldWarning("");
        }
      });
  }, [items]);

  const cartShippingCost = subtotal >= freeShippingThreshold ? 0 : Number(searchParams.get("shipping") || 3500);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.deliveryAddress || "",
    city: "",
    state: "",
  });

  // Load shipping zones and free shipping threshold from Supabase
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase
        .from("shipping_zones")
        .select("*")
        .eq("active", true)
        .then(({ data }) => {
          if (data) setShippingZones(data);
        });
      supabase
        .from("store_settings")
        .select("value")
        .eq("key", "free_shipping_threshold")
        .single()
        .then(({ data }) => {
          if (data?.value) setFreeShippingThreshold(Number(data.value));
        });
    });
  }, []);

  // Match zone when city/state/address changes
  useEffect(() => {
    if (shippingZones.length === 0) return;
    const searchText = `${form.address} ${form.city} ${form.state}`.toLowerCase();

    // Try to find a matching zone by name (e.g. "Garki", "Lugbe", "Lagos")
    const match = shippingZones.find((z) =>
      searchText.includes(z.zone_name.toLowerCase())
    );

    if (match) {
      setMatchedZone(match);
    } else {
      // Fallback: match by region based on state
      const state = form.state.toLowerCase();
      if (state.includes("abuja") || state.includes("fct")) {
        // Default Abuja rate if no specific zone matched
        const abujaDefault = shippingZones.find((z) => z.region === "Abuja") || null;
        setMatchedZone(abujaDefault);
      } else if (state.includes("lagos")) {
        const lagosZone = shippingZones.find((z) => z.region === "Lagos");
        setMatchedZone(lagosZone || null);
      } else if (state) {
        const otherZone = shippingZones.find((z) => z.region === "Other States");
        setMatchedZone(otherZone || null);
      } else {
        setMatchedZone(null);
      }
    }
  }, [form.address, form.city, form.state, shippingZones]);

  // Dynamic shipping cost from matched zone
  const dynamicShippingCost = matchedZone
    ? matchedZone.price_max
      ? Math.round((matchedZone.price_min + matchedZone.price_max) / 2)
      : matchedZone.price_min
    : Number(searchParams.get("shipping") || 3500);
  const actualShippingCost = subtotal >= freeShippingThreshold ? 0 : dynamicShippingCost;

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
  const discountAmount = discountType === "percentage"
    ? (discountPct ? Math.round((subtotal * discountPct) / 100) : 0)
    : discountType === "fixed"
      ? discountValue
      : 0;
  const shippingCost = deliveryChoice === "stockpile" ? 0 : actualShippingCost;
  const total = subtotal - discountAmount + shippingCost;
  const shippingEstimate = matchedZone?.delivery_days || (form.state ? getShippingEstimate(form.state) : null);

  // Stockpile deadline for display
  const stockpileDeadline = (() => {
    if (user) {
      const existingStockpile = user.orders?.find(
        (o) => o.status === "stockpiled" && o.stockpiledUntil && new Date(o.stockpiledUntil) > new Date()
      );
      if (existingStockpile?.stockpiledUntil) {
        return new Date(existingStockpile.stockpiledUntil).toLocaleDateString("en-NG", {
          day: "numeric", month: "long", year: "numeric",
        });
      }
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  })();

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

  async function handlePlaceOrder(excludeIds: number[] = []) {
    // Re-validate before payment
    if (!form.phone.trim()) {
      alert("Phone number is required for delivery. Please go back and add it.");
      setStep("details");
      return;
    }

    // Items to actually order — minus any the customer chose to drop (held by others).
    const orderItemsList = items.filter((i) => !excludeIds.includes(i.product.id));
    if (orderItemsList.length === 0) {
      alert("There's nothing left to check out. Head back to the shop to keep browsing.");
      return;
    }

    // Recompute money on just the items being ordered (mirrors the outer cost formula).
    const isFullCart = orderItemsList.length === items.length;
    const orderSubtotal = isFullCart ? subtotal : orderItemsList.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const orderDiscountAmount = discountType === "percentage"
      ? (discountPct ? Math.round((orderSubtotal * discountPct) / 100) : 0)
      : discountType === "fixed"
        ? Math.min(discountValue, orderSubtotal)
        : 0;
    const orderShippingCost = deliveryChoice === "stockpile" ? 0 : actualShippingCost;
    const orderTotal = orderSubtotal - orderDiscountAmount + orderShippingCost;

    setSubmitting(true);
    setHeldBlock(null);
    try {
      // Check if any items are sold before proceeding
      const { createClient: createSB } = await import("@/lib/supabase/client");
      const sb = createSB();
      const productIds = orderItemsList.map((i) => i.product.id);
      const { data: currentProducts } = await sb
        .from("products")
        .select("id, name, tag")
        .in("id", productIds);

      if (currentProducts) {
        const soldOut = currentProducts.filter((p: any) => p.tag === "SOLD");
        if (soldOut.length > 0) {
          const soldNames: string[] = soldOut.map((p: any) => p.name);
          const names = soldNames.join(", ");
          const multiple = soldNames.length > 1;
          const remaining = orderItemsList.length - soldNames.length;
          setSubmitting(false);
          // Same one-tap card as the held-item case, so the experience is consistent.
          setHeldBlock({
            names: soldNames,
            permanent: true,
            message: `${names} ${multiple ? "have" : "has"} just been snapped up — ${multiple ? "they're" : "it's"} one-of-one, so ${multiple ? "they're" : "it's"} gone.` +
              (remaining > 0
                ? ` Don't lose the rest of your cart — check out the ${remaining > 1 ? "items" : "item"} still available.`
                : ""),
          });
          return;
        }
      }

      const orderId = "TC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const fullAddress = [form.address, form.city, form.state].filter(Boolean).join(", ");
      
      // Check for existing active stockpile if user chose stockpile
      let stockpileExpiry = new Date();
      stockpileExpiry.setMonth(stockpileExpiry.getMonth() + 1);

      if (deliveryChoice === "stockpile" && user) {
        // Look for an existing stockpiled order within the last month
        const existingStockpile = user.orders?.find(
          (o) => o.status === "stockpiled" && o.stockpiledUntil && new Date(o.stockpiledUntil) > new Date()
        );
        if (existingStockpile?.stockpiledUntil) {
          // Use the same deadline as the existing stockpile
          stockpileExpiry = new Date(existingStockpile.stockpiledUntil);
        }
      }

      const order: Order = {
        orderId,
        date: new Date().toISOString(),
        items: orderItemsList.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.image,
          size: i.size,
          quantity: i.quantity,
          price: i.product.price,
        })),
        subtotal: orderSubtotal,
        shippingCost: orderShippingCost,
        discountAmount: orderDiscountAmount,
        total: orderTotal,
        deliveryAddress: fullAddress,
        payMethod: "paystack",
        status: "pending",
        isStockpile: deliveryChoice === "stockpile",
        stockpiledUntil: deliveryChoice === "stockpile" ? stockpileExpiry.toISOString() : undefined,
      };

      // Save order to Supabase first
      // Save order to Supabase directly (works for both guests and signed-in users)
      const { data: orderRow, error: orderError } = await sb.from("orders").insert({
        order_id: orderId,
        user_id: supabaseUser?.id ?? null,
        guest_phone: form.phone || null,
        guest_name: form.name || null,
        guest_email: form.email || null,
        status: "pending",
        subtotal: orderSubtotal,
        shipping_cost: orderShippingCost,
        discount_amount: orderDiscountAmount,
        discount_code: discountCode || null,
        total: orderTotal,
        delivery_address: fullAddress,
        pay_method: "paystack",
        is_stockpile: deliveryChoice === "stockpile",
        stockpiled_until: deliveryChoice === "stockpile" ? stockpileExpiry.toISOString() : null,
      }).select("id").single();

      if (orderError || !orderRow) {
        console.error("Order save error:", orderError);
        setSubmitting(false);
        alert("We couldn't create your order. Please try again. If this keeps happening, contact us.");
        return;
      }

      // Save order items
      if (orderRow && order.items.length > 0) {
        await sb.from("order_items").insert(
          order.items.map((i) => ({
            order_id: orderRow.id,
            product_id: i.productId,
            product_name: i.productName,
            product_image: i.productImage,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
          }))
        );
      }

      // NOTE: discount usage is counted server-side once payment is confirmed
      // (see /api/payments/verify and /api/payments/webhook). We intentionally
      // do NOT increment here — that would count abandoned checkouts.

      // Initialize Paystack payment
      const payRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email || `guest_${Date.now()}@thriftcollision.com`,
          amount: orderTotal,
          orderId,
          metadata: {
            customer_name: form.name,
            phone: form.phone,
            delivery_address: fullAddress,
            is_stockpile: deliveryChoice === "stockpile",
          },
        }),
      });

      const payData = await payRes.json();

      // One or more items are currently being checked out by someone else.
      // Surface an inline card so the customer can drop them and grab the rest fast.
      if (payRes.status === 409 && payData.error === "item_held") {
        setSubmitting(false);
        setHeldBlock({
          names: Array.isArray(payData.heldItems) ? payData.heldItems : [],
          message: payData.message || "One of your items is currently being checked out by someone else.",
        });
        return;
      }

      if (!payRes.ok || !payData.authorization_url) {
        setSubmitting(false);
        alert("Payment initialization failed: " + (payData.error || "Please try again"));
        return;
      }

      // Redirect to Paystack — cart stays intact until payment is confirmed
      window.location.href = payData.authorization_url;
    } catch {
      setSubmitting(false);
      alert("Something went wrong placing your order. Please try again.");
    }
  }

  // "Continue with available items" — drop the held item(s) from the cart and
  // immediately re-run checkout on whatever's left, so the customer doesn't lose
  // the rest of their cart to another buyer while they hesitate.
  function continueWithoutHeld() {
    if (!heldBlock) return;
    const heldNames = new Set(heldBlock.names);
    const heldItems = items.filter((i) => heldNames.has(i.product.name));
    const excludeIds = heldItems.map((i) => i.product.id);

    // Remove the held items from the cart.
    heldItems.forEach((i) => removeItem(i.product.id, i.size));

    setHeldBlock(null);

    // Re-run checkout excluding the held items. Pass the IDs explicitly since
    // the cart state update above hasn't flushed yet.
    handlePlaceOrder(excludeIds);
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

      {heldWarning && !heldBlock && (
        <div className="mb-6 flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-xl" role="status">
          <span className="text-lg shrink-0" aria-hidden="true">👀</span>
          <p className="text-sm text-amber-800 leading-relaxed">{heldWarning}</p>
        </div>
      )}

      {heldBlock && (() => {
        const remaining = items.length - heldBlock.names.length;
        return (
          <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl" role="alert">
            <div className="flex items-start gap-2.5 mb-4">
              <span className="text-xl shrink-0" aria-hidden="true">{heldBlock.permanent ? "🏷️" : "⏳"}</span>
              <p className="text-sm text-amber-900 leading-relaxed font-medium">{heldBlock.message}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              {remaining > 0 && (
                <button
                  onClick={continueWithoutHeld}
                  className="flex-1 py-3 bg-[#1a6b2f] text-white font-bold rounded-full text-sm hover:bg-[#104020] transition-colors"
                >
                  Continue with available {remaining > 1 ? "items" : "item"}
                </button>
              )}
              <button
                onClick={() => setHeldBlock(null)}
                className="flex-1 py-3 border-2 border-amber-300 text-amber-800 font-bold rounded-full text-sm hover:bg-amber-100 transition-colors"
              >
                {heldBlock.permanent
                  ? (remaining > 0 ? "Not now" : "Back to my cart")
                  : (remaining > 0 ? "Wait & keep everything" : "OK, I'll wait")}
              </button>
            </div>
          </div>
        );
      })()}

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
                <Field
                  id="email"
                  label={isSignedIn ? "Email" : "Email (optional)"}
                  type="email"
                  value={form.email}
                  onChange={(v) => setField("email", v)}
                  error={errors.email}
                  placeholder="For order updates"
                  autoComplete="email"
                  readOnly={isSignedIn && !!form.email}
                  hint={isSignedIn && !!form.email ? "Linked to your account" : undefined}
                />
                <Field id="address" label="Delivery Address *" value={form.address} onChange={(v) => setField("address", v)} error={errors.address} placeholder="Street address" autoComplete="street-address" />
                <div className="grid grid-cols-2 gap-4">
                  <Field id="city" label="City *" value={form.city} onChange={(v) => setField("city", v)} error={errors.city} placeholder="e.g. Abuja" autoComplete="address-level2" />
                  <Field id="state" label="State *" value={form.state} onChange={(v) => setField("state", v)} error={errors.state} placeholder="e.g. FCT" autoComplete="address-level1" />
                </div>
              </div>

              {/* ── Delivery choice ── */}
              <div className="border-t border-gray-100 pt-6">
                <h2 className="font-bold text-base mb-1">Delivery Option</h2>

                {hasActiveStockpile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                    <p className="text-xs text-blue-800 font-semibold">📦 {stockpileInfo}</p>
                  </div>
                )}
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
                        <span className="text-xs font-bold text-[#1a1a1a]">{actualShippingCost === 0 ? "FREE" : `+₦${actualShippingCost.toLocaleString()}`}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {actualShippingCost === 0
                          ? <span className="text-[#1a6b2f] font-semibold">Free delivery for orders above ₦{freeShippingThreshold.toLocaleString()} 🎉</span>
                          : matchedZone
                            ? <span>Delivering to <strong>{matchedZone.zone_name}</strong> — {matchedZone.delivery_days}.</span>
                            : "We dispatch your order right away."
                        }
                        {!matchedZone && shippingEstimate && form.state && (
                          <span className="text-[#1a6b2f] font-semibold"> Estimated delivery to {form.state}: {shippingEstimate}.</span>
                        )}
                      </p>
                      {matchedZone?.notes && actualShippingCost > 0 && (
                        <p className="text-xs text-gray-400 mt-1">{matchedZone.notes}</p>
                      )}
                      {deliveryChoice === "ship" && (
                        <p className="text-xs text-[#1a6b2f] mt-2 font-semibold">
                          📲 You&apos;ll be notified via WhatsApp when your order ships.
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
                    : `Shipping immediately to ${form.city || "your address"}${shippingEstimate ? ` — estimated ${shippingEstimate}` : ""}. You'll be notified via WhatsApp.`
                  }
                </p>
              </div>

              <h2 className="font-bold text-base mb-4">Payment Method</h2>
              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <p className="text-sm font-semibold text-[#1a1a1a]">Secure payment via Paystack</p>
                </div>
                <p className="text-xs text-gray-500">
                  You&apos;ll be redirected to Paystack&apos;s secure payment page. Pay with card, bank transfer, or USSD — all options available. We never see or store your payment details.
                </p>
              </div>

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

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-3">
                <span className="text-base shrink-0" aria-hidden="true">⏳</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Every piece is one-of-one. Once you continue, your {items.length > 1 ? "items are" : "item is"} held just for you for 5 minutes to complete payment.
                </p>
              </div>

              <button
                onClick={() => handlePlaceOrder()}
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

function Field({ id, label, value, onChange, error, placeholder, type = "text", autoComplete, readOnly, hint }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; error?: string;
  placeholder?: string; type?: string; autoComplete?: string;
  readOnly?: boolean; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
          readOnly
            ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            : error
            ? "border-red-400 focus:border-red-400 bg-red-50"
            : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"
        }`}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
      />
      {hint && !error && <p id={`${id}-hint`} className="text-gray-400 text-xs mt-1">{hint}</p>}
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
