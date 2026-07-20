"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/lib/user-context";
import { CATEGORIES, POPULAR_SEARCHES } from "@/lib/products";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { totalItems } = useCart();
  const { user, isSignedIn, signOut } = useUser();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  }

  function handlePopularSearch(term: string) {
    setSearchQuery(term);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
    setSearchFocused(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main nav row */}
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" aria-label="Thrift Collision home" className="shrink-0">
            <Image src="/tc-logo.png" alt="Thrift Collision" width={48} height={48} className="object-contain" priority />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-6 shrink-0" aria-label="Main navigation">
            {/* Products dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-[#1a6b2f] transition-colors"
                aria-expanded={productsOpen}
                aria-haspopup="true"
              >
                Products
                <svg className={`w-4 h-4 transition-transform ${productsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {productsOpen && (
                <div className="absolute top-full left-0 mt-2 w-[520px] bg-white border border-gray-200 rounded-2xl shadow-xl p-6 grid grid-cols-3 gap-6 z-50">
                  {Object.entries(CATEGORIES).map(([cat, subs]) => (
                    <div key={cat}>
                      <Link
                        href={`/shop?category=${encodeURIComponent(cat)}`}
                        className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-3 block hover:underline"
                        onClick={() => setProductsOpen(false)}
                      >
                        {cat}
                      </Link>
                      <ul className="space-y-1.5">
                        {subs.map((sub) => (
                          <li key={sub}>
                            <Link
                              href={`/shop?category=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`}
                              className="text-sm text-gray-600 hover:text-[#1a6b2f] transition-colors"
                              onClick={() => setProductsOpen(false)}
                            >
                              {sub}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/#how-it-works" className="text-sm font-semibold text-gray-800 hover:text-[#1a6b2f] transition-colors">How It Works</Link>
            
            {/* Drops dropdown */}
            <DropsDropdown />

            <Link href="/#about" className="text-sm font-semibold text-gray-800 hover:text-[#1a6b2f] transition-colors">About</Link>
          </nav>

          {/* Search bar — prominent, centered */}
          <div className="flex-1 max-w-xl mx-4 relative">
            <form onSubmit={handleSearch} role="search">
              <label htmlFor="nav-search" className="sr-only">Search products</label>
              <div className="relative">
                <input
                  id="nav-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  placeholder="Search by name, size, colour…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-2 focus:ring-[#1a6b2f]/20 transition"
                  autoComplete="off"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a6b2f]" aria-label="Search">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Popular search suggestions */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-50">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onMouseDown={() => handlePopularSearch(term)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#1a6b2f] hover:text-white transition-colors text-gray-700"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isSignedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/profile" className="text-sm font-semibold text-gray-700 hover:text-[#1a6b2f] transition-colors">
                  Hi, {user?.name?.split(" ")[0] || "there"}
                </Link>
                <button onClick={signOut} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Sign out</button>
              </div>
            ) : (
              <Link href="/auth/signin" className="hidden sm:inline-flex text-sm font-semibold text-gray-700 hover:text-[#1a6b2f] transition-colors">
                Sign in
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label={`Cart, ${totalItems} items`}>
              <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1a6b2f] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4">
          <form onSubmit={handleSearch} className="mb-4" role="search">
            <label htmlFor="mobile-search" className="sr-only">Search</label>
            <div className="relative">
              <input
                id="mobile-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Search">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </div>
          </form>
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {Object.entries(CATEGORIES).map(([cat, subs]) => (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] py-2">{cat}</p>
                {subs.map((sub) => (
                  <Link key={sub} href={`/shop?category=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`}
                    className="block pl-3 py-1.5 text-sm text-gray-600 hover:text-[#1a6b2f]"
                    onClick={() => setMenuOpen(false)}>
                    {sub}
                  </Link>
                ))}
              </div>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-2">
              <Link href="/#how-it-works" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>How It Works</Link>
              <Link href="/#drops" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>Current Drop</Link>
              <div className="pl-2 border-l-2 border-[#1a6b2f]/20 space-y-1.5">
                <p className="text-xs font-bold text-[#1a6b2f] uppercase tracking-wide">Upcoming</p>
                <p className="text-sm text-gray-600">🪖 Soja, not soldier — <span className="text-[#1a6b2f] text-xs font-semibold">Coming soon</span></p>
                <p className="text-sm text-gray-600">⚽ Jersey Drop — <span className="text-[#1a6b2f] text-xs font-semibold">September</span></p>
              </div>
              <Link href="/#about" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>About</Link>
              {isSignedIn ? (
                <>
                  <Link href="/profile" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>
                    My Profile ({user?.name?.split(" ")[0] || "there"})
                  </Link>
                  <Link href="/cart" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>
                    Cart {totalItems > 0 ? `(${totalItems})` : ""}
                  </Link>
                  <button onClick={() => { signOut(); setMenuOpen(false); }} className="text-sm text-left text-red-500">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>Sign in / Register</Link>
                  <Link href="/profile" className="text-sm font-semibold text-gray-800" onClick={() => setMenuOpen(false)}>Create Account</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// ── Drops Dropdown ──────────────────────────────────────────────
function DropsDropdown() {
  const [open, setOpen] = useState(false);
  const [drops, setDrops] = useState([
    { title: "Soja, not soldier", subtitle: "Camo capsule drop", timing: "Coming soon", emoji: "🪖" },
    { title: "Jersey Drop", subtitle: "Football jerseys collection", timing: "September", emoji: "⚽" },
  ]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase
        .from("upcoming_drops")
        .select("title, subtitle, timing, emoji")
        .eq("active", true)
        .order("display_order")
        .then(({ data }) => {
          if (data && data.length > 0) setDrops(data as any);
        });
    });
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-[#1a6b2f] transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Drops
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-3">Upcoming Drops</p>
          <div className="space-y-3">
            {drops.map((drop) => (
              <div key={drop.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#1a6b2f]/5 transition-colors">
                <span className="text-xl mt-0.5">{drop.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1a1a1a] leading-tight">{drop.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{drop.subtitle}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide bg-[#1a6b2f]/10 text-[#1a6b2f] px-2 py-0.5 rounded-full">
                    {drop.timing}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/#drops"
            onClick={() => setOpen(false)}
            className="block mt-3 text-center text-xs font-semibold text-[#1a6b2f] hover:underline"
          >
            View current drop ↓
          </Link>
        </div>
      )}
    </div>
  );
}
