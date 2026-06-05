"use client";

import { useState } from "react";
import ShoppingList from "./ShoppingList";
import { useAuth } from "./AuthProvider";

interface RecipeResult {
  is_recipe: boolean;
  dish: string;
  ingredients: string[];
  steps: string[];
  confidence: string;
  note?: string;
}

interface ExtractResponse {
  url: string;
  platform: string | null;
  caption: string;
  stage: "caption" | "blog" | "transcript" | "fallback";
  result: RecipeResult | null;
  message?: string;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  caption: { label: "From caption", color: "bg-green-500/15 text-green-400" },
  blog: { label: "From blog", color: "bg-blue-500/15 text-blue-400" },
  transcript: { label: "From audio", color: "bg-purple-500/15 text-purple-400" },
  fallback: { label: "Not found", color: "bg-white/5 text-[#55556a]" },
};

export default function RecipeCard({ data }: { data: ExtractResponse }) {
  const { user } = useAuth();
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const stageInfo = STAGE_LABELS[data.stage];
  const recipe = data.result;
  const isFallback = data.stage === "fallback";

  async function handleSave() {
    if (!recipe || !user || saved || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          source_url: data.url,
          platform: data.platform,
          dish: recipe.dish,
          stage: data.stage,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          confidence: recipe.confidence,
          note: recipe.note,
        }),
      });
      const json = await res.json();
      if (res.ok) setSaved(true);
      else if (res.status === 409) setSaved(true); // already saved
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    if (!recipe) return;
    let text = `${recipe.dish}\n\n`;
    text += `Ingredients:\n`;
    text += recipe.ingredients.map((i) => `- ${i}`).join("\n");
    if (recipe.steps.length > 0) {
      text += `\n\nSteps:\n`;
      text += recipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    }
    if (data.url) text += `\n\nSource: ${data.url}`;

    if (navigator.share) {
      navigator.share({ title: recipe.dish, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }
  }

  if (isFallback || !recipe) {
    return (
      <div className="bg-[#16161e] rounded-2xl border border-[#2a2a3a] p-5 space-y-3">
        <p className="text-sm text-[#8888a0]">
          {data.message || "No recipe could be extracted from this link."}
        </p>
        {data.caption && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-1">
              Caption
            </p>
            <p className="text-sm text-[#8888a0] whitespace-pre-wrap">{data.caption}</p>
          </div>
        )}
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-orange-500 font-medium"
        >
          Open original reel
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#16161e] rounded-2xl border border-[#2a2a3a] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-[#f0f0f5] leading-snug">
                {recipe.dish}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {stageInfo && (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${stageInfo.color}`}>
                    {stageInfo.label}
                  </span>
                )}
                {data.platform && (
                  <span className="text-[10px] text-[#55556a] capitalize">{data.platform}</span>
                )}
              </div>
            </div>
            {/* Save button (top right) */}
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className={`p-2 rounded-xl transition-colors ${
                saved
                  ? "bg-green-500/15 text-green-400"
                  : "bg-white/5 text-[#55556a] active:bg-orange-500/15 active:text-orange-500"
              }`}
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin block" />
              ) : saved ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Ingredients */}
        <div className="px-5 py-4 border-t border-[#2a2a3a]">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#c0c0d0]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <div className="px-5 py-4 border-t border-[#2a2a3a]">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
              Steps
            </h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#c0c0d0]">
                  <span className="text-orange-500 font-bold shrink-0 w-5 text-right">
                    {i + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#2a2a3a] flex gap-3">
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex-1 py-2.5 bg-orange-500/10 text-orange-500 font-medium rounded-xl text-sm
                       active:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Shopping List
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 bg-white/5 text-[#8888a0] font-medium rounded-xl text-sm
                       active:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {showShoppingList && (
        <ShoppingList
          ingredients={recipe.ingredients}
          dish={recipe.dish}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </>
  );
}
