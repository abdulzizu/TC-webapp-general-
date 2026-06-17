export default function MarqueeBanner() {
  const items = [
    "NEW DROP EVERY WEEK", "UNISEX STREETWEAR", "SUSTAINABLY THRIFTED",
    "FREE SHIPPING OVER ₦30,000", "GOOD-AS-NEW QUALITY",
    "NEW DROP EVERY WEEK", "UNISEX STREETWEAR", "SUSTAINABLY THRIFTED",
    "FREE SHIPPING OVER ₦30,000", "GOOD-AS-NEW QUALITY",
  ];
  return (
    <div className="bg-[#1a6b2f] text-white py-2.5 overflow-hidden" aria-label="Promotions">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span key={i} className="text-xs font-bold tracking-widest uppercase mx-6">
            {item}<span className="mx-6 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
