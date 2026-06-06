"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import RecipeDetail from "./RecipeDetail";
import ShoppingList from "./ShoppingList";

interface SavedRecipe {
  id: string;
  dish: string;
  ingredients: string[];
  steps: string[];
  stage: string | null;
  platform: string | null;
  source_url: string | null;
  confidence: string | null;
  tag: string | null;
  saved_at: string;
}

const TAGS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍿" },
  { key: "dessert", label: "Dessert", emoji: "🍰" },
];

const TAG_COLORS: Record<string, string> = {
  breakfast: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  lunch: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  dinner: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  snack: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  dessert: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

export default function RecipesTab() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedRecipe | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showCombinedList, setShowCombinedList] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/recipes?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setRecipes(d.recipes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleDelete(id: string) {
    if (!user) return;
    await fetch("/api/recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, user_id: user.id }),
    });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
  }

  async function handleTagChange(id: string, tag: string | null) {
    if (!user) return;
    await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, user_id: user.id, tag }),
    });
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, tag } : r))
    );
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, tag } : null);
    }
  }

  // Filter recipes
  const filtered = recipes.filter((r) => {
    const matchesSearch =
      !search ||
      r.dish.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients.some((ing) => ing.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !activeTag || r.tag === activeTag;
    return matchesSearch && matchesTag;
  });

  // Combine ingredients from all filtered recipes
  const combinedIngredients = filtered.flatMap((r) => r.ingredients);

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-5 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#f0f0f5]">My Recipes</h1>
              <p className="text-sm text-[#55556a] mt-1">
                {recipes.length > 0 ? `${recipes.length} saved` : "Your saved recipe collection"}
              </p>
            </div>
            {filtered.length >= 2 && (
              <button
                onClick={() => setShowCombinedList(true)}
                className="px-3 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-xs font-medium
                           active:bg-orange-500/20 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Combine
              </button>
            )}
          </div>
        </div>

        {recipes.length > 0 && (
          <>
            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55556a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by dish or ingredient..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#16161e] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                             focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50
                             placeholder:text-[#3a3a4a]"
                />
              </div>
            </div>

            {/* Tag filters */}
            <div className="px-5 pb-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors border ${
                    !activeTag
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                      : "bg-[#16161e] text-[#55556a] border-[#2a2a3a] active:bg-[#1e1e2a]"
                  }`}
                >
                  All
                </button>
                {TAGS.map((t) => {
                  const count = recipes.filter((r) => r.tag === t.key).length;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActiveTag(activeTag === t.key ? null : t.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors border ${
                        activeTag === t.key
                          ? TAG_COLORS[t.key]
                          : "bg-[#16161e] text-[#55556a] border-[#2a2a3a] active:bg-[#1e1e2a]"
                      }`}
                    >
                      {t.emoji} {t.label}{count > 0 ? ` (${count})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {loading ? (
          <div className="px-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-2">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 pt-20">
            <div className="w-16 h-16 rounded-2xl bg-[#16161e] border border-[#2a2a3a] flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#3a3a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-sm text-[#55556a]">No saved recipes yet</p>
            <p className="text-xs text-[#3a3a4a] mt-1">
              Extract a recipe and tap the bookmark icon to save
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 pt-12">
            <p className="text-sm text-[#55556a]">No matches found</p>
            <p className="text-xs text-[#3a3a4a] mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="px-5 pb-6 space-y-3">
            {filtered.map((r) => {
              const tagInfo = TAGS.find((t) => t.key === r.tag);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4
                             active:bg-[#1e1e2a] transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f0f0f5] truncate">{r.dish}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {tagInfo && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TAG_COLORS[r.tag!]}`}>
                            {tagInfo.emoji} {tagInfo.label}
                          </span>
                        )}
                        <span className="text-[10px] text-[#55556a]">
                          {r.ingredients.length} ingredients
                        </span>
                        <span className="text-[10px] text-[#3a3a4a]">|</span>
                        <span className="text-[10px] text-[#55556a]">
                          {r.steps.length} steps
                        </span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[#3a3a4a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <RecipeDetail
          dish={selected.dish}
          ingredients={selected.ingredients}
          steps={selected.steps}
          stage={selected.stage || undefined}
          platform={selected.platform || undefined}
          source_url={selected.source_url || undefined}
          confidence={selected.confidence || undefined}
          tag={selected.tag || undefined}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          onTagChange={(tag) => handleTagChange(selected.id, tag)}
        />
      )}

      {showCombinedList && (
        <ShoppingList
          ingredients={combinedIngredients}
          dish={`${filtered.length} recipes combined`}
          onClose={() => setShowCombinedList(false)}
        />
      )}
    </>
  );
}
