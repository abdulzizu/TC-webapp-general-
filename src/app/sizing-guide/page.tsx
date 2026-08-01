"use client";

import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

const TOPS = [
  { label: "XS", chest: '32–34"', sleeve: '24"', waist: '26–28"' },
  { label: "S", chest: '34–36"', sleeve: '25"', waist: '28–30"' },
  { label: "M", chest: '38–40"', sleeve: '26"', waist: '30–32"' },
  { label: "L", chest: '41–43"', sleeve: '27"', waist: '32–34"' },
  { label: "XL", chest: '44–46"', sleeve: '28"', waist: '34–36"' },
  { label: "2XL", chest: '47–50"', sleeve: '29"', waist: '36–38"' },
];

const PANTS = [
  { waist: 'W28"', hip: '38"', inseam: 'L28–30"', fullLength: '38–40"' },
  { waist: 'W30"', hip: '40"', inseam: 'L28–30"', fullLength: '39–41"' },
  { waist: 'W32"', hip: '42"', inseam: 'L29–32"', fullLength: '40–43"' },
  { waist: 'W34"', hip: '44"', inseam: 'L30–32"', fullLength: '41–44"' },
  { waist: 'W36"', hip: '46"', inseam: 'L30–32"', fullLength: '41–44"' },
  { waist: 'W38"', hip: '48"', inseam: 'L30–32"', fullLength: '41–44"' },
];

export default function SizingGuidePage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Sizing Guide</h1>

        <p className="text-gray-600 text-sm mb-8">All measurements are in inches. Since each piece is thrifted and unique, always check the specific size noted on the product page.</p>

        {/* Tops */}
        <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">Tops, Jackets & Jerseys</h2>
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm text-left bg-white rounded-xl border border-gray-100 overflow-hidden">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Chest</th>
                <th className="px-4 py-3">Sleeve</th>
                <th className="px-4 py-3">Waist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TOPS.map((r) => (
                <tr key={r.label} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-bold">{r.label}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.chest}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.sleeve}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.waist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pants */}
        <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">Pants, Jeans & Shorts</h2>
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm text-left bg-white rounded-xl border border-gray-100 overflow-hidden">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Waist</th>
                <th className="px-4 py-3">Hip</th>
                <th className="px-4 py-3">Inseam</th>
                <th className="px-4 py-3">Full Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PANTS.map((r) => (
                <tr key={r.waist} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-bold">{r.waist}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.hip}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.inseam}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.fullLength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-xl p-4 text-sm text-[#1a6b2f]">
          <strong>Tip:</strong> If you&apos;re between sizes, we recommend going one size up for a relaxed streetwear fit. Each product page also shows the exact measurements for that specific piece.
        </div>
      </main>
    </>
  );
}
