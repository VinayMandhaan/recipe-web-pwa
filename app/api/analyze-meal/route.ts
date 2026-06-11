import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { llmConfig } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { image, step, ingredients, dish, user_id } = await req.json();

    const { key, model, url, visionModel } = llmConfig();
    if (!key) {
      return NextResponse.json(
        { error: "AI analysis unavailable" },
        { status: 503 }
      );
    }

    // Step 1: Identify dish and ingredients from photo
    if (step === "identify") {
      if (!image) {
        return NextResponse.json(
          { error: "image is required" },
          { status: 400 }
        );
      }

      const r = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: visionModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Look at this food photo carefully.\n\n" +
                    "FIRST: Check if there is a visible NUTRITION FACTS LABEL or packaged food with nutritional info printed on it.\n\n" +
                    "IF a nutrition label IS visible, READ the exact values from the label and return:\n" +
                    '{"dish":string,"ingredients":[string],"confidence":"high","has_nutrition_label":true,' +
                    '"label_nutrition":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"serving_size":string}}\n\n' +
                    "- Read calories, protein, total carbohydrate, total fat, and fiber EXACTLY as printed\n" +
                    "- Do NOT estimate or round. Copy the numbers from the label precisely\n" +
                    "- For serving_size, read it from the label (e.g. '8.45 fl oz (250 mL)')\n" +
                    "- For dish, use the product name visible on the package\n\n" +
                    "IF there is NO nutrition label (it's a plate of food, a cooked meal, etc.), return:\n" +
                    '{"dish":string,"ingredients":[string],"confidence":"high"|"medium"|"low","has_nutrition_label":false}\n\n' +
                    "Rules for meals without labels:\n" +
                    "- Name the dish in English\n" +
                    "- List all visible and likely ingredients with approximate quantities\n" +
                    "- CRITICAL: Do NOT overestimate quantities. Most people photograph single servings, not family-sized portions. Use these visual anchors:\n" +
                    "  * A loose handful of salad greens = ~30-40g, a bowlful = ~60-80g (NOT 200g, that would overflow most plates)\n" +
                    "  * A small fried chicken piece/wing = ~50-60g, a thigh = ~80-100g, a breast = ~120-150g\n" +
                    "  * A spoonful of chickpeas/beans = ~30g, a small scattering on a salad = ~30-50g\n" +
                    "  * A few slices of onion = ~10g, a ring or two = ~5g\n" +
                    "  * A tablespoon of corn kernels = ~10g\n" +
                    "  * 1 cup cooked rice = ~150-180g, half a plate = ~200g\n" +
                    "  * 1 roti/chapati = ~30-40g\n" +
                    "- When in doubt, estimate LOWER rather than higher. Underestimating by 20% is better than overestimating by 50%.\n" +
                    "- NEVER list the same food item twice in different forms. For example, if you see a fried chicken piece, list ONLY '1 fried chicken piece (~60g)' - do NOT also list '100g cooked chicken' separately. Each physical item on the plate should appear exactly once.\n" +
                    "- If a protein (chicken, fish, meat) is fried or breaded, list it as the fried version with its approximate weight. Do not split it into 'cooked meat' + 'fried piece'.\n" +
                    "- Include cooking oils, spices, and garnishes you can reasonably infer\n" +
                    "- If unsure about the dish, give your best guess and set confidence to low\n" +
                    "Return ONLY valid JSON, no markdown.",
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 1024,
        }),
      });

      const d = await r.json();
      if (d.error) {
        console.error("LLM vision error:", d.error);
        return NextResponse.json(
          { error: d.error.message || "Could not analyze image" },
          { status: 500 }
        );
      }

      const result = JSON.parse(d.choices[0].message.content);
      return NextResponse.json(result);
    }

    // Step 2: Get nutrition + improvement suggestions from confirmed ingredients
    if (step === "nutrition") {
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return NextResponse.json(
          { error: "ingredients array is required" },
          { status: 400 }
        );
      }

      const prompt =
        `You are a precise nutrition calculator. Analyze "${dish || "this dish"}" ` +
        `with these ingredients:\n${ingredients.join("\n")}\n\n` +
        `Return ONLY valid JSON:\n` +
        `{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,` +
        `"serving_size":string,` +
        `"rating":"excellent"|"good"|"fair"|"poor",` +
        `"rating_reason":string,` +
        `"improvements":[{"tip":string,"impact":string}]}\n\n` +
        `CRITICAL RULES for accuracy:\n` +
        `- FIRST: Scan the ingredient list for duplicates. If the same food appears twice in different forms (e.g. "100g cooked chicken" AND "1 fried chicken piece"), count it ONLY ONCE using the more specific entry. Do not double-count.\n` +
        `- Use USDA nutritional data as your reference\n` +
        `- Calculate each ingredient individually then sum up. Show your work mentally.\n` +
        `- Common reference points per 100g raw:\n` +
        `  Potato: 77cal, 2g protein, 17g carbs, 0.1g fat\n` +
        `  Okra: 33cal, 1.9g protein, 7g carbs, 0.2g fat\n` +
        `  Rice (cooked): 130cal, 2.7g protein, 28g carbs, 0.3g fat\n` +
        `  Chicken breast: 165cal, 31g protein, 0g carbs, 3.6g fat\n` +
        `  Cooking oil (1 tbsp/15ml): 120cal, 0g protein, 0g carbs, 14g fat\n` +
        `  Lentils/dal (cooked 100g): 116cal, 9g protein, 20g carbs, 0.4g fat\n` +
        `  Fried chicken (1 small piece ~80g with breading): ~190cal, 15g protein, 7g carbs, 12g fat\n` +
        `  Chickpeas (cooked 100g): 164cal, 9g protein, 27g carbs, 2.6g fat\n` +
        `  Mixed salad greens (100g): 15cal, 1.3g protein, 2.2g carbs, 0.2g fat\n` +
        `- Do NOT inflate protein for vegetable-only dishes. Vegetables have very little protein.\n` +
        `- A pure veggie dish (no meat/dal/paneer/eggs) with 200g vegetables typically has 3-6g protein total, not 10+\n` +
        `- CRITICAL: The ingredients listed may be for a FULL BATCH, not one serving. You MUST:\n` +
        `  1. First calculate total nutrition for ALL ingredients combined\n` +
        `  2. Then estimate how many servings the batch makes (e.g. energy balls = 15-20 pieces, a curry = 3-4 plates)\n` +
        `  3. DIVIDE the totals by the number of servings\n` +
        `  4. Report the PER-SERVING numbers only\n` +
        `- Sanity check: a single serving should almost never exceed 800 calories. If your per-serving number is over 800, you probably forgot to divide by servings.\n` +
        `- "serving_size" should describe one portion (e.g. "1 energy ball", "1 bowl", "1 plate")\n` +
        `- "rating" MUST follow these strict rules (do NOT default to "good"):\n` +
        `  "excellent": protein > 25g AND calories < 500 AND fat < 15g (e.g. grilled chicken salad, dal with veggies)\n` +
        `  "good": protein > 15g AND calories < 600 AND balanced macros (e.g. chicken rice bowl, fish curry)\n` +
        `  "fair": protein < 15g OR calories > 600 OR carbs > 60g OR fat > 25g (e.g. energy balls, fried snacks, heavy pasta)\n` +
        `  "poor": protein < 8g AND (calories > 500 OR fat > 30g OR sugar-heavy) (e.g. fries, candy, sugary desserts)\n` +
        `- A meal with <10g protein is NEVER "good" or "excellent", even if it has fiber\n` +
        `- A meal with >500 calories and <15g protein is "fair" at best\n` +
        `- "rating_reason" is a 1-line explanation referencing the specific numbers\n` +
        `- "improvements" is 2-4 practical tips to make this meal healthier\n` +
        `- Each tip should have a short "tip" and a brief "impact" (e.g. "Add 100g paneer for +18g protein")\n` +
        `- If protein is below 15g, the first improvement MUST suggest a specific protein source with exact grams\n` +
        `- Be accurate above all else`;

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

      const result = JSON.parse(d.choices[0].message.content);

      // Log the scan to Supabase (fire and forget)
      try {
        await getSupabase()
          .from("meal_scans")
          .insert({
            user_id: user_id || null,
            dish: dish || "Unknown",
            ingredients,
            calories: result.calories || 0,
            protein_g: result.protein_g || 0,
            carbs_g: result.carbs_g || 0,
            fat_g: result.fat_g || 0,
            fiber_g: result.fiber_g || 0,
            rating: result.rating || null,
          });
      } catch { /* silent - don't break the response if logging fails */ }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (err) {
    console.error("Analyze meal error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
