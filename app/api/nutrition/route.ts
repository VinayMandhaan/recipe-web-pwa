import { NextResponse } from "next/server";
import { llmConfig } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { ingredients, dish } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "ingredients array is required" },
        { status: 400 }
      );
    }

    const { key, model, url } = llmConfig();
    if (!key) {
      return NextResponse.json(
        { error: "Nutrition estimation unavailable" },
        { status: 503 }
      );
    }

    const prompt =
      `You are a nutrition calculator. Estimate the TOTAL nutrition for the ENTIRE recipe of "${dish || "this dish"}" using ALL ingredients listed below, then divide by the number of servings to get PER-SERVING values.\n\n` +
      `INGREDIENTS (this is the full recipe):\n${ingredients.map((i: string, idx: number) => `${idx + 1}. ${i}`).join("\n")}\n\n` +
      `STEP 1: Estimate how many servings this recipe makes (typically 2-4 for home cooking).\n` +
      `STEP 2: Calculate calories for EACH ingredient using these USDA references:\n` +
      `  - Chicken breast (1 medium ~170g): 280cal, 53g protein, 0g carbs, 6g fat\n` +
      `  - Butter (1 tbsp/14g): 100cal, 0g protein, 0g carbs, 11g fat\n` +
      `  - Oil (1 tbsp/14ml): 120cal, 0g protein, 0g carbs, 14g fat\n` +
      `  - Fresh cream (1/3 cup/80ml): 130cal, 1g protein, 3g carbs, 13g fat\n` +
      `  - Cheese (1 cube/30g): 110cal, 7g protein, 1g carbs, 9g fat\n` +
      `  - Bread/pav (1 piece): 120cal, 4g protein, 22g carbs, 1g fat\n` +
      `  - Rice cooked (1 cup/200g): 260cal, 5g protein, 56g carbs, 0.5g fat\n` +
      `  - Onion (1 small/70g): 28cal, 1g protein, 7g carbs, 0g fat\n` +
      `  - Spices/seasonings (1 tsp): 5-8cal, negligible macros\n` +
      `  - Garlic (1 bulb/40g): 60cal, 3g protein, 13g carbs, 0g fat\n` +
      `  - Mozzarella (100g): 280cal, 28g protein, 3g carbs, 17g fat\n` +
      `  - Milk (100ml): 60cal, 3g protein, 5g carbs, 3g fat\n` +
      `STEP 3: Sum all ingredients to get TOTAL recipe nutrition.\n` +
      `STEP 4: Divide TOTAL by number of servings.\n\n` +
      `SANITY CHECK before answering:\n` +
      `- A typical home-cooked meal serving is 400-800 calories\n` +
      `- If your per-serving calories exceed 1000, you likely forgot to divide by servings\n` +
      `- Spices and seasonings add almost zero calories\n` +
      `- "per taste" or "to adjust" ingredients contribute negligible nutrition\n\n` +
      `Return ONLY this JSON (per-serving values), no markdown:\n` +
      `{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"servings":number,"serving_size":"1 plate","note":"Estimated based on standard ingredient portions"}`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });

    const d = await r.json();
    if (d.error) {
      console.error("LLM nutrition error:", d.error);
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
