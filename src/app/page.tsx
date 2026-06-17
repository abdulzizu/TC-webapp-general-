"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Nav ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#1a1a1a]/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        {/* Logo */}
        <Link href="/" aria-label="Thrift Collision home">
          <Image
            src="/Ftc-logo.png"
            alt="Thrift Collision"
            width={52}
            height={52}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          <Link href="#shop" className="text-sm font-500 text-[#1a1a1a] hover:text-[#1a6b2f] transition-colors">Shop</Link>
          <Link href="#how-it-works" className="text-sm font-500 text-[#1a1a1a] hover:text-[#1a6b2f] transition-colors">How It Works</Link>
          <Link href="#drops" className="text-sm font-500 text-[#1a1a1a] hover:text-[#1a6b2f] transition-colors">Drops</Link>
          <Link href="#about" className="text-sm font-500 text-[#1a1a1a] hover:text-[#1a6b2f] transition-colors">About</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="#notify"
            className="hidden sm:inline-flex btn-tc-primary px-4 py-2 text-xs rounded-full"
          >
            Get Notified
          </Link>
          <Link
            href="#shop"
            className="btn-tc-outline px-4 py-2 text-xs rounded-full"
          >
            Shop Now
          </Link>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-[#1a6b2f]/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <div className="w-5 h-0.5 bg-[#1a1a1a] mb-1 transition-all" style={{ transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <div className="w-5 h-0.5 bg-[#1a1a1a] mb-1 transition-all" style={{ opacity: menuOpen ? 0 : 1 }} />
            <div className="w-5 h-0.5 bg-[#1a1a1a] transition-all" style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[#1a1a1a]/10 bg-white px-4 py-4 flex flex-col gap-4" aria-label="Mobile navigation">
          <Link href="#shop" className="text-sm font-500 text-[#1a1a1a]" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link href="#how-it-works" className="text-sm font-500 text-[#1a1a1a]" onClick={() => setMenuOpen(false)}>How It Works</Link>
          <Link href="#drops" className="text-sm font-500 text-[#1a1a1a]" onClick={() => setMenuOpen(false)}>Drops</Link>
          <Link href="#about" className="text-sm font-500 text-[#1a1a1a]" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="#notify" className="btn-tc-primary px-4 py-2 text-xs rounded-full text-center" onClick={() => setMenuOpen(false)}>Get Notified</Link>
        </nav>
      )}
    </header>
  );
}

// ─── Marquee Banner ──────────────────────────────────────────────────────────

