import { NextResponse } from "next/server";

const GROQ_KEY = () => process.env.GROQ_API_KEY || "";
const GROQ_MODEL = () => process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export async function POST(req: Request) {
  try {
    const { ingredients, dish } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "ingredients array is required" },
        { status: 400 }
      );
    }

    const key = GROQ_KEY();
    if (!key) {
      return NextResponse.json(
        { error: "Nutrition estimation unavailable" },
        { status: 503 }
      );
    }

    const prompt =
      `You are a precise nutrition calculator. Estimate nutrition for one serving of "${dish || "this dish"}" ` +
      `based on these ingredients:\n${ingredients.join("\n")}\n\n` +
      `Return ONLY JSON, no markdown:\n` +
      `{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"servings":number,"serving_size":string,"note":string}\n\n` +
      `CRITICAL RULES for accuracy:\n` +
      `- Use USDA nutritional data as your reference\n` +
      `- Calculate each ingredient individually then sum up\n` +
      `- Common reference points per 100g raw:\n` +
      `  Potato: 77cal, 2g protein | Rice (cooked): 130cal, 2.7g protein\n` +
      `  Chicken breast: 165cal, 31g protein | Lentils/dal (cooked): 116cal, 9g protein\n` +
      `  Cooking oil (1 tbsp): 120cal, 0g protein | Most vegetables: 20-40cal, 1-2g protein per 100g\n` +
      `- Do NOT inflate protein for vegetable-only dishes. A veggie dish with 200g vegetables has ~4-6g protein, not 10+\n` +
      `- Estimate per single serving\n` +
      `- "servings" is how many servings the full ingredient list makes\n` +
      `- "serving_size" is a short description like "1 plate" or "1 bowl"\n` +
      `- "note" is a brief one-line disclaimer\n` +
      `- Be accurate above all else`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL(),
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });

    const d = await r.json();
    if (d.error) {
      console.error("Groq nutrition error:", d.error);
      return NextResponse.json(
        { error: "Could not estimate nutrition" },
        { status: 500 }
      );
    }

    const nutrition = JSON.parse(d.choices[0].message.content);
    return NextResponse.json({ nutrition });
  } catch (err) {
    console.error("Nutrition API error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
