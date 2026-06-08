import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { user_id, fridge_items } = await req.json();

    if (!user_id || !fridge_items || !fridge_items.trim()) {
      return NextResponse.json({ error: "user_id and fridge_items required" }, { status: 400 });
    }

    // Fetch user's saved recipes
    const { data: recipes } = await getSupabase()
      .from("saved_recipes")
      .select("id, dish, ingredients, steps, tag")
      .eq("user_id", user_id)
      .order("saved_at", { ascending: false });

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ matches: [], message: "No saved recipes to match against" });
    }

    // Normalize fridge items into keywords
    const fridgeWords = fridge_items
      .toLowerCase()
      .split(/[,\n]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Score each recipe by ingredient match
    const matches = recipes.map((recipe: { id: string; dish: string; ingredients: string[]; steps: string[]; tag: string | null }) => {
      const total = recipe.ingredients.length;
      let matched = 0;
      const have: string[] = [];
      const need: string[] = [];

      for (const ing of recipe.ingredients) {
        const ingLower = ing.toLowerCase();
        const found = fridgeWords.some((fw: string) =>
          ingLower.includes(fw) || fw.includes(ingLower.split(",")[0].split("(")[0].trim())
        );
        if (found) {
          matched++;
          have.push(ing);
        } else {
          need.push(ing);
        }
      }

      const percent = total > 0 ? Math.round((matched / total) * 100) : 0;

      return {
        id: recipe.id,
        dish: recipe.dish,
        tag: recipe.tag,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        total_ingredients: total,
        matched_count: matched,
        percent,
        have,
        need,
      };
    });

    // Sort by match percentage, filter out 0%
    const sorted = matches
      .filter((m: { percent: number }) => m.percent > 0)
      .sort((a: { percent: number }, b: { percent: number }) => b.percent - a.percent);

    return NextResponse.json({ matches: sorted });
  } catch (err) {
    console.error("Leftover API error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
