"use client";

import { useState, useEffect, useCallback } from "react";
import RecipeCard, { ExtractResponse } from "./RecipeCard";
import RecipeDetail from "./RecipeDetail";
import SnapMeal from "./SnapMeal";
import AccountTab from "./AccountTab";
import { useAuth } from "./AuthProvider";

interface Suggestion {
  dish: string;
  type: "saved_match" | "adapted" | "new";
  why: string;
  ingredients: string[];
  steps: string[];
  missing_ingredients: string[];
}

interface DummyRecipe {
  emoji: string;
  title: string;
  tag: string;
  ingredients: string[];
  steps: string[];
}

const SUGGESTION_CHIPS = [
  { emoji: "🌙", label: "What's for dinner?", query: "Suggest something for dinner tonight. Something satisfying and not too complicated." },
  { emoji: "⚡", label: "Quick 30-min meal", query: "Suggest a quick meal I can make in under 30 minutes." },
  { emoji: "🥗", label: "Something healthy", query: "Suggest a healthy, nutritious meal. Low calorie, high protein if possible." },
  { emoji: "🍳", label: "Use my pantry", query: "Based on the ingredients I already have from my saved recipes, suggest something I can make without buying much more." },
  { emoji: "🎉", label: "Impress guests", query: "Suggest something impressive I can cook for guests this weekend." },
  { emoji: "🆕", label: "Try something new", query: "Suggest a recipe I haven't saved yet. Something different from my usual cooking style." },
];

const TYPE_BADGES: Record<string, { label: string; color: string; emoji: string }> = {
  saved_match: { label: "From saved", emoji: "📌", color: "bg-green-50 text-green-600 border-green-200" },
  adapted: { label: "Adapted", emoji: "🔄", color: "bg-purple-50 text-purple-600 border-purple-200" },
  new: { label: "New recipe", emoji: "✨", color: "bg-blue-50 text-blue-600 border-blue-200" },
};

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

const CAROUSEL_SLIDES = [
  {
    gradient: "from-blue-600 to-blue-800",
    label: "Extract",
    title: "Paste a link, get\nthe full recipe",
    scene: "extract",
  },
  {
    gradient: "from-violet-600 to-violet-800",
    label: "Scan",
    title: "Snap your meal for\ninstant nutrition info",
    scene: "scan",
  },
  {
    gradient: "from-emerald-600 to-emerald-800",
    label: "Plan",
    title: "Organize your meals\nfor the whole week",
    scene: "plan",
  },
  {
    gradient: "from-rose-600 to-rose-800",
    label: "Track",
    title: "Hit your daily\nmacro targets",
    scene: "track",
  },
];

