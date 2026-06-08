import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Get logs for a specific date
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const logDate = date || new Date().toISOString().split("T")[0];

    const { data, error } = await getSupabase()
      .from("macro_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", logDate)
      .order("logged_at", { ascending: true });

    if (error) {
      console.error("Fetch macro logs error:", error);
      return NextResponse.json({ error: "Could not fetch logs" }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (err) {
    console.error("Macro log error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Add a meal log
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, log_date, meal_type, dish_name, calories, protein, carbs, fat } = body;

    if (!user_id || !meal_type || !dish_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("macro_logs")
      .insert({
        user_id,
        log_date: log_date || new Date().toISOString().split("T")[0],
        meal_type,
        dish_name,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Save macro log error:", error);
      return NextResponse.json({ error: "Could not save log" }, { status: 500 });
    }

    return NextResponse.json({ log: data });
  } catch (err) {
    console.error("Macro log error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Delete a meal log
export async function DELETE(req: Request) {
  try {
    const { id, user_id } = await req.json();
    if (!id || !user_id) {
      return NextResponse.json({ error: "id and user_id are required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("macro_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Delete macro log error:", error);
      return NextResponse.json({ error: "Could not delete log" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Macro log error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
