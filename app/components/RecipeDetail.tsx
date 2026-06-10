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
  fallback: { label: "Fallback", color: "bg-gray-100 text-gray-500" },
};

const TAGS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍿" },
  { key: "dessert", label: "Dessert", emoji: "🍰" },
];

const SERVING_OPTIONS = [
  { label: "1", value: 0.5 },
  { label: "2", value: 1 },
  { label: "4", value: 2 },
  { label: "6", value: 3 },
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
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swaps, setSwaps] = useState<{ name: string; quantity: string; note: string }[]>([]);
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

  async function handleSwap(index: number) {
    if (swapIndex === index) { setSwapIndex(null); setSwaps([]); return; }
    setSwapIndex(index);
    setSwaps([]);
    setSwapLoading(true);
    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient: scaledIngredients[index], dish }),
      });
      const d = await res.json();
      if (d.swaps) setSwaps(d.swaps);
    } catch { /* silent */ }
    setSwapLoading(false);
  }

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
      <div className="fixed inset-0 z-50 bg-gray-50 flex justify-center">
      <div className="flex flex-col w-full max-w-[480px] bg-white safe-top safe-bottom
                      lg:border-x lg:border-gray-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <button onClick={onClose} className="p-1 -ml-1 text-gray-500 active:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate flex-1">{dish}</h1>
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
                <span className="text-[10px] text-gray-500 capitalize">{platform}</span>
              )}
              {onTagChange && (
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                    currentTag
                      ? "bg-blue-50 text-blue-500 border-blue-200"
                      : "bg-gray-50 text-gray-500 border-gray-200 active:bg-gray-100"
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
                        ? "bg-blue-50 text-blue-500 border-blue-200"
                        : "bg-white text-gray-500 border-gray-200 active:bg-gray-50"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Serving size adjuster */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Servings
                </h3>
                <div className="flex gap-1.5">
                  {SERVING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setServingMultiplier(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        servingMultiplier === opt.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-50 text-gray-500 active:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Ingredients
                </h3>
                <p className="text-[9px] text-gray-400">Tap for substitutes</p>
              </div>
              <ul className="space-y-1.5">
                {scaledIngredients.map((ing, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handleSwap(i)}
                      className={`w-full flex items-start gap-2.5 text-sm text-left rounded-xl px-2.5 py-2 -mx-2.5 transition-colors ${
                        swapIndex === i ? "bg-blue-50" : "active:bg-gray-50"
                      }`}
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className={swapIndex === i ? "text-blue-500" : "text-gray-700"}>{ing}</span>
                      {swapIndex === i && (
                        <svg className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      )}
                    </button>
                    {/* Swap suggestions */}
                    {swapIndex === i && (
                      <div className="ml-5 mt-1 mb-2 space-y-1.5">
                        {swapLoading ? (
                          <div className="flex items-center gap-2 py-2">
                            <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                            <span className="text-[11px] text-gray-500">Finding substitutes...</span>
                          </div>
                        ) : swaps.length > 0 ? (
                          swaps.map((s, si) => (
                            <div key={si} className="bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">🔄</span>
                                <span className="text-xs font-medium text-gray-900">{s.name}</span>
                              </div>
                              <p className="text-[10px] text-blue-500/70 mt-0.5">{s.quantity}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{s.note}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-gray-400 py-1">No substitutes found</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nutrition estimate */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              <button
                onClick={handleNutritionToggle}
                className="w-full px-5 py-4 flex items-center justify-between active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔥</span>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Nutrition estimate
                  </h3>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showNutrition ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showNutrition && (
                <div className="px-5 pb-4 space-y-3">
                  {nutritionLoading ? (
                    <div className="flex items-center gap-2 py-3">
                      <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-xs text-gray-500">Estimating nutrition...</span>
                    </div>
                  ) : nutrition ? (
                    <>
                      {/* Calories header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{Math.round(nutrition.calories * servingMultiplier)}</p>
                          <p className="text-[10px] text-gray-500">
                            calories per {nutrition.serving_size || "serving"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {(() => {
                              const opt = SERVING_OPTIONS.find((o) => o.value === servingMultiplier);
                              const count = opt ? Number(opt.label) : Math.round(nutrition.servings * servingMultiplier);
                              return `Makes ~${count} serving${count !== 1 ? "s" : ""}`;
                            })()}
                          </p>
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
                          <div key={m.key} className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <div className={`w-2 h-2 rounded-full ${MACRO_COLORS[m.key]} mx-auto mb-1.5`} />
                            <p className="text-sm font-semibold text-gray-900">
                              {Math.round(m.val * servingMultiplier * 10) / 10}{m.unit}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Disclaimer */}
                      <p className="text-[9px] text-gray-400 leading-relaxed">
                        {nutrition.note || "Estimates only. Actual values depend on exact brands, quantities, and preparation."}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 py-2">Could not estimate nutrition.</p>
                  )}
                </div>
              )}
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Steps
                </h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="text-blue-500 font-bold shrink-0 w-5 text-right">{i + 1}</span>
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
                className="inline-flex items-center gap-1 text-sm text-blue-500 font-medium"
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
        <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex-1 py-3 bg-blue-50 text-blue-500 font-medium rounded-xl text-sm
                       active:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Shopping List
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-gray-50 text-gray-500 font-medium rounded-xl text-sm
                       active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
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
