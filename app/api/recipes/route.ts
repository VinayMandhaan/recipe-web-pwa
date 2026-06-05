import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Save a recipe
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, source_url, platform, dish, stage, ingredients, steps, confidence, note } = body;

    if (!user_id || !dish) {
      return NextResponse.json({ error: "user_id and dish are required" }, { status: 400 });
    }

    // Check if already saved (same user + same url)
    if (source_url) {
      const { data: existing } = await supabase
        .from("saved_recipes")
        .select("id")
        .eq("user_id", user_id)
        .eq("source_url", source_url)
        .single();

      if (existing) {
        return NextResponse.json({ error: "Recipe already saved" }, { status: 409 });
      }
    }

    const { data, error } = await supabase
      .from("saved_recipes")
      .insert({
        user_id,
        source_url: source_url || null,
        platform: platform || null,
        dish,
        stage: stage || null,
        ingredients: ingredients || [],
        steps: steps || [],
        confidence: confidence || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Save recipe error:", error);
      return NextResponse.json({ error: "Could not save recipe" }, { status: 500 });
    }

    return NextResponse.json({ recipe: data });
  } catch (err) {
    console.error("Save recipe error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Get saved recipes for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_recipes")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("Fetch recipes error:", error);
    return NextResponse.json({ error: "Could not fetch recipes" }, { status: 500 });
  }

  return NextResponse.json({ recipes: data });
}

// Delete a saved recipe
export async function DELETE(req: Request) {
  try {
    const { id, user_id } = await req.json();
    if (!id || !user_id) {
      return NextResponse.json({ error: "id and user_id are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Delete recipe error:", error);
      return NextResponse.json({ error: "Could not delete recipe" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete recipe error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
