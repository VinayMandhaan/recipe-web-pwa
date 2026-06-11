import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { llmConfig } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { user_id, query } = await req.json();

    if (!user_id || !query) {
      return NextResponse.json(
        { error: "user_id and query are required" },
        { status: 400 }
      );
    }

    const { key, model, url } = llmConfig();
    if (!key) {
      return NextResponse.json(
        { error: "AI suggestions unavailable" },
        { status: 503 }
      );
    }

    // Fetch user's saved recipes (dish names + tags + ingredients)
    const { data: recipes } = await getSupabase()
      .from("saved_recipes")
      .select("dish, tag, ingredients")
      .eq("user_id", user_id)
      .order("saved_at", { ascending: false })
      .limit(30);

    const savedList = (recipes || [])
      .map(
        (r: { dish: string; tag: string | null; ingredients: string[] }) =>
          `- ${r.dish}${r.tag ? ` (${r.tag})` : ""}: ${r.ingredients.slice(0, 5).join(", ")}${r.ingredients.length > 5 ? "..." : ""}`
      )
      .join("\n");

    const systemPrompt =
      `You are a helpful AI chef assistant. The user has these saved recipes:\n${savedList || "(no saved recipes yet)"}\n\n` +
      `Based on their collection and preferences, help them with their cooking question.\n\n` +
      `RULES:\n` +
      `- Return ONLY valid JSON, no markdown, no backticks\n` +
      `- Always respond in English\n` +
      `- Format: {"suggestions":[{"dish":string,"type":"saved_match"|"adapted"|"new","why":string,"ingredients":[string],"steps":[string],"missing_ingredients":[string]}]}\n` +
      `- Return 2-4 suggestions, mix of types when possible\n` +
      `- "type" meanings:\n` +
      `  - "saved_match": a recipe from their saved list that fits the query as-is\n` +
      `  - "adapted": a saved recipe modified to work with what they have (simplified, swapped ingredients, etc.)\n` +
      `  - "new": a completely new recipe not in their saved list\n` +
      `- "why" should be a short 1-line reason why you suggest this\n` +
      `- "missing_ingredients" lists items the user would need to buy or might not have. Empty array if they likely have everything.\n` +
      `- Always include full ingredients list and complete steps for every suggestion\n` +
      `- When the user mentions specific ingredients they have (e.g. "I have chicken and rice"):\n` +
      `  1. First check their saved recipes for any that use those ingredients and include them as "saved_match"\n` +
      `  2. Then adapt a saved recipe if it can be simplified to work with those ingredients ("adapted")\n` +
      `  3. Then suggest brand new recipes they can make with those ingredients ("new")\n` +
      `- For adapted recipes, clearly note what was changed in the "why" field\n` +
      `- Keep steps concise but complete\n` +
      `- Be creative and practical`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    const d = await r.json();
    if (d.error) {
      console.error("LLM suggest error:", d.error);
      return NextResponse.json(
        { error: "Could not generate suggestions" },
        { status: 500 }
      );
    }

    const result = JSON.parse(d.choices[0].message.content);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Suggest API error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
