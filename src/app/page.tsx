"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MarqueeBanner from "@/components/MarqueeBanner";
import { createClient } from "@/lib/supabase/client";
import { useProducts } from "@/lib/use-products";

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const [cards, setCards] = useState<{ label: string; price: string; size: string; tag: string; image_url: string; product_id: number | null }[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("featured_products")
      .select("label, price, size, tag, image_url, product_id")
      .order("display_order", { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setCards(data as any);
      });
  }, []);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (cards.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % cards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [cards.length]);

  function prev() { setCurrent((c) => (c - 1 + cards.length) % cards.length); }
  function next() { setCurrent((c) => (c + 1) % cards.length); }

  // Fallback while loading
  if (cards.length === 0) {
    return (
      <section className="relative h-[85vh] sm:h-[90vh] bg-[#1a1a1a] flex items-center justify-center">
        <h1 className="sr-only">Thrift Collision — Unisex Thrifted Streetwear in Nigeria. Curated and Dropped Weekly.</h1>
        <div className="text-center px-4">
          <h2 className="text-4xl sm:text-6xl font-700 text-white mb-4">Thrift Collision</h2>
          <p className="text-white/60 text-lg">Unisex thrifted streetwear, curated and dropped weekly.</p>
          <Link href="/shop" className="mt-8 inline-block btn-tc-primary px-8 py-3.5 text-sm rounded-full">
            Shop the Drop
          </Link>
        </div>
      </section>
    );
  }

  const card = cards[current];

  return (
    <section className="relative h-[85vh] sm:h-[90vh] overflow-hidden bg-[#1a1a1a]" aria-label="Featured products">
      {/* Background image slides */}
      {cards.map((c, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={c.image_url}
            alt={c.label}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>
      ))}

      {/* Hidden h1 for SEO — visible to crawlers and screen readers */}
      <h1 className="sr-only">Thrift Collision — Unisex Thrifted Streetwear in Nigeria. Curated and Dropped Weekly.</h1>

      {/* Content overlay */}
      <div className="relative h-full flex flex-col items-center justify-end pb-16 sm:pb-24 px-4 text-center z-10">
        <span className="text-xs font-700 tracking-widest uppercase text-white/60 mb-3">
          Featured Drop
        </span>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-700 text-white leading-tight mb-3 max-w-2xl">
          {card.label}
        </h2>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-lg sm:text-xl font-700 text-[#1a6b2f]">{card.price}</span>
          <span className="text-sm text-white/60 border border-white/20 rounded px-2 py-0.5">{card.size}</span>
          {card.tag && (
            <span className={`text-[10px] font-700 tracking-wider px-2 py-0.5 rounded-full ${
              card.tag === "SOLD OUT" ? "bg-red-500/80 text-white" : card.tag === "NEW" || card.tag === "STAFF PICK" ? "bg-[#1a6b2f] text-white" : card.tag === "ESSENTIAL" ? "bg-purple-500 text-white" : "bg-amber-400 text-[#1a1a1a]"
            }`}>
              {card.tag}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {card.product_id ? (
            <Link
              href={`/product/${card.product_id}`}
              className="btn-tc-primary px-8 py-3.5 text-sm rounded-full inline-flex items-center gap-2"
            >
              Shop this item
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <Link href="/shop" className="btn-tc-primary px-8 py-3.5 text-sm rounded-full">
              Shop the Drop
            </Link>
          )}
          <Link href="/shop" className="btn-tc-outline px-6 py-3.5 text-sm rounded-full text-white border-white/30 hover:bg-white/10">
            See All
          </Link>
        </div>

        {/* Tagline */}
        <p className="text-sm italic text-white/50 mt-6">
          Every drop hides a discovery.
        </p>
      </div>

      {/* Side arrows */}
      {cards.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
            aria-label="Previous item"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
            aria-label="Next item"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {cards.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-6" : "bg-white/40"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: "🔔",
      title: "Get Notified",
      desc: "Sign up to be first-to-know when a new drop goes live. No noise — just the drop.",
    },
    {
      num: "02",
      icon: "👀",
      title: "Browse the Drop",
      desc: "Each item is photographed, sized, and priced. Filter by size, colour, and price.",
    },
    {
      num: "03",
      icon: "🛒",
      title: "Secure Your Pick",
      desc: "Add to cart and checkout in under 60 seconds. Guest checkout always available.",
    },
    {
      num: "04",
      icon: "📦",
      title: "We Ship to You",
      desc: "Transparent shipping costs and timelines upfront. Track your order end-to-end.",
    },
  ];

  return (
    <section id="how-it-works" className="py-10 sm:py-14 bg-[#1a1a1a]" aria-labelledby="how-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-700 tracking-widest uppercase text-[#1a6b2f] mb-2 block">
            Simple Process
          </span>
          <h2 id="how-heading" className="text-3xl sm:text-4xl font-700 text-white leading-tight">
            How it works
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative border border-white/10 rounded-xl p-4 hover:border-[#1a6b2f]/50 transition-colors"
            >
              <span className="text-[#1a6b2f]/30 font-700 text-3xl absolute top-3 right-4 select-none" aria-hidden="true">
                {step.num}
              </span>
              <span className="text-2xl mb-2 block" aria-hidden="true">{step.icon}</span>
              <h3 className="text-white font-600 text-sm mb-1">{step.title}</h3>
              <p className="text-[#9ca3af] text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Current Drop ────────────────────────────────────────────────────────────

function ProductGrid() {
  const { products, isLoading } = useProducts();
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Available", "Clothing", "Accessories", "Shoes"];

  const filtered =
    filter === "All" ? products
    : filter === "Available" ? products.filter((i) => i.available && i.tag !== "SOLD OUT")
    : products.filter((i) => i.category === filter);

  // Homepage shows max 8 items — prioritize NEW tagged items, then most recent
  const displayItems = [...filtered]
    .sort((a, b) => {
      if (a.tag === "NEW" && b.tag !== "NEW") return -1;
      if (b.tag === "NEW" && a.tag !== "NEW") return 1;
      return b.id - a.id; // newest first
    })
    .slice(0, 8);

  return (
    <section id="shop" className="py-16 sm:py-24 newspaper-bg" aria-labelledby="shop-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-700 tracking-widest uppercase text-[#1a6b2f] mb-2 block">
              Current Drop
            </span>
            <h2 id="shop-heading" className="text-4xl sm:text-5xl font-700 text-[#1a1a1a] leading-tight">
              This week&apos;s pieces
            </h2>
          </div>
          <Link
            href="/shop"
            className="btn-tc-primary px-5 py-2.5 text-xs rounded-full self-start sm:self-auto"
          >
            See all products →
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8" role="group" aria-label="Filter by category">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 text-xs font-600 rounded-full border transition-all ${
                filter === cat
                  ? "bg-[#1a6b2f] border-[#1a6b2f] text-white"
                  : "border-[#1a1a1a]/20 text-[#1a1a1a] hover:border-[#1a6b2f] hover:text-[#1a6b2f]"
              }`}
              aria-pressed={filter === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-[#1a1a1a]/10 bg-[#ede8d8] animate-pulse">
                  <div className="w-full aspect-square bg-[#d4cdb8]" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-[#d4cdb8] rounded w-1/2" />
                    <div className="h-3 bg-[#d4cdb8] rounded w-3/4" />
                    <div className="h-3 bg-[#d4cdb8] rounded w-1/3" />
                  </div>
                </div>
              ))
            : displayItems.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))
          }
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  item,
}: {
  item: {
    id: number;
    name: string;
    category: string;
    subcategory: string;
    price: number;
    size: string;
    tag: string;
    image: string;
  };
}) {
  const isSoldOut = item.tag === "SOLD OUT";
  const tagColor =
    isSoldOut
      ? "bg-red-500 text-white"
      : item.tag === "NEW" || item.tag === "STAFF PICK"
      ? "bg-[#1a6b2f] text-white"
      : item.tag === "ESSENTIAL"
      ? "bg-purple-500 text-white"
      : "bg-amber-400 text-[#1a1a1a]";

  return (
    <Link href={`/product/${item.id}`} className={`product-card rounded-2xl overflow-hidden border border-[#1a1a1a]/10 bg-[#ede8d8] block ${isSoldOut ? "opacity-70" : ""}`}>
      {/* Product image */}
      <div className="relative w-full aspect-square overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No image</div>
        )}
        {item.tag && (
          <span
            className={`absolute top-2.5 left-2.5 text-[10px] font-700 tracking-wider px-2 py-0.5 rounded-full ${tagColor}`}
          >
            {item.tag}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">{item.subcategory}</p>
        <p className="text-sm font-semibold text-[#1a1a1a] leading-snug mb-2 line-clamp-2">{item.name}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#1a6b2f]">₦{item.price.toLocaleString()}</p>
          <span className="text-[10px] text-[#6b7280] border border-[#6b7280]/30 rounded px-1.5 py-0.5">{item.size}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Drop Countdown ──────────────────────────────────────────────────────────

function NextDrop() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [dropDay, setDropDay] = useState(5); // 0=Sun, 1=Mon, ... 5=Fri

  // Load drop day from settings
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.from("store_settings").select("value").eq("key", "drop_day").single()
        .then(({ data }) => {
          if (data?.value) setDropDay(Number(data.value));
        });
    });
  }, []);

  useEffect(() => {
    function getNextDropDate(): Date {
      const now = new Date();
      const day = now.getDay();
      let daysUntil = (dropDay - day + 7) % 7;
      if (daysUntil === 0 && now.getHours() >= 12) daysUntil = 7;
      const target = new Date(now);
      target.setDate(target.getDate() + daysUntil);
      target.setHours(12, 0, 0, 0);
      return target;
    }

    function update() {
      const now = new Date();
      const target = getNextDropDate();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const secs = Math.floor(diff / 1000);
      setTimeLeft({
        days: Math.floor(secs / 86400),
        hours: Math.floor((secs % 86400) / 3600),
        mins: Math.floor((secs % 3600) / 60),
        secs: secs % 60,
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [dropDay]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <section id="drops" className="py-16 sm:py-20 bg-[#1a6b2f] relative overflow-hidden" aria-labelledby="drop-heading">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.3) 30px, rgba(255,255,255,0.3) 31px)`,
        }}
        aria-hidden="true"
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <span className="text-xs font-700 tracking-widest uppercase text-white/60 mb-4 block">
          Coming Soon
        </span>
        <h2 id="drop-heading" className="text-4xl sm:text-5xl font-700 text-white mb-4 leading-tight">
          Next drop drops {dayNames[dropDay]}.
        </h2>
        <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto">
          New pieces every week. Sign up and be the first in line — limited stock means fast fingers win.
        </p>

        {/* Live countdown */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-10">
          {[
            { val: String(timeLeft.days).padStart(2, "0"), label: "Days" },
            { val: String(timeLeft.hours).padStart(2, "0"), label: "Hours" },
            { val: String(timeLeft.mins).padStart(2, "0"), label: "Mins" },
            { val: String(timeLeft.secs).padStart(2, "0"), label: "Secs" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl sm:text-5xl font-700 text-white bg-white/10 rounded-xl px-4 py-3 min-w-[64px] sm:min-w-[80px] font-mono">
                {item.val}
              </div>
              <p className="text-white/60 text-xs uppercase tracking-widest mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <Link
          href="#notify"
          className="inline-flex items-center gap-2 bg-white text-[#1a6b2f] font-700 px-8 py-3.5 rounded-full text-sm hover:bg-[#f5f0e8] transition-colors"
        >
          Lock in my spot
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

// ─── Sustainability Section ──────────────────────────────────────────────────

function Sustainability() {
  return (
    <section id="about" className="py-16 sm:py-24 newspaper-bg" aria-labelledby="sustain-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-700 tracking-widest uppercase text-[#1a6b2f] mb-4 block">
              Our Mission
            </span>
            <h2 id="sustain-heading" className="text-4xl sm:text-5xl font-700 text-[#1a1a1a] leading-tight mb-6">
              Curating the best<br />in thrifted drops.
            </h2>
            <p className="text-[#4b5563] text-lg leading-relaxed mb-6">
              Thrift Collision started as a hobby, then grew into a community. Now you get to be part of it. We&apos;ve become the go-to destination for style-conscious shoppers, offering the widest range of selected thrifted streetwear.
            </p>
            <p className="text-[#4b5563] text-lg leading-relaxed mb-8">
              We&apos;ve added sustainability to the mission. That&apos;s why we&apos;ve launched our reworked label. From our logo to the newspaper backdrop in our photos, nothing is just aesthetic. It&apos;s a statement. Recycled fashion, old stories, new fits. Sustainability woven into every drop.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { stat: "100%", label: "Pre-owned pieces" },
                { stat: "0", label: "New garments made" },
                { stat: "♻️", label: "Circular fashion" },
              ].map((item) => (
                <div key={item.label} className="border border-[#1a6b2f]/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-700 text-[#1a6b2f] mb-1">{item.stat}</p>
                  <p className="text-xs text-[#6b7280] leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual block */}
          <div className="relative">
            <div
              className="rounded-2xl aspect-square flex items-center justify-center border border-[#1a1a1a]/10"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(26,26,26,0.06) 22px, rgba(26,26,26,0.06) 23px), repeating-linear-gradient(90deg, transparent, transparent 22px, rgba(26,26,26,0.03) 22px, rgba(26,26,26,0.03) 23px)`,
                backgroundColor: "#e8e0cc",
              }}
            >
              <Image
                src="/tc-logo.png"
                alt="Thrift Collision — sustainably thrifted streetwear"
                width={260}
                height={260}
                className="object-contain opacity-80"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#1a6b2f] text-white rounded-2xl p-4 text-center shadow-lg">
              <p className="text-2xl font-700">IG</p>
              <p className="text-xs opacity-80">@thriftcollision</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sign-up / Notify ────────────────────────────────────────────────────────

function NotifySignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("temp_leads").insert({
        phone: `email_${Date.now()}`,
        email: email.trim(),
        verified: false,
      });
      if (error) {
        console.error("Lead signup error:", error.message);
        throw error;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="notify" className="py-16 sm:py-24 bg-[#1a1a1a]" aria-labelledby="notify-heading">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <span className="text-xs font-700 tracking-widest uppercase text-[#1a6b2f] mb-4 block">
          First-to-Know
        </span>
        <h2 id="notify-heading" className="text-4xl sm:text-5xl font-700 text-white leading-tight mb-4">
          Never miss a drop.
        </h2>
        <p className="text-[#9ca3af] text-lg mb-10">
          Sign up to be the first to hear about our newest drops, exclusive promos and more!
        </p>

        {submitted ? (
          <div className="bg-[#1a6b2f]/20 border border-[#1a6b2f] rounded-2xl p-8" role="alert" aria-live="polite">
            <p className="text-3xl mb-3" aria-hidden="true">✅</p>
            <p className="text-white font-600 text-lg">You&apos;re on the list!</p>
            <p className="text-[#9ca3af] text-sm mt-1">We&apos;ll email you right before the next drop goes live.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div>
              <label htmlFor="notify-email" className="sr-only">Email address</label>
              <input
                id="notify-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-2 focus:ring-[#1a6b2f]/30 transition"
                aria-required="true"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-tc-primary py-3.5 rounded-full text-sm disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Notify me"}
            </button>
            {submitError && (
              <p className="text-red-400 text-xs text-center" role="alert">{submitError}</p>
            )}
            <p className="text-[#6b7280] text-xs">
              We&apos;ll only email you about new drops. No spam. Unsubscribe any time.
            </p>
          </form>
        )}

        {/* Auth links */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-[#9ca3af] text-sm mb-4">Already shopped with us?</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/auth/signin"
              className="btn-tc-outline px-6 py-2.5 text-xs rounded-full"
            >
              Sign In
            </Link>
            <Link
              href="/profile"
              className="btn-tc-primary px-6 py-2.5 text-xs rounded-full"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0d0d0d] text-white py-12 px-4 sm:px-6" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/tc-logo.png"
              alt="Thrift Collision"
              width={56}
              height={56}
              className="object-contain mb-4"
            />
            <p className="text-[#9ca3af] text-sm leading-relaxed max-w-xs">
              Curating the best in thrifted drops. Unisex streetwear. Sustainably sourced.
              Built for the culture.
            </p>
            <div className="flex gap-4 mt-5">
              <a
                href="https://www.instagram.com/thriftcollision/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9ca3af] hover:text-[#1a6b2f] transition-colors text-sm font-500"
                aria-label="Thrift Collision on Instagram"
              >
                Instagram ↗
              </a>
              <a
                href="https://wa.me/2348061979299"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9ca3af] hover:text-[#1a6b2f] transition-colors text-sm font-500"
              >
                WhatsApp ↗
              </a>
              <a
                href="https://x.com/thriftcollision"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9ca3af] hover:text-[#1a6b2f] transition-colors text-sm font-500"
              >
                X ↗
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-widest text-white mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-[#9ca3af]">
              {["Current Drop", "Jerseys", "Jackets", "T-Shirts", "Bottoms", "Hoodies"].map((l) => (
                <li key={l}>
                  <Link href="#shop" className="hover:text-[#1a6b2f] transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-700 uppercase tracking-widest text-white mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-[#9ca3af]">
              {[
                { label: "Sizing Guide", href: "/sizing-guide" },
                { label: "Shipping Info", href: "/shipping" },
                { label: "Returns Policy", href: "/returns" },
                { label: "Order Tracking", href: "/tracking" },
                { label: "Contact Us", href: "/contact" },
                { label: "FAQs", href: "/faqs" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-[#1a6b2f] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6b7280]">
          <p>© 2026 Thrift Collision. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#1a6b2f] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1a6b2f] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProductGrid />
        <NextDrop />
        <Sustainability />
        <NotifySignup />
      </main>
      <Footer />
    </>
  );
}
