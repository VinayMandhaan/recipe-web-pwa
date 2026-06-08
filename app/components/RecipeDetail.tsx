"use client";

import { useState, useCallback } from "react";
import ShoppingList from "./ShoppingList";

interface RecipeDetailProps {
  dish: string;
  ingredients: string[];
  steps: string[];
  stage?: string;
  platform?: string;
  source_url?: string;
  confidence?: string;
  tag?: string;
  onClose: () => void;
  onDelete?: () => void;
  onTagChange?: (tag: string | null) => void;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  caption: { label: "From caption", color: "bg-green-500/15 text-green-400" },
  blog: { label: "From blog", color: "bg-blue-500/15 text-blue-400" },
  transcript: { label: "From audio", color: "bg-purple-500/15 text-purple-400" },
  fallback: { label: "Fallback", color: "bg-white/5 text-[#55556a]" },
};

const TAGS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍿" },
  { key: "dessert", label: "Dessert", emoji: "🍰" },
];

const SERVING_OPTIONS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
];

interface NutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  servings: number;
  serving_size: string;
  note: string;
}

const MACRO_COLORS: Record<string, string> = {
  protein: "bg-blue-500",
  carbs: "bg-amber-500",
  fat: "bg-red-400",
  fiber: "bg-green-500",
};

function scaleIngredient(ing: string, multiplier: number): string {
  if (multiplier === 1) return ing;
  // Match numbers (including fractions and decimals) at the start or after spaces
  return ing.replace(/(\d+\.?\d*\/?\d*)/g, (match) => {
    if (match.includes("/")) {
      const [num, den] = match.split("/");
      const val = (parseFloat(num) / parseFloat(den)) * multiplier;
      // Keep as fraction if result is clean
      if (val % 1 === 0) return String(val);
      if (val % 0.5 === 0) return val < 1 ? `1/${Math.round(1 / val)}` : String(val);
      return val.toFixed(1).replace(/\.0$/, "");
    }
    const val = parseFloat(match) * multiplier;
    if (val % 1 === 0) return String(val);
    return val.toFixed(1).replace(/\.0$/, "");
  });
}

