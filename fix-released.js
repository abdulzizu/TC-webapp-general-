const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const key = fs.readFileSync(".env.local", "utf8").match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const paystackKey = fs.readFileSync(".env.local", "utf8").match(/PAYSTACK_SECRET_KEY=(.+)/)[1].trim();
const sb = createClient("https://cdxuppunppsgryvrieoz.supabase.co", key, { auth: { autoRefreshToken: false, persistSession: false } });

const orderIds = ["TC-LOI9HM","TC-FBFW2W","TC-ZREVPY","TC-P500P5","TC-GIT3RG","TC-YK7QJI","TC-N2DR7T","TC-AEO7JM","TC-XUFCRY","TC-CSQSBS","TC-DK9FYC"];

(async () => {
  for (const oid of orderIds) {
    try {
      const res = await fetch("https://api.paystack.co/transaction/verify/" + oid, {
        headers: { Authorization: "Bearer " + paystackKey }
      });
      const data = await res.json();
      const paid = data.status && data.data?.status === "success";

      if (paid) {
        const { data: order } = await sb.from("orders").select("id, is_stockpile").eq("order_id", oid).single();
        if (order) {
          const status = order.is_stockpile ? "stockpiled" : "processing";
          await sb.from("orders").update({ status }).eq("id", order.id);
          const { data: items } = await sb.from("order_items").select("product_id").eq("order_id", order.id);
          if (items) {
            for (const item of items) {
              if (item.product_id) await sb.from("products").update({ tag: "SOLD OUT" }).eq("id", item.product_id);
            }
          }
          console.log(oid, "→ RESTORED (paid, status:", status + ")");
        }
      } else {
        console.log(oid, "→ NOT PAID (correctly cancelled)");
      }
    } catch (e) {
      console.log(oid, "→ ERROR:", e.message);
    }
  }
  console.log("\nDone!");
})();
