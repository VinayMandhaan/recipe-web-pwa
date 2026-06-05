"use client";

import { useState } from "react";
import RecipeCard from "./RecipeCard";
import RecipeDetail from "./RecipeDetail";
import { useAuth } from "./AuthProvider";

interface ExtractResponse {
  url: string;
  platform: string | null;
  caption: string;
  caption_ok: boolean;
  reason: string | null;
  stage: "caption" | "blog" | "transcript" | "fallback";
  result: {
    is_recipe: boolean;
    dish: string;
    ingredients: string[];
    steps: string[];
    confidence: string;
    note?: string;
  } | null;
  message?: string;
}

interface DummyRecipe {
  emoji: string;
  title: string;
  tag: string;
  ingredients: string[];
  steps: string[];
}

const TRENDING: DummyRecipe[] = [
  {
    emoji: "🍝",
    title: "Creamy Garlic Pasta",
    tag: "Trending",
    ingredients: [
      "400g penne pasta",
      "4 cloves garlic, minced",
      "1 cup heavy cream",
      "1/2 cup parmesan cheese, grated",
      "2 tbsp butter",
      "1 tbsp olive oil",
      "Salt and black pepper to taste",
      "Fresh parsley, chopped",
      "Red chili flakes (optional)",
    ],
    steps: [
      "Cook pasta in salted boiling water until al dente. Reserve 1/2 cup pasta water, then drain.",
      "Heat butter and olive oil in a large pan over medium heat. Add minced garlic and cook for 1 minute until fragrant.",
      "Pour in heavy cream, stir well, and let it simmer for 2-3 minutes until slightly thickened.",
      "Add parmesan cheese and stir until melted and smooth. Season with salt and pepper.",
      "Toss in the cooked pasta. Add a splash of pasta water if the sauce is too thick.",
      "Garnish with fresh parsley and chili flakes. Serve hot.",
    ],
  },
  {
    emoji: "🍗",
    title: "Butter Chicken",
    tag: "Popular",
    ingredients: [
      "500g chicken thighs, boneless, cubed",
      "1 cup yogurt",
      "2 tbsp lemon juice",
      "1 tsp turmeric",
      "2 tsp garam masala",
      "2 tsp chili powder",
      "1 tbsp ginger garlic paste",
      "2 tbsp butter",
      "1 tbsp oil",
      "1 large onion, finely chopped",
      "400g canned tomatoes, pureed",
      "1 cup heavy cream",
      "1 tsp sugar",
      "Salt to taste",
      "Fresh coriander for garnish",
    ],
    steps: [
      "Marinate chicken with yogurt, lemon juice, turmeric, 1 tsp garam masala, chili powder, and ginger garlic paste. Refrigerate for at least 30 minutes.",
      "Heat oil in a pan and cook marinated chicken on high heat until charred on the edges. Set aside.",
      "In the same pan, melt butter. Add onion and cook until golden brown, about 5-6 minutes.",
      "Add pureed tomatoes, remaining garam masala, and sugar. Simmer for 10 minutes until the sauce thickens.",
      "Stir in heavy cream and add the cooked chicken. Simmer on low for 10 minutes.",
      "Adjust salt, garnish with fresh coriander, and serve with naan or rice.",
    ],
  },
  {
    emoji: "🥗",
    title: "Caesar Salad",
    tag: "Healthy",
    ingredients: [
      "1 large romaine lettuce, chopped",
      "1/2 cup croutons",
      "1/4 cup parmesan cheese, shaved",
      "2 anchovy fillets (or 1 tsp anchovy paste)",
      "1 clove garlic, minced",
      "1 egg yolk",
      "1 tbsp Dijon mustard",
      "2 tbsp lemon juice",
      "1/3 cup olive oil",
      "Salt and pepper to taste",
    ],
    steps: [
      "Make the dressing: mash anchovy fillets with garlic into a paste. Whisk in egg yolk, Dijon mustard, and lemon juice.",
      "Slowly drizzle in olive oil while whisking until the dressing is thick and emulsified. Season with salt and pepper.",
      "Place chopped romaine lettuce in a large bowl.",
      "Pour the dressing over the lettuce and toss well to coat every leaf.",
      "Top with croutons and shaved parmesan. Serve immediately.",
    ],
  },
  {
    emoji: "🍰",
    title: "No-Bake Cheesecake",
    tag: "Dessert",
    ingredients: [
      "200g digestive biscuits, crushed",
      "80g butter, melted",
      "500g cream cheese, softened",
      "100g powdered sugar",
      "1 tsp vanilla extract",
      "300ml heavy cream",
      "Fresh berries for topping",
      "2 tbsp lemon juice",
    ],
    steps: [
      "Mix crushed biscuits with melted butter. Press firmly into the bottom of a 9-inch springform pan. Refrigerate for 15 minutes.",
      "Beat cream cheese, powdered sugar, vanilla, and lemon juice until smooth and fluffy.",
      "In a separate bowl, whip heavy cream until stiff peaks form.",
      "Gently fold the whipped cream into the cream cheese mixture until combined. Do not overmix.",
      "Pour the filling over the biscuit base and smooth the top with a spatula.",
      "Refrigerate for at least 4 hours, or overnight for best results.",
      "Top with fresh berries before serving.",
    ],
  },
];

