"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_ITEMS = [
  "NEW DROP EVERY WEEK", "UNISEX STREETWEAR", "SUSTAINABLY THRIFTED",
  "FREE DELIVERY OVER ₦65,000", "GOOD-AS-NEW QUALITY",
];

export default function MarqueeBanner() {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("store_settings").select("value").eq("key", "marquee_items").single()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
          } catch {}
        }
      });
  }, []);

  // Duplicate for seamless loop
  const display = [...items, ...items];

  return (
    <div className="bg-[#1a6b2f] text-white py-2.5 overflow-hidden" aria-label="Promotions">
      <div className="marquee-track">
        {display.map((item, i) => (
          <span key={i} className="text-xs font-bold tracking-widest uppercase mx-6">
            {item}<span className="mx-6 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
