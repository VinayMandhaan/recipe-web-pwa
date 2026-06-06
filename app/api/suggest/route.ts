import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const GROQ_KEY = () => process.env.GROQ_API_KEY || "";
const GROQ_MODEL = () => process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export async function POST(req: NextRequest) {
  try {
    const { user_id, query } = await req.json();

    if (!user_id || !query) {
      return NextResponse.json(
        { error: "user_id and query are required" },
        { status: 400 }
      );
    }

    const key = GROQ_KEY();
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
      `- Format: {"suggestions":[{"dish":string,"why":string,"ingredients":[string],"steps":[string],"is_from_saved":boolean}]}\n` +
      `- Return 1-3 suggestions\n` +
      `- "why" should be a short 1-line reason why you suggest this\n` +
      `- "is_from_saved" is true only if the dish exactly matches one of their saved recipes\n` +
      `- If suggesting a new recipe, include full ingredients and steps\n` +
      `- If suggesting from saved, still include ingredients and steps\n` +
      `- Keep steps concise but complete\n` +
      `- Be creative and helpful`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL(),
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
      console.error("Groq suggest error:", d.error);
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
