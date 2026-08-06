import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/admin/clear-new-tags
// Removes the "NEW" tag from products older than 2 weeks
// Can be called manually or via external cron (cron-job.org)

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Calculate 2 weeks ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Find all products tagged "NEW" that were created more than 2 weeks ago
    const { data: staleProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, name, created_at")
      .eq("tag", "NEW")
      .lt("created_at", twoWeeksAgo.toISOString());

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!staleProducts || staleProducts.length === 0) {
      return NextResponse.json({ message: "No stale NEW tags to clear", cleared: 0 });
    }

    // Clear the NEW tag (set to empty string)
    const ids = staleProducts.map((p) => p.id);
    const { error: updateError } = await supabase
      .from("products")
      .update({ tag: "" })
      .in("id", ids);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Cleared NEW tag from ${staleProducts.length} product(s)`,
      cleared: staleProducts.length,
      products: staleProducts.map((p) => p.name),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