export default function RecipeDetail({
  dish, ingredients, steps, stage, platform, source_url, tag, onClose, onDelete, onTagChange,
}: RecipeDetailProps) {
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const stageInfo = stage ? STAGE_LABELS[stage] : null;
  const currentTag = TAGS.find((t) => t.key === tag);

  const scaledIngredients = ingredients.map((i) => scaleIngredient(i, servingMultiplier));

  const fetchNutrition = useCallback(async () => {
    if (nutrition || nutritionLoading) return;
    setNutritionLoading(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, dish }),
      });
      const d = await res.json();
      if (d.nutrition) setNutrition(d.nutrition);
    } catch { /* silent */ }
    setNutritionLoading(false);
  }, [ingredients, dish, nutrition, nutritionLoading]);

  function handleNutritionToggle() {
    setShowNutrition(!showNutrition);
    if (!nutrition && !nutritionLoading) fetchNutrition();
  }

  function handleShare() {
    let text = `${dish}\n\n`;
    text += `Ingredients:\n`;
    text += scaledIngredients.map((i) => `- ${i}`).join("\n");
    if (steps.length > 0) {
      text += `\n\nSteps:\n`;
      text += steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    }
    if (source_url) text += `\n\nSource: ${source_url}`;

    if (navigator.share) {
      navigator.share({ title: dish, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#06060a] flex justify-center">
      <div className="flex flex-col w-full max-w-[480px] bg-[#0a0a0f] safe-top safe-bottom
                      lg:border-x lg:border-[#2a2a3a]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a3a]">
          <button onClick={onClose} className="p-1 -ml-1 text-[#8888a0] active:text-[#f0f0f5]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-[#f0f0f5] truncate flex-1">{dish}</h1>
          {onDelete && (
            <button onClick={onDelete} className="p-1 text-red-400/60 active:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 py-5 space-y-5">
            {/* Badges + Tag */}
            <div className="flex items-center gap-2 flex-wrap">
              {stageInfo && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
              )}
              {platform && (
                <span className="text-[10px] text-[#55556a] capitalize">{platform}</span>
              )}
              {onTagChange && (
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                    currentTag
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      : "bg-white/5 text-[#55556a] border-[#2a2a3a] active:bg-white/10"
                  }`}
                >
                  {currentTag ? `${currentTag.emoji} ${currentTag.label}` : "+ Tag"}
                </button>
              )}
            </div>

            {/* Tag picker */}
            {showTagPicker && onTagChange && (
              <div className="flex gap-2 flex-wrap">
                {TAGS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      onTagChange(tag === t.key ? null : t.key);
                      setShowTagPicker(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      tag === t.key
                        ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                        : "bg-[#16161e] text-[#55556a] border-[#2a2a3a] active:bg-[#1e1e2a]"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Serving size adjuster */}
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a]">
                  Serving size
                </h3>
                <div className="flex gap-1.5">
                  {SERVING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setServingMultiplier(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        servingMultiplier === opt.value
                          ? "bg-orange-500 text-white"
                          : "bg-white/5 text-[#55556a] active:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
                Ingredients {servingMultiplier !== 1 && `(${servingMultiplier}x)`}
              </h3>
              <ul className="space-y-2">
                {scaledIngredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#c0c0d0]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nutrition estimate */}
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl overflow-hidden">
              <button
                onClick={handleNutritionToggle}
                className="w-full px-5 py-4 flex items-center justify-between active:bg-[#1e1e2a] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔥</span>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a]">
                    Nutrition estimate
                  </h3>
                </div>
                <svg
                  className={`w-4 h-4 text-[#55556a] transition-transform ${showNutrition ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showNutrition && (
                <div className="px-5 pb-4 space-y-3">
                  {nutritionLoading ? (
                    <div className="flex items-center gap-2 py-3">
                      <span className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      <span className="text-xs text-[#55556a]">Estimating nutrition...</span>
                    </div>
                  ) : nutrition ? (
                    <>
                      {/* Calories header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-[#f0f0f5]">{Math.round(nutrition.calories * servingMultiplier)}</p>
                          <p className="text-[10px] text-[#55556a]">
                            calories per {nutrition.serving_size || "serving"}
                            {servingMultiplier !== 1 ? ` (${servingMultiplier}x)` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#55556a]">Makes ~{nutrition.servings} serving{nutrition.servings !== 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      {/* Macro bars */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: "protein", label: "Protein", val: nutrition.protein_g, unit: "g" },
                          { key: "carbs", label: "Carbs", val: nutrition.carbs_g, unit: "g" },
                          { key: "fat", label: "Fat", val: nutrition.fat_g, unit: "g" },
                          { key: "fiber", label: "Fiber", val: nutrition.fiber_g, unit: "g" },
                        ].map((m) => (
                          <div key={m.key} className="bg-[#0a0a0f] rounded-xl p-2.5 text-center">
                            <div className={`w-2 h-2 rounded-full ${MACRO_COLORS[m.key]} mx-auto mb-1.5`} />
                            <p className="text-sm font-semibold text-[#f0f0f5]">
                              {Math.round(m.val * servingMultiplier * 10) / 10}{m.unit}
                            </p>
                            <p className="text-[9px] text-[#55556a] mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Disclaimer */}
                      <p className="text-[9px] text-[#3a3a4a] leading-relaxed">
                        {nutrition.note || "Estimates only. Actual values depend on exact brands, quantities, and preparation."}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-[#55556a] py-2">Could not estimate nutrition.</p>
                  )}
                </div>
              )}
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
                  Steps
                </h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#c0c0d0]">
                      <span className="text-orange-500 font-bold shrink-0 w-5 text-right">{i + 1}</span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Source link */}
            {source_url && (
              <a
                href={source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-orange-500 font-medium"
              >
                Open original reel
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-5 py-4 border-t border-[#2a2a3a] flex gap-3">
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex-1 py-3 bg-orange-500/10 text-orange-500 font-medium rounded-xl text-sm
                       active:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Shopping List
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-white/5 text-[#8888a0] font-medium rounded-xl text-sm
                       active:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
      </div>

      {showShoppingList && (
        <ShoppingList
          ingredients={scaledIngredients}
          dish={dish}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </>
  );
}
