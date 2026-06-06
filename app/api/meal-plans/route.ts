import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Get meal plans for a month
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  const month = req.nextUrl.searchParams.get("month"); // 1-12
  const year = req.nextUrl.searchParams.get("year");

  if (!userId || !month || !year) {
    return NextResponse.json({ error: "user_id, month, and year are required" }, { status: 400 });
  }

  // Get first and last day of month (with padding for calendar view)
  const startDate = `${year}-${month.padStart(2, "0")}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

  const { data, error } = await getSupabase()
    .from("meal_plans")
    .select("*, saved_recipes(id, dish, ingredients, steps, tag)")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Fetch meal plans error:", error);
    return NextResponse.json({ error: "Could not fetch meal plans" }, { status: 500 });
  }

  return NextResponse.json({ plans: data });
}

// Add a recipe to a date
export async function POST(req: Request) {
  try {
    const { user_id, date, recipe_id, meal_type } = await req.json();

    if (!user_id || !date || !recipe_id) {
      return NextResponse.json({ error: "user_id, date, and recipe_id are required" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("meal_plans")
      .insert({
        user_id,
        date,
        recipe_id,
        meal_type: meal_type || "dinner",
      })
      .select("*, saved_recipes(id, dish, ingredients, steps, tag)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Recipe already planned for this date" }, { status: 409 });
      }
      console.error("Add meal plan error:", error);
      return NextResponse.json({ error: "Could not add to meal plan" }, { status: 500 });
    }

    return NextResponse.json({ plan: data });
  } catch (err) {
    console.error("Add meal plan error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Remove a meal plan entry
export async function DELETE(req: Request) {
  try {
    const { id, user_id } = await req.json();
    if (!id || !user_id) {
      return NextResponse.json({ error: "id and user_id are required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("meal_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Delete meal plan error:", error);
      return NextResponse.json({ error: "Could not remove from meal plan" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete meal plan error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