function MarqueeBanner() {
  const items = [
    "NEW DROP EVERY WEEK",
    "UNISEX STREETWEAR",
    "SUSTAINABLY THRIFTED",
    "FREE SHIPPING ON ORDERS OVER ₦30,000",
    "GOOD-AS-NEW QUALITY",
    "NEW DROP EVERY WEEK",
    "UNISEX STREETWEAR",
    "SUSTAINABLY THRIFTED",
    "FREE SHIPPING ON ORDERS OVER ₦30,000",
    "GOOD-AS-NEW QUALITY",
  ];

  return (
    <div className="bg-[#1a6b2f] text-white py-2.5 overflow-hidden" aria-label="Promotions">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span key={i} className="text-xs font-700 tracking-widest uppercase mx-6">
            {item}
            <span className="mx-6 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative newspaper-bg grain-overlay overflow-hidden"
      aria-label="Hero section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-xs font-700 tracking-widest uppercase text-[#1a6b2f] border border-[#1a6b2f] rounded-full px-3 py-1 mb-6">
              Weekly Drop Active ✦
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-700 leading-[1.05] tracking-tight text-[#1a1a1a] mb-6">
              Wear the{" "}
              <span className="text-[#1a6b2f]">collision.</span>
              <br />
              Own the drop.
            </h1>
            <p className="text-lg sm:text-xl text-[#4b5563] leading-relaxed mb-8 max-w-lg">
              Premium thrifted streetwear, curated and dropped weekly. Unisex.
              Sustainable. Built for the culture.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#shop"
                className="btn-tc-primary px-7 py-3.5 text-sm rounded-full inline-flex items-center gap-2"
              >
                Shop the Drop
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="#notify"
                className="btn-tc-outline px-7 py-3.5 text-sm rounded-full"
              >
                Get Early Access
              </Link>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-6 mt-10">
              <div>
                <p className="text-2xl font-700 text-[#1a1a1a]">5K+</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide">IG Followers</p>
              </div>
              <div className="w-px h-8 bg-[#1a1a1a]/20" />
              <div>
                <p className="text-2xl font-700 text-[#1a1a1a]">Weekly</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide">New Drops</p>
              </div>
              <div className="w-px h-8 bg-[#1a1a1a]/20" />
              <div>
                <p className="text-2xl font-700 text-[#1a1a1a]">100%</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide">Authenticated</p>
              </div>
            </div>
          </div>

          {/* Hero visual — real product cards */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-3">
              <HeroCard label="Liverpool FC Jersey" price="₦12,500" size="S–XL" tag="2 LEFT" rotate="-rotate-2" image="/products/jersey-liverpool.jpg" />
              <HeroCard label="Nassau Track Jacket" price="₦18,000" size="M" tag="NEW" rotate="rotate-1" delay image="/products/jacket.jpg" />
              <HeroCard label="Navy Stripe Tee" price="₦7,500" size="S–XL" tag="NEW" rotate="rotate-2" image="/products/tshirt.jpg" />
              <HeroCard label="Wide-Leg Denim" price="₦15,000" size="30–34" tag="NEW" rotate="-rotate-1" delay image="/products/jeans.jpg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({
  label,
  price,
  size,
  tag,
  rotate = "",
  delay = false,
  image,
}: {
  label: string;
  price: string;
  size: string;
  tag: string;
  rotate?: string;
  delay?: boolean;
  image: string;
}) {
  const tagColor =
    tag === "SOLD OUT"
      ? "bg-[#1a1a1a] text-white"
      : tag === "NEW"
      ? "bg-[#1a6b2f] text-white"
      : "bg-amber-400 text-[#1a1a1a]";

  return (
    <div
      className={`bg-white border border-[#1a1a1a]/10 rounded-xl p-3 product-card ${rotate} ${delay ? "mt-6" : ""}`}
    >
      <div className="relative w-full h-44 rounded-lg mb-3 overflow-hidden">
        <Image
          src={image}
          alt={label}
          fill
          className="object-cover"
          sizes="200px"
        />
        <span className={`absolute top-2 right-2 text-[10px] font-700 tracking-wider px-2 py-0.5 rounded-full ${tagColor}`}>
          {tag}
        </span>
      </div>
      <p className="text-xs font-600 text-[#1a1a1a] uppercase tracking-wide">{label}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm font-700 text-[#1a6b2f]">{price}</p>
        <p className="text-[10px] text-[#6b7280] border border-[#6b7280]/40 rounded px-1.5 py-0.5">{size}</p>
      </div>
    </div>
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
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#1a1a1a]" aria-labelledby="how-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-700 tracking-widest uppercase text-[#1a6b2f] mb-3 block">
            Simple Process
          </span>
          <h2 id="how-heading" className="text-4xl sm:text-5xl font-700 text-white leading-tight">
            How it works
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative border border-white/10 rounded-2xl p-6 hover:border-[#1a6b2f]/50 transition-colors"
            >
              <span className="text-[#1a6b2f]/30 font-700 text-5xl absolute top-4 right-5 select-none" aria-hidden="true">
                {step.num}
              </span>
              <span className="text-3xl mb-4 block" aria-hidden="true">{step.icon}</span>
              <h3 className="text-white font-600 text-lg mb-2">{step.title}</h3>
              <p className="text-[#9ca3af] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Current Drop ────────────────────────────────────────────────────────────

const MOCK_ITEMS = [
  { id: 1, name: "Inter Milan Lautaro #10 Jersey", category: "Jerseys", price: 14500, size: "M–L", tag: "NEW", image: "/products/jersey-inter.jpg" },
  { id: 2, name: "Liverpool FC Carlsberg Jersey", category: "Jerseys", price: 12500, size: "S–XL", tag: "2 LEFT", image: "/products/jersey-liverpool.jpg" },
  { id: 3, name: "Nassau Vintage Track Jacket", category: "Jackets", price: 18000, size: "M", tag: "NEW", image: "/products/jacket.jpg" },
  { id: 4, name: "Aztec Print Flannel Shirt", category: "Shirts", price: 11000, size: "M–L", tag: "NEW", image: "/products/shirt.jpg" },
  { id: 5, name: "Outlier 1991 Quarter-Zip Sweatshirt", category: "Sweatshirts", price: 13500, size: "M", tag: "1 LEFT", image: "/products/sweatshirt.jpg" },
  { id: 6, name: "Navy Stripe Oversized Tee", category: "T-Shirts", price: 7500, size: "S–XL", tag: "NEW", image: "/products/tshirt.jpg" },
  { id: 7, name: "Black Wide-Leg Denim", category: "Bottoms", price: 15000, size: "30–34", tag: "NEW", image: "/products/jeans.jpg" },
  { id: 8, name: "Grey Acid Wash Sweatpants", category: "Bottoms", price: 9500, size: "S–XL", tag: "NEW", image: "/products/sweatpants.jpg" },
  { id: 9, name: "Vintage Puma Cap", category: "Accessories", price: 5000, size: "One Size", tag: "NEW", image: "/products/cap.jpg" },
];

function ProductGrid() {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Jerseys", "Jackets", "Shirts", "T-Shirts", "Sweatshirts", "Bottoms", "Accessories"];

  const filtered =
    filter === "All" ? MOCK_ITEMS : MOCK_ITEMS.filter((i) => i.category === filter);

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
            href="#notify"
            className="btn-tc-primary px-5 py-2.5 text-xs rounded-full self-start sm:self-auto"
          >
            Notify me for next drop →
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
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
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
    price: number;
    size: string;
    tag: string;
    image: string;
  };
}) {
  const isSoldOut = item.tag === "SOLD OUT";
  const tagColor =
    isSoldOut
      ? "bg-[#1a1a1a] text-white"
      : item.tag === "NEW"
      ? "bg-[#1a6b2f] text-white"
      : "bg-amber-400 text-[#1a1a1a]";

  return (
    <article className={`product-card rounded-2xl overflow-hidden border border-[#1a1a1a]/10 bg-[#ede8d8] ${isSoldOut ? "opacity-70" : ""}`}>
      {/* Product image */}
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <span
          className={`absolute top-2.5 left-2.5 text-[10px] font-700 tracking-wider px-2 py-0.5 rounded-full ${tagColor}`}
        >
          {item.tag}
        </span>
        {!isSoldOut && (
          <button
            className="absolute bottom-2.5 right-2.5 bg-[#1a6b2f] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#104020] transition-colors shadow-md"
            aria-label={`Add ${item.name} to cart`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">{item.category}</p>
        <p className="text-sm font-600 text-[#1a1a1a] leading-snug mb-2 line-clamp-2">{item.name}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-700 text-[#1a6b2f]">₦{item.price.toLocaleString()}</p>
          <span className="text-[10px] text-[#6b7280] border border-[#6b7280]/30 rounded px-1.5 py-0.5">{item.size}</span>
        </div>
        {isSoldOut && (
          <button className="w-full mt-2 text-[10px] font-600 uppercase tracking-wider text-[#1a6b2f] border border-[#1a6b2f] rounded-full py-1.5 hover:bg-[#1a6b2f] hover:text-white transition-colors">
            Notify me
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Drop Countdown ──────────────────────────────────────────────────────────

function NextDrop() {
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
          Next drop drops Sunday.
        </h2>
        <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto">
          New pieces every week. Sign up and be the first in line — limited stock means fast fingers win.
        </p>

        {/* Countdown placeholders */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-10">
          {[
            { val: "06", label: "Days" },
            { val: "14", label: "Hours" },
            { val: "32", label: "Mins" },
            { val: "00", label: "Secs" },
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
              Thrift Collision was born on Instagram with one goal: make premium thrifted streetwear
              accessible, authenticated, and easy to shop. Every piece we drop is hand-picked,
              quality-checked, and given a second life.
            </p>
            <p className="text-[#4b5563] text-lg leading-relaxed mb-8">
              The newspaper backdrop you see in our photos isn&apos;t just aesthetic — it&apos;s a statement.
              Old stories, new fits. Sustainability woven into every drop.
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
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;
    setSubmitted(true);
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
          Drop alerts straight to your phone. Be first in line before stock runs out.
        </p>

        {submitted ? (
          <div className="bg-[#1a6b2f]/20 border border-[#1a6b2f] rounded-2xl p-8" role="alert" aria-live="polite">
            <p className="text-3xl mb-3" aria-hidden="true">✅</p>
            <p className="text-white font-600 text-lg">You&apos;re on the list!</p>
            <p className="text-[#9ca3af] text-sm mt-1">We&apos;ll hit you first when the next drop goes live.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div>
              <label htmlFor="phone" className="sr-only">Phone number</label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (required)"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-2 focus:ring-[#1a6b2f]/30 transition"
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address (optional)</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address (optional)"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-2 focus:ring-[#1a6b2f]/30 transition"
              />
            </div>
            <button
              type="submit"
              className="btn-tc-primary py-3.5 rounded-full text-sm"
            >
              Lock me in for the next drop
            </button>
            <p className="text-[#6b7280] text-xs">
              No spam. Just drops. Unsubscribe any time.
            </p>
          </form>
        )}

        {/* Auth links */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-[#9ca3af] text-sm mb-4">Already shopped with us?</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="#"
              className="btn-tc-outline px-6 py-2.5 text-xs rounded-full"
            >
              Sign In
            </Link>
            <Link
              href="#"
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
              className="object-contain mb-4 brightness-0 invert"
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
                href="#"
                className="text-[#9ca3af] hover:text-[#1a6b2f] transition-colors text-sm font-500"
              >
                WhatsApp ↗
              </a>
              <a
                href="#"
                className="text-[#9ca3af] hover:text-[#1a6b2f] transition-colors text-sm font-500"
              >
                Twitter/X ↗
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
              {["Sizing Guide", "Shipping Info", "Returns Policy", "Order Tracking", "Contact Us", "FAQs"].map((l) => (
                <li key={l}>
                  <Link href="#" className="hover:text-[#1a6b2f] transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6b7280]">
          <p>© 2026 Thrift Collision. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-[#1a6b2f] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#1a6b2f] transition-colors">Terms of Service</Link>
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
