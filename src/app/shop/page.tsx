"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { cloudinaryUrl } from "@/lib/cloudinary";
import Link from "next/link";
import { Suspense } from "react";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { POPULAR_SEARCHES } from "@/lib/products";
import { useProducts } from "@/lib/use-products";

const ALL_SIZES = ["XS","S","M","L","XL","2XL","3XL","28","30","32","34","36","38","40","41","42","43","44","One Size"];
const ALL_COLOURS = ["Black","White","Navy","Blue","Red","Grey","Burgundy","Pink","Green","Brown","Yellow"];
const SORT_OPTIONS = [
  { value: "new", label: "Newest first" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "availability", label: "Available first" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { products, isLoading } = useProducts();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedSub, setSelectedSub] = useState(searchParams.get("sub") || "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColours, setSelectedColours] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 35000]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState("new");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);

  // Sync URL params — read on mount
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedSub(searchParams.get("sub") || "");
    if (searchParams.get("sizes")) setSelectedSizes(searchParams.get("sizes")!.split(","));
    if (searchParams.get("colours")) setSelectedColours(searchParams.get("colours")!.split(","));
    if (searchParams.get("sort")) setSort(searchParams.get("sort")!);
    if (searchParams.get("available") === "1") setAvailableOnly(true);
  }, [searchParams]);

  // Group mappings (for footer links like "Bottoms")
  const GROUP_MAP: Record<string, string[]> = {
    bottoms: ["Jeans", "Shorts", "Sweatpants", "Trackpants", "Cargo pants", "Cargo shorts", "Track suits"],
  };
  const activeGroup = searchParams.get("group") || "";

  // Write filters to URL (debounced, so back button preserves them without breaking Link navigation)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (activeGroup) params.set("group", activeGroup);
      if (query) params.set("q", query);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSub) params.set("sub", selectedSub);
      if (selectedSizes.length) params.set("sizes", selectedSizes.join(","));
      if (selectedColours.length) params.set("colours", selectedColours.join(","));
      if (sort !== "new") params.set("sort", sort);
      if (availableOnly) params.set("available", "1");
      const url = params.toString() ? `/shop?${params.toString()}` : "/shop";
      window.history.replaceState(null, "", url);
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, selectedCategory, selectedSub, selectedSizes, selectedColours, sort, availableOnly, activeGroup]);

  function toggleSize(s: string) {
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleColour(c: string) {
    setSelectedColours((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  const filtered = useMemo(() => {
    let result = [...products];
    // Group filter (e.g. "bottoms" = multiple subcategories)
    if (activeGroup && GROUP_MAP[activeGroup]) {
      result = result.filter((p) => GROUP_MAP[activeGroup].includes(p.subcategory));
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        (p.colours ?? []).some((c) => c.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (selectedSub) result = result.filter((p) => p.subcategory === selectedSub);
    if (selectedSizes.length > 0) result = result.filter((p) => selectedSizes.includes(p.size));
    if (selectedColours.length > 0) result = result.filter((p) => (p.colours ?? []).some((c) => selectedColours.includes(c)));
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (availableOnly) result = result.filter((p) => p.available && p.tag !== "SOLD");

    switch (sort) {
      case "price-asc": return result.sort((a, b) => a.price - b.price);
      case "price-desc": return result.sort((a, b) => b.price - a.price);
      case "availability": return result.sort((a, b) => (a.tag === "SOLD" ? 1 : 0) - (b.tag === "SOLD" ? 1 : 0));
      default: return result.sort((a, b) => b.id - a.id);
    }
  }, [products, query, selectedCategory, selectedSub, selectedSizes, selectedColours, priceRange, availableOnly, sort, activeGroup]);

  function clearFilters() {
    setQuery(""); setSelectedCategory(""); setSelectedSub("");
    setSelectedSizes([]); setSelectedColours([]); setPriceRange([0, 35000]);
    setAvailableOnly(false); setSort("new"); setVisibleCount(16);
    router.push("/shop");
  }

  const hasFilters = query || selectedCategory || selectedSub || selectedSizes.length || selectedColours.length || availableOnly || priceRange[0] > 0 || priceRange[1] < 35000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">
          {query ? `Results for "${query}"` : activeGroup ? activeGroup.charAt(0).toUpperCase() + activeGroup.slice(1) : selectedSub || selectedCategory || "All Products"}
        </h1>
        <p className="text-gray-500 mt-1">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); }}
        className="mb-6"
        role="search"
      >
        <label htmlFor="shop-search" className="sr-only">Search products</label>
        <div className="relative max-w-2xl">
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, size, colour, style…"
            className="w-full border border-gray-200 rounded-full pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#1a6b2f] focus:ring-2 focus:ring-[#1a6b2f]/20 bg-white shadow-sm transition"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        {/* Popular suggestions */}
        <div className="flex gap-2 flex-wrap mt-3">
          <span className="text-xs text-gray-400 self-center">Popular:</span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${query === term ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f] hover:text-[#1a6b2f]"}`}
            >
              {term}
            </button>
          ))}
        </div>
      </form>

      <div className="flex gap-8">
        {/* Sidebar filters — desktop */}
        <aside className="hidden lg:block w-56 shrink-0" aria-label="Filters">
          <FilterPanel
            selectedSizes={selectedSizes} toggleSize={toggleSize}
            selectedColours={selectedColours} toggleColour={toggleColour}
            priceRange={priceRange} setPriceRange={setPriceRange}
            availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
            hasFilters={!!hasFilters} clearFilters={clearFilters}
          />
        </aside>

        <div className="flex-1 min-w-0">
          {/* Sort + mobile filter toggle */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <button
              className="lg:hidden flex items-center gap-2 text-sm font-semibold border border-gray-200 rounded-full px-4 py-2 hover:border-[#1a6b2f] transition-colors"
              onClick={() => setFiltersOpen(true)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filters {hasFilters ? "•" : ""}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-500 hidden sm:block">Sort:</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm border border-gray-200 rounded-full px-3 py-2 focus:outline-none focus:border-[#1a6b2f] bg-white"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Results grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-16 lg:pb-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-white">
                  <div className="w-full aspect-square bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-4xl mb-4" aria-hidden="true">🔍</p>
              <p className="text-lg font-semibold text-gray-800 mb-2">No items found</p>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn-tc-primary px-6 py-2.5 text-sm rounded-full">Clear all filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-16 lg:pb-0">
                {filtered.slice(0, visibleCount).map((item) => {
                  const isSoldOut = item.tag === "SOLD";
                  const tagColor = isSoldOut ? "bg-red-500 text-white" : item.tag === "NEW" || item.tag === "STAFF PICK" ? "bg-[#1a6b2f] text-white" : item.tag === "ESSENTIAL" ? "bg-purple-500 text-white" : "bg-amber-400 text-[#1a1a1a]";
                  return (
                    <Link key={item.id} href={`/product/${item.id}`} className={`product-card rounded-2xl overflow-hidden border border-gray-100 bg-white group ${isSoldOut ? "opacity-60" : ""}`}>
                      <div className="relative w-full aspect-square overflow-hidden bg-[#ede8d8]">
                        <Image src={cloudinaryUrl(item.image, 400)} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
                        {item.tag && <span className={`absolute top-2 left-2 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${tagColor}`}>{item.tag}</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{item.subcategory}</p>
                        <p className="text-sm font-semibold text-[#1a1a1a] leading-snug mb-2 line-clamp-2">{item.name}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-[#1a6b2f]">₦{item.price.toLocaleString()}</p>
                          <div className="flex gap-1">
                            <span className="text-[9px] border border-gray-200 rounded px-1 py-0.5 text-gray-500">{item.size}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {visibleCount < filtered.length && (
                <>
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setVisibleCount((c) => c + 16)}
                      className="btn-tc-outline px-8 py-3 text-sm rounded-full"
                    >
                      Load more ({filtered.length - visibleCount} remaining)
                    </button>
                  </div>
                  {/* Sticky mobile prompt */}
                  <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                    <button
                      onClick={() => setVisibleCount((c) => c + 16)}
                      className="w-full py-3 rounded-full bg-[#1a6b2f] text-white font-bold text-sm"
                    >
                      See {filtered.length - visibleCount} more items ↓
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel
              selectedSizes={selectedSizes} toggleSize={toggleSize}
              selectedColours={selectedColours} toggleColour={toggleColour}
              priceRange={priceRange} setPriceRange={setPriceRange}
              availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
              hasFilters={!!hasFilters} clearFilters={() => { clearFilters(); setFiltersOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ selectedSizes, toggleSize, selectedColours, toggleColour, priceRange, setPriceRange, availableOnly, setAvailableOnly, hasFilters, clearFilters }: {
  selectedSizes: string[]; toggleSize: (s: string) => void;
  selectedColours: string[]; toggleColour: (c: string) => void;
  priceRange: [number, number]; setPriceRange: (r: [number, number]) => void;
  availableOnly: boolean; setAvailableOnly: (v: boolean) => void;
  hasFilters: boolean; clearFilters: () => void;
}) {
  return (
    <div className="space-y-6">
      {hasFilters && (
        <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-semibold">Clear all filters</button>
      )}

      {/* Availability */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)}
            className="w-4 h-4 rounded accent-[#1a6b2f]" />
          <span className="text-sm text-gray-700">In stock only</span>
        </label>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Size</h3>
        <div className="flex flex-wrap gap-1.5">
          {ALL_SIZES.map((s) => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${selectedSizes.includes(s) ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"}`}
              aria-pressed={selectedSizes.includes(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Colour */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Colour</h3>
        <div className="flex flex-wrap gap-1.5">
          {ALL_COLOURS.map((c) => (
            <button key={c} onClick={() => toggleColour(c)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${selectedColours.includes(c) ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a6b2f]"}`}
              aria-pressed={selectedColours.includes(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Price</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">₦{priceRange[0].toLocaleString()}</span>
          <span className="text-gray-400">–</span>
          <span className="text-sm text-gray-600">₦{priceRange[1].toLocaleString()}</span>
        </div>
        <input type="range" min={0} max={35000} step={500} value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-[#1a6b2f]" aria-label="Maximum price" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main>
        <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
          <ShopContent />
        </Suspense>
      </main>
    </>
  );
}
