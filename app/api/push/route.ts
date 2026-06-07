import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Save push subscription
export async function POST(req: NextRequest) {
  try {
    const { user_id, subscription } = await req.json();
    if (!user_id || !subscription) {
      return NextResponse.json({ error: "user_id and subscription required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("push_subscriptions")
      .upsert(
        { user_id, subscription, created_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Save push subscription error:", error);
      return NextResponse.json({ error: "Could not save subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Remove push subscription
export async function DELETE(req: NextRequest) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    await getSupabase()
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Check subscription status
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data } = await getSupabase()
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return NextResponse.json({ subscribed: !!data });
}
