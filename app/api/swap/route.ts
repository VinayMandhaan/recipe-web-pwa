import { NextResponse } from "next/server";
import { llmConfig } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { ingredient, dish } = await req.json();

    if (!ingredient) {
      return NextResponse.json({ error: "ingredient is required" }, { status: 400 });
    }

    const { key, model, url } = llmConfig();
    if (!key) {
      return NextResponse.json({ error: "Swap suggestions unavailable" }, { status: 503 });
    }

    const prompt =
      `Suggest substitutes for "${ingredient}" in the recipe "${dish || "a dish"}".\n\n` +
      `Return ONLY valid JSON:\n` +
      `{"swaps":[{"name":string,"quantity":string,"note":string}]}\n\n` +
      `Rules:\n` +
      `- Return 2-3 practical substitutes\n` +
      `- "name" is the substitute ingredient\n` +
      `- "quantity" is the adjusted amount to use (e.g. "use same amount", "use 2 tbsp instead")\n` +
      `- "note" is a short tip about how it changes the taste/texture\n` +
      `- Include at least one common/easy-to-find option\n` +
      `- If one swap is healthier, mention it\n` +
      `- Be concise`;

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
        temperature: 0.3,
      }),
    });

    const d = await r.json();
    if (d.error) {
      return NextResponse.json({ error: "Could not get swaps" }, { status: 500 });
    }

    const result = JSON.parse(d.choices[0].message.content);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Swap API error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
