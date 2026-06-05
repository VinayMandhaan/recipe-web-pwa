import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Log a search to history
export async function POST(req: Request) {
  try {
    const { user_id, source_url, platform, dish, stage, caption, result } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("history")
      .insert({
        user_id,
        source_url: source_url || null,
        platform: platform || null,
        dish: dish || null,
        stage: stage || null,
        caption: caption || null,
        result: result || null,
      });

    if (error) {
      console.error("History insert error:", error);
      // Don't fail the user experience for history logging
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ ok: true }); // silent fail
  }
}

// Get history for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("history")
    .select("*")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Could not fetch history" }, { status: 500 });
  }

  return NextResponse.json({ history: data });
}
