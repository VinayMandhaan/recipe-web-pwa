import { NextResponse } from "next/server";

const GROQ_KEY = () => process.env.GROQ_API_KEY || "";

// Use vision-capable model for image analysis
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function POST(req: Request) {
  try {
    const { image, step, ingredients, dish } = await req.json();

    const key = GROQ_KEY();
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

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Look at this food photo. Identify the dish and list all likely ingredients.\n\n" +
                    "Return ONLY valid JSON, no markdown:\n" +
                    '{"dish":string,"ingredients":[string],"confidence":"high"|"medium"|"low"}\n\n' +
                    "Rules:\n" +
                    "- Name the dish in English\n" +
                    "- List all visible and likely ingredients with approximate quantities (e.g. '2 cups rice', '200g chicken')\n" +
                    "- Include cooking oils, spices, and garnishes you can reasonably infer\n" +
                    "- If unsure about the dish, give your best guess and set confidence to low\n" +
                    "- Be specific with quantities based on what looks like a single serving",
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
        console.error("Groq vision error:", d.error);
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
        `Analyze the nutrition and suggest improvements for "${dish || "this dish"}" ` +
        `with these ingredients:\n${ingredients.join("\n")}\n\n` +
        `Return ONLY valid JSON:\n` +
        `{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,` +
        `"serving_size":string,` +
        `"rating":"excellent"|"good"|"fair"|"poor",` +
        `"rating_reason":string,` +
        `"improvements":[{"tip":string,"impact":string}]}\n\n` +
        `Rules:\n` +
        `- Estimate for the single serving shown\n` +
        `- "rating" is an overall healthiness rating\n` +
        `- "rating_reason" is a 1-line explanation of the rating\n` +
        `- "improvements" is a list of 2-4 practical tips to make this meal healthier\n` +
        `- Each tip should have a short "tip" and a brief "impact" (e.g. "Saves ~100 calories")\n` +
        `- Be practical, not preachy`;

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
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

      const result = JSON.parse(d.choices[0].message.content);
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
