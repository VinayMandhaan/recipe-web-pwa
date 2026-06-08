"use client";

import { useState, useRef } from "react";
import { useAuth } from "./AuthProvider";

interface IdentifyResult {
  dish: string;
  ingredients: string[];
  confidence: string;
}

interface NutritionResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size: string;
  rating: "excellent" | "good" | "fair" | "poor";
  rating_reason: string;
  improvements: { tip: string; impact: string }[];
}

const RATING_STYLES: Record<string, { color: string; emoji: string }> = {
  excellent: { color: "text-green-400", emoji: "🟢" },
  good: { color: "text-emerald-400", emoji: "🟡" },
  fair: { color: "text-amber-400", emoji: "🟠" },
  poor: { color: "text-red-400", emoji: "🔴" },
};

const MACRO_COLORS: Record<string, string> = {
  protein: "bg-blue-500",
  carbs: "bg-amber-500",
  fat: "bg-red-400",
  fiber: "bg-green-500",
};

export default function SnapMeal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"capture" | "review" | "results">("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [identified, setIdentified] = useState<IdentifyResult | null>(null);
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [analyzingNutrition, setAnalyzingNutrition] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resize and convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImagePreview(dataUrl);
        identifyMeal(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function identifyMeal(dataUrl: string) {
    setIdentifying(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "identify", image: dataUrl }),
      });
      const d = await res.json();
      if (d.error) {
        setError(d.error);
        setStep("capture");
      } else {
        setIdentified(d);
        setEditIngredients([...(d.ingredients || [])]);

        // If a nutrition label was detected, skip to results directly
        const ln = d.label_nutrition;
        if (ln && (ln.calories || ln.protein_g)) {
          setNutrition({
            calories: ln.calories || 0,
            protein_g: ln.protein_g || 0,
            carbs_g: ln.carbs_g || 0,
            fat_g: ln.fat_g || 0,
            fiber_g: ln.fiber_g || 0,
            serving_size: ln.serving_size || "1 serving",
            rating: ln.calories < 500 && ln.protein_g > 15 ? "good" : ln.protein_g > 25 ? "excellent" : "fair",
            rating_reason: "Values read directly from nutrition label",
            improvements: [],
          });
          setStep("results");
        } else {
          setStep("review");
        }
      }
    } catch {
      setError("Could not analyze the photo. Try again.");
      setStep("capture");
    } finally {
      setIdentifying(false);
    }
  }

  function addIngredient() {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    setEditIngredients((prev) => [...prev, trimmed]);
    setNewIngredient("");
  }

  function removeIngredient(index: number) {
    setEditIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function confirmAndAnalyze() {
    if (editIngredients.length === 0) return;
    setAnalyzingNutrition(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "nutrition",
          ingredients: editIngredients,
          dish: identified?.dish || "Unknown dish",
          user_id: user?.id || null,
        }),
      });
      const d = await res.json();
      if (d.error) {
        setError(d.error);
      } else {
        setNutrition(d);
        setStep("results");
      }
    } catch {
      setError("Could not estimate nutrition. Try again.");
    } finally {
      setAnalyzingNutrition(false);
    }
  }

  async function handleSave() {
    if (!user || !identified || saved || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          source_url: null,
          platform: "snap",
          dish: identified.dish,
          stage: "snap",
          ingredients: editIngredients,
          steps: [],
          confidence: identified.confidence || "medium",
          note: nutrition
            ? `${Math.round(nutrition.calories)} cal | ${nutrition.protein_g}g protein | ${nutrition.carbs_g}g carbs | ${nutrition.fat_g}g fat`
            : "Scanned via Snap Meal",
        }),
      });
      if (res.ok || res.status === 409) setSaved(true);
    } catch { /* silent */ }
    setSaving(false);
  }

  function resetAll() {
    setStep("capture");
    setImagePreview(null);
    setIdentified(null);
    setEditIngredients([]);
    setNutrition(null);
    setError(null);
    setSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
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
        <h1 className="text-lg font-semibold text-[#f0f0f5]">Snap Meal</h1>
        {step !== "capture" && (
          <button
            onClick={resetAll}
            className="ml-auto text-xs text-orange-500 active:text-orange-400 font-medium"
          >
            New photo
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-5 py-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Capture */}
          {step === "capture" && !identifying && (
            <div className="space-y-5">
              <div className="text-center pt-8 pb-4">
                <div className="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📸</span>
                </div>
                <h2 className="text-xl font-bold text-[#f0f0f5]">Snap your meal</h2>
                <p className="text-sm text-[#55556a] mt-2 max-w-[260px] mx-auto">
                  Take a photo or upload one and get instant nutrition analysis
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (fileRef.current) {
                      fileRef.current.setAttribute("capture", "environment");
                      fileRef.current.click();
                    }
                  }}
                  className="py-8 bg-[#16161e] border border-[#2a2a3a] rounded-2xl
                             active:bg-[#1e1e2a] transition-colors flex flex-col items-center gap-3"
                >
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-[#c0c0d0]">Take photo</span>
                </button>

                <button
                  onClick={() => {
                    if (fileRef.current) {
                      fileRef.current.removeAttribute("capture");
                      fileRef.current.click();
                    }
                  }}
                  className="py-8 bg-[#16161e] border border-[#2a2a3a] rounded-2xl
                             active:bg-[#1e1e2a] transition-colors flex flex-col items-center gap-3"
                >
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-[#c0c0d0]">Upload</span>
                </button>
              </div>
            </div>
          )}

          {/* Identifying spinner */}
          {identifying && (
            <div className="space-y-5 pt-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Meal"
                  className="w-full aspect-[4/3] object-cover rounded-2xl border border-[#2a2a3a]"
                />
              )}
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  <span className="text-sm text-[#55556a]">Analyzing your meal...</span>
                </div>
                <div className="space-y-2 mt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-3.5 shimmer rounded w-full" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review ingredients */}
          {step === "review" && !identifying && (
            <div className="space-y-5">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Meal"
                  className="w-full aspect-[4/3] object-cover rounded-2xl border border-[#2a2a3a]"
                />
              )}

              {/* Dish name */}
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a]">
                      Identified as
                    </p>
                    <p className="text-lg font-bold text-[#f0f0f5] mt-1">
                      {identified?.dish || "Unknown dish"}
                    </p>
                  </div>
                  {identified?.confidence && (
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      identified.confidence === "high"
                        ? "bg-green-500/15 text-green-400"
                        : identified.confidence === "medium"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                    }`}>
                      {identified.confidence}
                    </span>
                  )}
                </div>
              </div>

              {/* Editable ingredients */}
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a]">
                    Ingredients ({editIngredients.length})
                  </h3>
                  <p className="text-[10px] text-[#3a3a4a]">Tap X to remove, add below</p>
                </div>

                <div className="space-y-2">
                  {editIngredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 bg-[#0a0a0f] rounded-xl px-3 py-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span className="flex-1 text-sm text-[#c0c0d0]">{ing}</span>
                      <button
                        onClick={() => removeIngredient(i)}
                        className="p-0.5 text-[#3a3a4a] active:text-red-400 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add ingredient */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                    placeholder="Add ingredient..."
                    className="flex-1 px-3 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                               focus:outline-none focus:ring-1 focus:ring-orange-500/50
                               placeholder:text-[#3a3a4a]"
                  />
                  <button
                    onClick={addIngredient}
                    disabled={!newIngredient.trim()}
                    className="px-4 py-2.5 gradient-accent text-white font-medium rounded-xl text-sm
                               active:opacity-80 disabled:opacity-30 shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Nutrition results */}
          {step === "results" && nutrition && (
            <div className="space-y-5">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Meal"
                  className="w-full aspect-[4/3] object-cover rounded-2xl border border-[#2a2a3a]"
                />
              )}

              {/* Dish + Rating */}
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-4">
                <p className="text-lg font-bold text-[#f0f0f5]">{identified?.dish}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">
                    {RATING_STYLES[nutrition.rating]?.emoji || "🟡"}
                  </span>
                  <span className={`text-sm font-semibold capitalize ${RATING_STYLES[nutrition.rating]?.color || "text-[#55556a]"}`}>
                    {nutrition.rating}
                  </span>
                  <span className="text-xs text-[#55556a]">{nutrition.rating_reason}</span>
                </div>
              </div>

              {/* Calories */}
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5 text-center">
                <p className="text-4xl font-bold text-[#f0f0f5]">{Math.round(nutrition.calories)}</p>
                <p className="text-xs text-[#55556a] mt-1">
                  calories per {nutrition.serving_size || "serving"}
                </p>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "protein", label: "Protein", val: nutrition.protein_g, unit: "g" },
                  { key: "carbs", label: "Carbs", val: nutrition.carbs_g, unit: "g" },
                  { key: "fat", label: "Fat", val: nutrition.fat_g, unit: "g" },
                  { key: "fiber", label: "Fiber", val: nutrition.fiber_g, unit: "g" },
                ].map((m) => (
                  <div key={m.key} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-3 text-center">
                    <div className={`w-2 h-2 rounded-full ${MACRO_COLORS[m.key]} mx-auto mb-2`} />
                    <p className="text-base font-semibold text-[#f0f0f5]">
                      {Math.round(m.val * 10) / 10}{m.unit}
                    </p>
                    <p className="text-[9px] text-[#55556a] mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Editable ingredients */}
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a]">
                    Ingredients ({editIngredients.length})
                  </h3>
                  <p className="text-[10px] text-[#3a3a4a]">Tap X to remove</p>
                </div>
                <div className="space-y-2">
                  {editIngredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 bg-[#0a0a0f] rounded-xl px-3 py-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span className="flex-1 text-sm text-[#c0c0d0]">{ing}</span>
                      <button
                        onClick={() => { removeIngredient(i); setSaved(false); }}
                        className="p-0.5 text-[#3a3a4a] active:text-red-400 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add ingredient */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                    placeholder="Add ingredient..."
                    className="flex-1 px-3 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                               focus:outline-none focus:ring-1 focus:ring-orange-500/50
                               placeholder:text-[#3a3a4a]"
                  />
                  <button
                    onClick={() => { addIngredient(); setSaved(false); }}
                    disabled={!newIngredient.trim()}
                    className="px-4 py-2.5 gradient-accent text-white font-medium rounded-xl text-sm
                               active:opacity-80 disabled:opacity-30 shrink-0"
                  >
                    Add
                  </button>
                </div>
                {/* Recalculate button */}
                <button
                  onClick={() => { setSaved(false); confirmAndAnalyze(); }}
                  disabled={analyzingNutrition || editIngredients.length === 0}
                  className="w-full mt-3 py-2.5 bg-orange-500/10 text-orange-500 font-medium rounded-xl text-xs
                             active:bg-orange-500/20 transition-colors disabled:opacity-30
                             flex items-center justify-center gap-1.5"
                >
                  {analyzingNutrition ? (
                    <span className="w-3.5 h-3.5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Recalculate nutrition
                </button>
              </div>

              {/* Improvement tips */}
              {nutrition.improvements && nutrition.improvements.length > 0 && (
                <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
                    💡 How to improve this meal
                  </h3>
                  <div className="space-y-3">
                    {nutrition.improvements.map((imp, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-orange-500 font-bold shrink-0 w-5 text-right text-sm">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-[#c0c0d0]">{imp.tip}</p>
                          <p className="text-[10px] text-green-400/70 mt-0.5">{imp.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action */}
      {step === "review" && !identifying && (
        <div className="px-5 py-4 border-t border-[#2a2a3a]">
          <button
            onClick={confirmAndAnalyze}
            disabled={editIngredients.length === 0 || analyzingNutrition}
            className="w-full py-3.5 gradient-accent text-white font-semibold rounded-xl text-sm
                       active:opacity-80 transition-opacity disabled:opacity-30
                       flex items-center justify-center gap-2"
          >
            {analyzingNutrition ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing nutrition...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm & Get Nutrition
              </>
            )}
          </button>
        </div>
      )}

      {step === "results" && (
        <div className="px-5 py-4 border-t border-[#2a2a3a] space-y-2">
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className={`w-full py-3 font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors ${
              saved
                ? "bg-green-500/15 text-green-400"
                : "gradient-accent text-white active:opacity-80"
            } ${saving ? "opacity-50" : ""}`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                Saved to Recipes
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save to My Recipes
              </>
            )}
          </button>
          {/* Secondary action */}
          <button
            onClick={resetAll}
            className="w-full py-3 bg-white/5 text-[#8888a0] font-medium rounded-xl text-sm
                       active:bg-white/10 transition-colors"
          >
            Snap another
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
