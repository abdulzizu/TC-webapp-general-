"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { getProduct, PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

const SIZING_GUIDE = [
  { label: "XS", chest: "32–34\"", sleeve: "24\"", waist: "26–28\"" },
  { label: "S",  chest: "34–36\"", sleeve: "25\"", waist: "28–30\"" },
  { label: "M",  chest: "38–40\"", sleeve: "26\"", waist: "30–32\"" },
  { label: "L",  chest: "41–43\"", sleeve: "27\"", waist: "32–34\"" },
  { label: "XL", chest: "44–46\"", sleeve: "28\"", waist: "34–36\"" },
  { label: "2XL",chest: "47–50\"", sleeve: "29\"", waist: "36–38\"" },
];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const product = getProduct(Number(id));
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [sizingOpen, setSizingOpen] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <>
        <MarqueeBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-24 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">404</p>
          <p className="text-xl font-semibold mb-6">Product not found</p>
          <Link href="/shop" className="btn-tc-primary px-6 py-3 rounded-full text-sm">Back to Shop</Link>
        </main>
      </>
    );
  }

  const isSoldOut = product.tag === "SOLD OUT";
  const tagColor = isSoldOut ? "bg-[#1a1a1a] text-white" : product.tag === "NEW" ? "bg-[#1a6b2f] text-white" : "bg-amber-400 text-[#1a1a1a]";

  function handleAddToCart() {
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addItem(product!, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addItem(product!, selectedSize);
    router.push("/cart");
  }

  // Related products
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-[#1a6b2f]">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/shop" className="hover:text-[#1a6b2f]">Shop</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#1a6b2f]">{product.category}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#1a1a1a] font-medium">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#ede8d8]">
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority />
              <span className={`absolute top-4 left-4 text-xs font-bold tracking-wide px-3 py-1 rounded-full ${tagColor}`}>{product.tag}</span>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1a6b2f] mb-2">{product.subcategory}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight mb-3">{product.name}</h1>
              <p className="text-3xl font-bold text-[#1a6b2f] mb-4">₦{product.price.toLocaleString()}</p>

              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

              {/* Colours */}
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Colours</p>
                <div className="flex gap-2 flex-wrap">
                  {product.colours.map((c) => (
                    <span key={c} className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600">{c}</span>
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Size</p>
                  <button
                    onClick={() => setSizingOpen(!sizingOpen)}
                    className="text-xs text-[#1a6b2f] underline underline-offset-2"
                  >
                    Size guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Select a size">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSize(s); setSizeError(false); }}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${selectedSize === s ? "bg-[#1a6b2f] border-[#1a6b2f] text-white" : "border-gray-200 text-gray-700 hover:border-[#1a6b2f]"}`}
                      aria-pressed={selectedSize === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="text-red-500 text-xs mt-2" role="alert">Please select a size before adding to cart</p>
                )}
              </div>

              {/* Sizing guide accordion */}
              {sizingOpen && (
                <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-bold">Size Guide (inches)</p>
                    <button onClick={() => setSizingOpen(false)} className="text-gray-400 hover:text-gray-700 text-xs">Close</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white border-b border-gray-100">
                        <tr>
                          {["Size","Chest","Sleeve","Waist"].map((h) => (
                            <th key={h} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SIZING_GUIDE.map((row, i) => (
                          <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 font-semibold">{row.label}</td>
                            <td className="px-4 py-2 text-gray-600">{row.chest}</td>
                            <td className="px-4 py-2 text-gray-600">{row.sleeve}</td>
                            <td className="px-4 py-2 text-gray-600">{row.waist}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CTAs — most visually striking elements */}
              {isSoldOut ? (
                <div className="space-y-3">
                  <div className="w-full py-4 rounded-full bg-gray-200 text-gray-500 text-center font-bold text-sm">Sold Out</div>
                  <Link href="/shop" className="btn-tc-outline block text-center py-3.5 rounded-full text-sm">Browse other items</Link>
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
                    className={`w-full py-4 rounded-full border-2 font-bold text-base tracking-wide transition-all ${added ? "border-[#1a6b2f] bg-[#1a6b2f]/10 text-[#1a6b2f]" : "border-[#1a6b2f] text-[#1a6b2f] hover:bg-[#1a6b2f] hover:text-white"}`}
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

          {/* Related products */}
          {related.length > 0 && (
            <section className="mt-16" aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-2xl font-bold text-[#1a1a1a] mb-6">You may also like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {related.map((item) => (
                  <Link key={item.id} href={`/product/${item.id}`} className="product-card rounded-2xl overflow-hidden border border-gray-100 bg-white">
                    <div className="relative aspect-square bg-[#ede8d8]">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="25vw" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 mb-1">{item.name}</p>
                      <p className="text-sm font-bold text-[#1a6b2f]">₦{item.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
