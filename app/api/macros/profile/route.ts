import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Get macro profile
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabase()
      .from("macro_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Fetch macro profile error:", error);
      return NextResponse.json({ error: "Could not fetch profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: data || null });
  } catch (err) {
    console.error("Macro profile error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Create or update macro profile (upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_id, gender, age, height_cm, weight_kg,
      activity_level, goal,
      target_calories, target_protein, target_carbs, target_fat,
    } = body;

    if (!user_id || !gender || !age || !height_cm || !weight_kg) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("macro_profiles")
      .upsert(
        {
          user_id,
          gender,
          age: Number(age),
          height_cm: Number(height_cm),
          weight_kg: Number(weight_kg),
          activity_level: activity_level || "active",
          goal: goal || "maintain",
          target_calories: Number(target_calories),
          target_protein: Number(target_protein),
          target_carbs: Number(target_carbs),
          target_fat: Number(target_fat),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Save macro profile error:", error);
      return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Macro profile error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
