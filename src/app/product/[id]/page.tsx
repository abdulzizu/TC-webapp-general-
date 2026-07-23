"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { getProduct, getProductByName, PRODUCTS, type Product } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/lib/user-context";

const SIZING_GUIDE = [
  { label: "XS",  chest: '32–34"', sleeve: '24"', waist: '26–28"' },
  { label: "S",   chest: '34–36"', sleeve: '25"', waist: '28–30"' },
  { label: "M",   chest: '38–40"', sleeve: '26"', waist: '30–32"' },
  { label: "L",   chest: '41–43"', sleeve: '27"', waist: '32–34"' },
  { label: "XL",  chest: '44–46"', sleeve: '28"', waist: '34–36"' },
  { label: "2XL", chest: '47–50"', sleeve: '29"', waist: '36–38"' },
];

const PANTS_SIZING_GUIDE = [
  { waist: 'W28"', hip: '38"', inseam: 'L28–30"' },
  { waist: 'W30"', hip: '40"', inseam: 'L28–30"' },
  { waist: 'W32"', hip: '42"', inseam: 'L29–32"' },
  { waist: 'W34"', hip: '44"', inseam: 'L30–32"' },
  { waist: 'W36"', hip: '46"', inseam: 'L30–32"' },
  { waist: 'W38"', hip: '48"', inseam: 'L30–32"' },
];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { isSignedIn, addKeyword } = useUser();
  const [sizingOpen, setSizingOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [notifyAdded, setNotifyAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState<Product | null | undefined>(() => getProduct(Number(id)));
  const [loading, setLoading] = useState(!getProduct(Number(id)));

  // Fetch from Supabase if not in static data
  useEffect(() => {
    const staticProduct = getProduct(Number(id));
    if (staticProduct) {
      setProduct(staticProduct);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("products")
      .select("*")
      .eq("id", Number(id))
      .single()
      .then(({ data }) => {
        if (data) {
          setProduct({
            id: data.id,
            name: data.name,
            category: data.category,
            subcategory: data.subcategory,
            price: data.price,
            size: data.size,
            waist: data.waist ?? undefined,
            length: data.length ?? undefined,
            elasticWaist: data.elastic_waist,
            colours: data.colours ?? [],
            tag: data.tag as Product["tag"],
            image: data.image,
            images: data.images ?? [],
            description: data.description,
            available: data.available,
            pairsWith: (data.pairs_with as Product["pairsWith"]) ?? [],
          });
        } else {
          setProduct(null);
        }
        setLoading(false);
      });
  }, [id]);

  // "You may also like" — fetch from Supabase, fallback to static
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    if (!product) return;
    // Set static fallback first
    setRelated(
      PRODUCTS
        .filter((p) => p.id !== product.id && p.available)
        .sort((a, b) => {
          const aScore = a.subcategory === product.subcategory ? 2 : a.category === product.category ? 1 : 0;
          const bScore = b.subcategory === product.subcategory ? 2 : b.category === product.category ? 1 : 0;
          return bScore - aScore;
        })
        .slice(0, 4)
    );

    const supabase = createClient();
    supabase
      .from("products")
      .select("*")
      .eq("available", true)
      .neq("id", product.id)
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id, name: p.name, category: p.category, subcategory: p.subcategory,
            price: p.price, size: p.size, waist: p.waist ?? undefined, length: p.length ?? undefined,
            elasticWaist: p.elastic_waist, colours: p.colours ?? [], tag: p.tag,
            image: p.image, images: p.images ?? [], description: p.description,
            available: p.available, pairsWith: p.pairs_with ?? [],
          }));
          const sorted = mapped.sort((a, b) => {
            const aScore = a.subcategory === product.subcategory ? 2 : a.category === product.category ? 1 : 0;
            const bScore = b.subcategory === product.subcategory ? 2 : b.category === product.category ? 1 : 0;
            return bScore - aScore;
          });
          setRelated(sorted.slice(0, 4));
        }
      });
  }, [product]);

  if (loading) {
    return (
      <>
        <MarqueeBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="animate-pulse text-gray-400">Loading…</div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <MarqueeBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-24 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">404</p>
          <p className="text-xl font-semibold mb-6">Product not found</p>
          <Link href="/shop" className="btn-tc-primary px-6 py-3 rounded-full text-sm inline-block">Back to Shop</Link>
        </main>
      </>
    );
  }

  const isSoldOut = product.tag === "SOLD OUT";
  const tagColor = isSoldOut
    ? "bg-[#1a1a1a] text-white"
    : product.tag === "NEW"
    ? "bg-[#1a6b2f] text-white"
    : "bg-amber-400 text-[#1a1a1a]";

  function handleAddToCart() {
    addItem(product!, product!.size);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem(product!, product!.size);
    router.push("/cart");
  }

  function handleNotifyMe() {
    const keyword = product!.subcategory.toLowerCase();
    addKeyword(keyword);
    setNotifyAdded(true);
  }

  // Style guide: resolve pairing items from product catalogue
  const pairingProducts = (product.pairsWith ?? [])
    .map((p) => ({ ...p, product: getProductByName(p.item) }))
    .filter((p) => p.product !== undefined);

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-400 flex-wrap">
            <Link href="/" className="hover:text-[#1a6b2f] transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/shop" className="hover:text-[#1a6b2f] transition-colors">Shop</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#1a6b2f] transition-colors">{product.category}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#1a1a1a] font-medium truncate">{product.name}</span>
          </nav>

          {/* ── Product hero ───────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-16">

            {/* Image gallery */}
            {(() => {
              // Combine primary image + additional images
              const allImages = [product.image, ...(product.images ?? [])];
              const hasMultiple = allImages.length > 1;

              return (
                <div className="relative">
                  {/* Main image */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#ede8d8]">
                    <Image
                      src={allImages[activeImage]}
                      alt={`${product.name}${hasMultiple ? ` — image ${activeImage + 1}` : ""}`}
                      fill
                      className="object-cover"
                      sizes="(max-width:1024px) 100vw, 50vw"
                      priority
                    />
                    <span className={`absolute top-4 left-4 text-xs font-bold tracking-wide px-3 py-1 rounded-full ${tagColor}`}>
                      {product.tag}
                    </span>

                    {/* Prev/Next arrows */}
                    {hasMultiple && (
                      <>
                        <button
                          onClick={() => setActiveImage((prev) => prev === 0 ? allImages.length - 1 : prev - 1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition"
                          aria-label="Previous image"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                        </button>
                        <button
                          onClick={() => setActiveImage((prev) => prev === allImages.length - 1 ? 0 : prev + 1)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition"
                          aria-label="Next image"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail dots / strip */}
                  {hasMultiple && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                            i === activeImage ? "border-[#1a6b2f]" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                          aria-label={`View image ${i + 1}`}
                          aria-current={i === activeImage ? "true" : undefined}
                        >
                          <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Info panel */}
            <div className="flex flex-col">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-2">
                {product.subcategory}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight mb-3">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-[#1a6b2f] mb-5">
                ₦{product.price.toLocaleString()}
              </p>

              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

              {/* Colours — fixed, display only */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Colours</p>
                <div className="flex gap-2 flex-wrap">
                  {(product.colours ?? []).length > 0 ? product.colours.map((c) => (
                    <span
                      key={c}
                      className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 bg-gray-50"
                    >
                      {c}
                    </span>
                  )) : <span className="text-xs text-gray-400">—</span>}
                </div>
              </div>

              {/* Size — fixed, display only with sizing guide */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Size</p>
                  <button
                    onClick={() => setSizingOpen(!sizingOpen)}
                    className="text-xs text-[#1a6b2f] underline underline-offset-2 hover:text-[#104020] transition-colors"
                  >
                    View sizing guide
                  </button>
                </div>
                {/* Size badges — pants show waist + length, others show label size */}
                {product.waist ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                          {product.elasticWaist ? "Waist (elastic)" : "Waist"}
                        </span>
                        <span className="px-4 py-2 rounded-full border-2 border-[#1a6b2f] bg-[#1a6b2f]/5 text-[#1a6b2f] text-sm font-bold">
                          {product.waist}
                        </span>
                      </div>
                      {product.length && (
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Length</span>
                          <span className="px-4 py-2 rounded-full border-2 border-[#1a6b2f] bg-[#1a6b2f]/5 text-[#1a6b2f] text-sm font-bold">
                            {product.length}
                          </span>
                        </div>
                      )}
                    </div>
                    {product.elasticWaist && (
                      <p className="text-xs text-gray-400">Elastic/drawstring waist — fits a range of sizes</p>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="px-5 py-2 rounded-full border-2 border-[#1a6b2f] bg-[#1a6b2f]/5 text-[#1a6b2f] text-sm font-bold">
                      {product.size}
                    </span>
                    <span className="text-xs text-gray-400">One-of-one — size is fixed</span>
                  </div>
                )}
              </div>

              {/* Sizing guide accordion */}
              {sizingOpen && (
                <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-bold">Size Guide (inches)</p>
                    <button
                      onClick={() => setSizingOpen(false)}
                      className="text-gray-400 hover:text-gray-700 text-xs transition-colors"
                      aria-label="Close sizing guide"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    {product.waist ? (
                      // Pants sizing table
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-100">
                          <tr>
                            {["Waist", "Hip", "Inseam"].map((h) => (
                              <th key={h} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PANTS_SIZING_GUIDE.map((row, i) => {
                            const isThisItem = row.waist === product.waist;
                            return (
                              <tr
                                key={row.waist}
                                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isThisItem ? "ring-1 ring-inset ring-[#1a6b2f]" : ""}`}
                              >
                                <td className={`px-4 py-2 font-bold ${isThisItem ? "text-[#1a6b2f]" : ""}`}>
                                  {row.waist}
                                  {isThisItem && (
                                    <span className="ml-2 text-[10px] bg-[#1a6b2f] text-white rounded px-1.5 py-0.5">this item</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-gray-600">{row.hip}</td>
                                <td className="px-4 py-2 text-gray-600">{row.inseam}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      // Tops sizing table
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-100">
                          <tr>
                            {["Size", "Chest", "Sleeve", "Waist"].map((h) => (
                              <th key={h} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {SIZING_GUIDE.map((row, i) => (
                            <tr
                              key={row.label}
                              className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${row.label === product.size ? "ring-1 ring-inset ring-[#1a6b2f]" : ""}`}
                            >
                              <td className={`px-4 py-2 font-bold ${row.label === product.size ? "text-[#1a6b2f]" : ""}`}>
                                {row.label}
                                {row.label === product.size && (
                                  <span className="ml-2 text-[10px] bg-[#1a6b2f] text-white rounded px-1.5 py-0.5">this item</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-600">{row.chest}</td>
                              <td className="px-4 py-2 text-gray-600">{row.sleeve}</td>
                              <td className="px-4 py-2 text-gray-600">{row.waist}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ── CTAs ── most visually striking elements on the page */}
              {isSoldOut ? (
                <div className="space-y-3">
                  {/* Sold banner */}
                  <div className="w-full py-3 rounded-2xl bg-[#1a1a1a] text-white text-center font-bold text-sm flex items-center justify-center gap-2">
                    <span aria-hidden="true">🏷️</span> This item has been sold
                  </div>
                  {/* Notify me */}
                  {isSignedIn ? (
                    notifyAdded ? (
                      <div className="w-full py-3.5 rounded-full bg-[#1a6b2f]/10 border border-[#1a6b2f] text-[#1a6b2f] text-center font-bold text-sm" role="status">
                        ✓ We&apos;ll notify you when a similar {product.subcategory} drops
                      </div>
                    ) : (
                      <button
                        onClick={handleNotifyMe}
                        className="w-full py-3.5 rounded-full border-2 border-[#1a6b2f] text-[#1a6b2f] font-bold text-sm hover:bg-[#1a6b2f] hover:text-white transition-all"
                      >
                        🔔 Notify me when a similar item drops
                      </button>
                    )
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="block w-full py-3.5 rounded-full border-2 border-[#1a6b2f] text-[#1a6b2f] font-bold text-sm text-center hover:bg-[#1a6b2f] hover:text-white transition-all"
                    >
                      Sign in to get notified when similar items drop
                    </Link>
                  )}
                  <Link href="/shop" className="block text-center text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors">
                    Browse available items →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-4 rounded-full bg-[#1a6b2f] text-white font-bold text-base tracking-wide hover:bg-[#104020] active:scale-[0.98] transition-all shadow-lg shadow-[#1a6b2f]/20"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className={`w-full py-4 rounded-full border-2 font-bold text-base tracking-wide transition-all ${
                      added
                        ? "border-[#1a6b2f] bg-[#1a6b2f]/10 text-[#1a6b2f]"
                        : "border-[#1a6b2f] text-[#1a6b2f] hover:bg-[#1a6b2f] hover:text-white"
                    }`}
                  >
                    {added ? "✓ Added to Cart" : "Add to Cart"}
                  </button>
                </div>
              )}

              {/* Trust signals */}
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                {[
                  { icon: "🔒", label: "Secure checkout" },
                  { icon: "📦", label: "Ships nationwide" },
                  { icon: "↩️", label: "Easy returns" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xl mb-1" aria-hidden="true">{item.icon}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Style Guide ─────────────────────────────────────── */}
          {pairingProducts.length > 0 && (
            <section className="mb-16" aria-labelledby="style-guide-heading">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-2 block">
                  Style Guide
                </span>
                <h2 id="style-guide-heading" className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">
                  How to wear it
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Items from our current drop that pair well with the {product.name.split(" ").slice(0, 3).join(" ")}.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                {pairingProducts.map(({ product: p, reason }, i) => {
                  if (!p) return null;
                  return (
                    <Link
                      key={i}
                      href={`/product/${p.id}`}
                      className="group border border-gray-100 rounded-2xl overflow-hidden bg-white product-card"
                    >
                      {/* Item image */}
                      <div className="relative aspect-square bg-[#ede8d8] overflow-hidden">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width:640px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-xs font-bold uppercase tracking-wide line-clamp-1">{p.name}</p>
                          <p className="text-white/80 text-xs">₦{p.price.toLocaleString()} · {p.size}</p>
                        </div>
                      </div>
                      {/* Pairing reason */}
                      <div className="p-4">
                        <div className="flex items-start gap-2">
                          <span className="text-[#1a6b2f] text-sm mt-0.5 shrink-0" aria-hidden="true">✦</span>
                          <p className="text-sm text-gray-600 leading-relaxed">{reason}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── You may also like ──────────────────────────────── */}
          {related.length > 0 && (
            <section aria-labelledby="related-heading">
              <div className="mb-6">
                <h2 id="related-heading" className="text-2xl font-bold text-[#1a1a1a]">
                  You may also like
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {related.map((item) => {
                  const itemTagColor = item.tag === "SOLD OUT"
                    ? "bg-[#1a1a1a] text-white"
                    : item.tag === "NEW"
                    ? "bg-[#1a6b2f] text-white"
                    : "bg-amber-400 text-[#1a1a1a]";
                  return (
                    <Link
                      key={item.id}
                      href={`/product/${item.id}`}
                      className="product-card rounded-2xl overflow-hidden border border-gray-100 bg-white"
                    >
                      <div className="relative aspect-square bg-[#ede8d8] overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${itemTagColor}`}>
                          {item.tag}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{item.subcategory}</p>
                        <p className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 mb-1">{item.name}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-[#1a6b2f]">₦{item.price.toLocaleString()}</p>
                          <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{item.size}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  );
}