function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  const slide = CAROUSEL_SLIDES[active];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl h-44 bg-gradient-to-br ${slide.gradient} transition-all duration-700 shadow-lg`}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

      {/* Text */}
      <div className="absolute inset-0 flex items-center px-6 z-10">
        <div key={active} className="animate-fade-in-up">
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{slide.label}</p>
          <h3 className="text-white text-lg font-bold mt-1.5 leading-snug whitespace-pre-line drop-shadow-md">{slide.title}</h3>
        </div>
      </div>

      {/* Animated scene */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 z-10">
        {slide.scene === "extract" && <ExtractMini key="e" />}
        {slide.scene === "scan" && <ScanMini key="s" />}
        {slide.scene === "plan" && <PlanMini key="p" />}
        {slide.scene === "track" && <TrackMini key="t" />}
      </div>

      {/* Dots */}
      <div className="absolute bottom-3.5 left-6 flex gap-1.5 z-10">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/[0.07]" />
      <div className="absolute right-10 -bottom-6 w-20 h-20 rounded-full bg-white/[0.05]" />
    </div>
  );
}

function ExtractMini() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 animate-fade-in-up">
      <div className="w-20 h-9 bg-white/20 rounded-lg flex items-center px-2.5 gap-1.5 overflow-hidden backdrop-blur-sm border border-white/10">
        <svg className="w-3.5 h-3.5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
        </svg>
        <div className="h-1.5 bg-white/30 rounded-full flex-1 overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ animation: "typing 2s ease-in-out infinite" }} />
        </div>
      </div>
      <svg className="w-4 h-4 text-white animate-bounce" style={{ animationDuration: "1.5s" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      <div className="w-20 bg-white/20 rounded-lg p-2 space-y-1 backdrop-blur-sm border border-white/10">
        <div className="h-1.5 bg-white/80 rounded-full w-12" />
        <div className="h-1.5 bg-white/50 rounded-full w-9" />
        <div className="h-1.5 bg-white/50 rounded-full w-14" />
      </div>
    </div>
  );
}

function ScanMini() {
  return (
    <div className="w-full h-full flex items-center justify-center animate-fade-in-up">
      <div className="relative w-20 h-24 bg-white/15 rounded-xl border border-white/20 overflow-hidden backdrop-blur-sm">
        <div className="absolute left-1/2 -translate-x-1/2 top-[12%] w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
          <span className="text-xl">🍛</span>
        </div>
        <div className="absolute left-1.5 right-1.5 h-[2px] bg-green-300 animate-scan-line rounded-full shadow-[0_0_8px_rgba(134,239,172,0.6)]" style={{ animationDuration: "2s" }} />
        <div className="absolute bottom-2 left-2 right-2 space-y-1.5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded bg-green-400/80 animate-pop-in" style={{ animationDelay: "0.5s" }} />
            <div className="h-3 flex-1 bg-white/25 rounded" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded bg-blue-400/80 animate-pop-in" style={{ animationDelay: "0.8s" }} />
            <div className="h-3 flex-1 bg-white/25 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanMini() {
  return (
    <div className="w-full h-full flex items-center justify-center animate-fade-in-up">
      <div className="bg-white/15 rounded-xl p-2.5 border border-white/20 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-1.5">
          {["M","T","W","T"].map((d, i) => (
            <div key={i} className="text-[8px] text-white/80 text-center font-bold">{d}</div>
          ))}
          {[0,1,2,3,4,5,6,7].map((i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center animate-pop-in border border-white/10"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {i < 5 && (
                <span className="text-[10px]">{["🍳","🥗","🍗","🍝","🍰"][i]}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackMini() {
  return (
    <div className="w-full h-full flex items-center justify-center animate-fade-in-up">
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative">
          <svg width="56" height="56" className="-rotate-90">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 * 0.3}
              className="animate-ring-fill"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white font-bold drop-shadow-sm">70%</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[
            { color: "bg-white", w: 75 },
            { color: "bg-white/70", w: 55 },
            { color: "bg-white/50", w: 40 },
          ].map((bar, i) => (
            <div key={i} className="w-9 h-2 bg-white/15 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.color} rounded-full animate-fill-bar`}
                style={{ width: `${bar.w}%`, animationDelay: `${i * 0.2}s` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeTab() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDummy, setSelectedDummy] = useState<DummyRecipe | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showSnapMeal, setShowSnapMeal] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showLeftover, setShowLeftover] = useState(false);
  const [showSmartChef, setShowSmartChef] = useState(false);
  const [fridgeInput, setFridgeInput] = useState("");
  const [leftoverLoading, setLeftoverLoading] = useState(false);
  const [leftoverMatches, setLeftoverMatches] = useState<{
    id: string; dish: string; tag: string | null; ingredients: string[]; steps: string[];
    percent: number; have: string[]; need: string[];
  }[]>([]);
  const [selectedLeftover, setSelectedLeftover] = useState<{
    dish: string; ingredients: string[]; steps: string[];
  } | null>(null);

  async function handleAiSuggest(query: string) {
    if (!user || aiLoading) return;
    setAiLoading(true);
    setSuggestions([]);
    setAiError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, query }),
      });
      const json = await res.json();
      if (json.error) {
        setAiError(json.error);
      } else {
        setSuggestions(json.suggestions || []);
      }
    } catch {
      setAiError("Could not get suggestions. Try again.");
    } finally {
      setAiLoading(false);
      setAiQuery("");
    }
  }

  async function handleLeftoverSearch() {
    if (!user || !fridgeInput.trim() || leftoverLoading) return;
    setLeftoverLoading(true);
    setLeftoverMatches([]);
    try {
      const res = await fetch("/api/leftover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, fridge_items: fridgeInput.trim() }),
      });
      const d = await res.json();
      setLeftoverMatches(d.matches || []);
    } catch { /* silent */ }
    setLeftoverLoading(false);
  }

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
    <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Hello, <span className="font-medium text-gray-600">{user?.name?.split(" ")[0] || "Chef"}</span></p>
          <h1 className="text-xl font-bold text-gray-900">What are we cooking today?</h1>
        </div>
        <button
          onClick={() => setShowAccount(true)}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center
                     shadow-sm active:bg-gray-50 transition-colors shrink-0"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Extract Card */}
      <div className="px-5 pb-4">
        <div className="bg-blue-500 border border-blue-600 rounded-2xl p-5 shadow-md shadow-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className="text-white font-bold text-base">Extract Recipe</h2>
          </div>
          <p className="text-blue-100 text-xs mb-4">Paste a reel or video link and we pull out the full recipe</p>

          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleExtract()}
              placeholder="Paste link here..."
              className="flex-1 px-4 py-3 bg-white/20 border border-white/25 rounded-xl text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/25
                         placeholder:text-white/50 transition-all"
              disabled={loading}
            />
            <button
              onClick={handleExtract}
              disabled={loading || !url.trim()}
              className="px-5 py-3 bg-white text-blue-600 font-bold rounded-xl text-sm
                         active:bg-blue-50 transition-colors shadow-sm
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                "Extract"
              )}
            </button>
          </div>

          {/* Platform icons */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[10px] text-blue-200">Works with</span>
            <div className="flex items-center gap-2">
              {[
                { name: "TikTok", icon: "M9 12a4 4 0 108 0 4 4 0 00-8 0zM12 2v10" },
                { name: "Instagram", icon: "M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zM16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" },
                { name: "YouTube", icon: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z" },
              ].map((p) => (
                <span key={p.name} className="text-[10px] text-white/80 bg-white/15 px-2 py-0.5 rounded-full font-medium">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-5 pb-6 space-y-5">
        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="h-5 bg-gray-100 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
            <div className="space-y-2 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3.5 bg-gray-100 animate-pulse rounded w-full" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {data && !loading && <RecipeCard data={data} />}

        {/* Trending section (show when no result) */}
        {!data && !loading && !error && (
          <>
            {/* More tools header */}
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              More tools
            </h3>

            {/* Smart Chef - compact row */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowSmartChef(!showSmartChef)}
                className="w-full px-5 py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">👨‍🍳</span>
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-700">Smart Chef</h3>
                    <p className="text-[10px] text-gray-400">Get personalized recipe suggestions</p>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showSmartChef ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSmartChef && (
                <>
                  {/* Suggestion chips */}
                  <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleAiSuggest(chip.query)}
                        disabled={aiLoading}
                        className="shrink-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl
                                   active:bg-blue-50 active:border-blue-200 transition-colors
                                   disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <span className="text-sm">{chip.emoji}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{chip.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom query input */}
                  <div className="px-5 pb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && aiQuery.trim() && handleAiSuggest(aiQuery.trim())}
                        placeholder="Ask anything... e.g. 'something spicy with chicken'"
                        className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                                   focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                   placeholder:text-gray-400 transition-all"
                        disabled={aiLoading}
                      />
                      <button
                        onClick={() => aiQuery.trim() && handleAiSuggest(aiQuery.trim())}
                        disabled={aiLoading || !aiQuery.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl text-sm
                                   active:opacity-80 transition-opacity disabled:opacity-30 shrink-0"
                      >
                        {aiLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* AI Loading */}
            {aiLoading && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Thinking of something tasty...</span>
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-3.5 bg-gray-100 animate-pulse rounded w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {aiError}
              </div>
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && !aiLoading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Suggestions
                  </h3>
                  <button
                    onClick={() => setSuggestions([])}
                    className="text-[10px] text-gray-300 active:text-gray-500"
                  >
                    Clear
                  </button>
                </div>
                {suggestions.map((s, i) => {
                  const badge = TYPE_BADGES[s.type] || TYPE_BADGES.new;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedSuggestion(s)}
                      className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm
                                 active:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{badge.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900">{s.dish}</p>
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{s.why}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] text-gray-400">
                              {s.ingredients.length} ingredients
                            </span>
                            <span className="text-[10px] text-gray-300">|</span>
                            <span className="text-[10px] text-gray-400">
                              {s.steps.length} steps
                            </span>
                            {s.missing_ingredients && s.missing_ingredients.length > 0 && (
                              <>
                                <span className="text-[10px] text-gray-300">|</span>
                                <span className="text-[10px] text-amber-500">
                                  Need {s.missing_ingredients.length} more
                                </span>
                              </>
                            )}
                          </div>
                          {s.missing_ingredients && s.missing_ingredients.length > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1.5 truncate">
                              Buy: {s.missing_ingredients.join(", ")}
                            </p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Leftover Mode */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowLeftover(!showLeftover)}
                className="w-full px-5 py-4 flex items-center justify-between active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🧊</span>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900">Leftover Mode</h3>
                    <p className="text-[10px] text-gray-400">What can I cook with what I have?</p>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showLeftover ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showLeftover && (
                <div className="px-5 pb-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fridgeInput}
                      onChange={(e) => setFridgeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLeftoverSearch()}
                      placeholder="chicken, rice, onion, garlic..."
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                 placeholder:text-gray-400 transition-all"
                      disabled={leftoverLoading}
                    />
                    <button
                      onClick={handleLeftoverSearch}
                      disabled={leftoverLoading || !fridgeInput.trim()}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl text-sm
                                 active:opacity-80 disabled:opacity-30 shrink-0"
                    >
                      {leftoverLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                      ) : (
                        "Find"
                      )}
                    </button>
                  </div>

                  {/* Results */}
                  {leftoverMatches.length > 0 && (
                    <div className="space-y-2">
                      {leftoverMatches.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedLeftover(m)}
                          className="w-full bg-gray-50 rounded-xl p-3 text-left active:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate flex-1">{m.dish}</p>
                            <span className={`text-xs font-bold shrink-0 ${
                              m.percent >= 80 ? "text-green-500" :
                              m.percent >= 50 ? "text-amber-500" : "text-red-500"
                            }`}>
                              {m.percent}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-green-500">
                              Have {m.have.length}
                            </span>
                            {m.need.length > 0 && (
                              <>
                                <span className="text-[10px] text-gray-300">|</span>
                                <span className="text-[10px] text-amber-500">
                                  Need {m.need.length}: {m.need.slice(0, 2).join(", ")}{m.need.length > 2 ? "..." : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {leftoverMatches.length === 0 && !leftoverLoading && fridgeInput.trim() && (
                    <p className="text-xs text-gray-400 text-center py-2">No matching recipes found. Save more recipes first!</p>
                  )}
                </div>
              )}
            </div>

            {/* Feature Carousel */}
            <FeatureCarousel />

            {/* Trending */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Trending categories
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TRENDING.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setSelectedDummy(item)}
                    className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm
                               active:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{item.tag}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                How it works
              </h3>
              <div className="space-y-2.5">
                {[
                  { n: "1", t: "Paste a TikTok, Instagram, or YouTube link" },
                  { n: "2", t: "We extract the recipe from description, blog, or audio" },
                  { n: "3", t: "Get ingredients, steps, and a shopping list" },
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {s.n}
                    </span>
                    <p className="text-sm text-gray-500">{s.t}</p>
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

      {/* AI suggestion detail overlay */}
      {selectedSuggestion && (
        <RecipeDetail
          dish={selectedSuggestion.dish}
          ingredients={selectedSuggestion.ingredients}
          steps={selectedSuggestion.steps}
          onClose={() => setSelectedSuggestion(null)}
        />
      )}

      {/* Leftover recipe detail */}
      {selectedLeftover && (
        <RecipeDetail
          dish={selectedLeftover.dish}
          ingredients={selectedLeftover.ingredients}
          steps={selectedLeftover.steps}
          onClose={() => setSelectedLeftover(null)}
        />
      )}

      {/* Snap Meal overlay */}
      {showSnapMeal && <SnapMeal onClose={() => setShowSnapMeal(false)} />}

      {/* Account slide-over */}
      {showAccount && (
        <div className="fixed inset-0 z-50 flex justify-center">
          <div className="w-full max-w-[480px] relative">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowAccount(false)} />
            <div className="absolute inset-y-0 right-0 w-[85%] max-w-[360px] bg-white shadow-2xl animate-slide-in-right flex flex-col">
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <h2 className="text-lg font-bold text-gray-900">Account</h2>
                <button
                  onClick={() => setShowAccount(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AccountTab />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