export default function HomeTab() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDummy, setSelectedDummy] = useState<DummyRecipe | null>(null);

  async function handleExtract() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        // Log to history (fire and forget)
        if (user) {
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              source_url: json.url,
              platform: json.platform,
              dish: json.result?.dish || null,
              stage: json.stage,
              caption: json.caption,
              result: json.result,
            }),
          }).catch(() => {}); // silent
        }
      }
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Hero */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#f0f0f5]">
          What are we cooking<br />today?
        </h1>
        <p className="text-sm text-[#55556a] mt-1">
          Paste a reel link to extract the recipe
        </p>
      </div>

      {/* URL Input */}
      <div className="px-5 pb-5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55556a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleExtract()}
              placeholder="Paste TikTok or Instagram link..."
              className="w-full pl-10 pr-4 py-3 bg-[#16161e] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                         focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50
                         placeholder:text-[#3a3a4a]"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            className="px-5 py-3 gradient-accent text-white font-semibold rounded-xl text-sm
                       active:opacity-80 transition-opacity
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="px-5 pb-6 space-y-5">
        {/* Loading */}
        {loading && (
          <div className="bg-[#16161e] rounded-2xl border border-[#2a2a3a] p-5 space-y-3">
            <div className="h-5 shimmer rounded w-3/4" />
            <div className="h-4 shimmer rounded w-1/2" />
            <div className="space-y-2 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3.5 shimmer rounded w-full" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {data && !loading && <RecipeCard data={data} />}

        {/* Trending section (show when no result) */}
        {!data && !loading && !error && (
          <>
            {/* Banner */}
            <div className="relative overflow-hidden rounded-2xl h-40 gradient-accent">
              <div className="absolute inset-0 flex items-center px-6">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Featured</p>
                  <h3 className="text-white text-xl font-bold mt-1">Discover recipes from<br />your favorite creators</h3>
                </div>
              </div>
              <div className="absolute right-4 bottom-4 text-6xl opacity-30">🍽️</div>
            </div>

            {/* Trending */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
                Trending categories
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TRENDING.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setSelectedDummy(item)}
                    className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-3
                               active:bg-[#1e1e2a] transition-colors text-left"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-[#c0c0d0]">{item.title}</p>
                      <p className="text-[10px] text-[#55556a]">{item.tag}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-2">
                How it works
              </h3>
              <div className="space-y-2.5">
                {[
                  { n: "1", t: "Paste a TikTok or Instagram reel link" },
                  { n: "2", t: "We extract the recipe from caption, blog, or audio" },
                  { n: "3", t: "Get ingredients, steps, and a shopping list" },
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-500/15 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {s.n}
                    </span>
                    <p className="text-sm text-[#8888a0]">{s.t}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dummy recipe detail overlay */}
      {selectedDummy && (
        <RecipeDetail
          dish={selectedDummy.title}
          ingredients={selectedDummy.ingredients}
          steps={selectedDummy.steps}
          onClose={() => setSelectedDummy(null)}
        />
      )}
    </div>
  );
}
