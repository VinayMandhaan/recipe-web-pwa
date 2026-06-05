"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import RecipeDetail from "./RecipeDetail";

interface SavedRecipe {
  id: string;
  dish: string;
  ingredients: string[];
  steps: string[];
  stage: string | null;
  platform: string | null;
  source_url: string | null;
  confidence: string | null;
  saved_at: string;
}

export default function RecipesTab() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedRecipe | null>(null);

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

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-[#f0f0f5]">My Recipes</h1>
          <p className="text-sm text-[#55556a] mt-1">
            {recipes.length > 0 ? `${recipes.length} saved` : "Your saved recipe collection"}
          </p>
        </div>

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
        ) : (
          <div className="px-5 pb-6 space-y-3">
            {recipes.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4
                           active:bg-[#1e1e2a] transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f0f0f5] truncate">{r.dish}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#55556a]">
                        {r.ingredients.length} ingredients
                      </span>
                      <span className="text-[10px] text-[#3a3a4a]">|</span>
                      <span className="text-[10px] text-[#55556a]">
                        {r.steps.length} steps
                      </span>
                      {r.platform && (
                        <>
                          <span className="text-[10px] text-[#3a3a4a]">|</span>
                          <span className="text-[10px] text-[#55556a] capitalize">{r.platform}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-[#3a3a4a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
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
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}
    </>
  );
}
