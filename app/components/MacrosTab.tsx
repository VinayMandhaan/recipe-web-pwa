"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthProvider";
import {
  calculateMacros,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type Gender,
  type ActivityLevel,
  type Goal,
  type MacroTargets,
} from "@/lib/macros";

interface Profile {
  id?: string;
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

interface MealLog {
  id: string;
  meal_type: string;
  dish_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍿" },
];

// ── Circular progress ring ──
function Ring({
  value,
  max,
  size = 120,
  stroke = 10,
  color,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e1e2a"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Macro progress bar ──
function MacroBar({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const remaining = Math.max(0, max - value);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#55556a] uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-[#55556a]">{remaining}g left</span>
      </div>
      <div className="h-2 bg-[#1e1e2a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-[#c0c0d0] mt-1 font-medium">
        {value}{unit} <span className="text-[#3a3a4a]">/ {max}{unit}</span>
      </p>
    </div>
  );
}

// ── Setup screen ──
function ProfileSetup({
  initial,
  onSave,
  saving,
}: {
  initial?: Profile | null;
  onSave: (p: Profile) => void;
  saving: boolean;
}) {
  const [gender, setGender] = useState<Gender>(initial?.gender || "male");
  const [age, setAge] = useState(initial?.age?.toString() || "");
  const [height, setHeight] = useState(initial?.height_cm?.toString() || "");
  const [weight, setWeight] = useState(initial?.weight_kg?.toString() || "");
  const [activity, setActivity] = useState<ActivityLevel>(initial?.activity_level || "active");
  const [goal, setGoal] = useState<Goal>(initial?.goal || "maintain");
  const [step, setStep] = useState<"form" | "review">("form");
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [editingTargets, setEditingTargets] = useState(false);
  const [customCal, setCustomCal] = useState("");
  const [customPro, setCustomPro] = useState("");
  const [customCarb, setCustomCarb] = useState("");
  const [customFat, setCustomFat] = useState("");

  function handleCalculate() {
    if (!age || !height || !weight) return;
    const profile = {
      gender,
      age: Number(age),
      height_cm: Number(height),
      weight_kg: Number(weight),
      activity_level: activity,
      goal,
    };
    const calc = calculateMacros(profile);
    setTargets(calc);
    setCustomCal(calc.calories.toString());
    setCustomPro(calc.protein.toString());
    setCustomCarb(calc.carbs.toString());
    setCustomFat(calc.fat.toString());
    setStep("review");
  }

  function handleConfirm() {
    const finalTargets = editingTargets
      ? {
          calories: Number(customCal) || targets!.calories,
          protein: Number(customPro) || targets!.protein,
          carbs: Number(customCarb) || targets!.carbs,
          fat: Number(customFat) || targets!.fat,
        }
      : targets!;

    onSave({
      gender,
      age: Number(age),
      height_cm: Number(height),
      weight_kg: Number(weight),
      activity_level: activity,
      goal,
      target_calories: finalTargets.calories,
      target_protein: finalTargets.protein,
      target_carbs: finalTargets.carbs,
      target_fat: finalTargets.fat,
    });
  }

  const inputCls =
    "w-full px-3 py-2.5 bg-[#16161e] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5] focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 placeholder:text-[#3a3a4a]";

  if (step === "review" && targets) {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-5 pt-6 pb-4">
          <button onClick={() => setStep("form")} className="text-orange-500 text-sm mb-4 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Your Daily Targets</h1>
          <p className="text-sm text-[#55556a] mt-1">
            Based on {GOAL_LABELS[goal].toLowerCase()} goal with {ACTIVITY_LABELS[activity].toLowerCase().split("(")[0].trim()} lifestyle
          </p>
        </div>

        <div className="px-5 space-y-3">
          {/* Suggested targets */}
          <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
            <div className="flex items-center justify-center mb-5">
              <Ring value={targets.calories} max={targets.calories} size={130} stroke={12} color="#f97316">
                <span className="text-2xl font-bold text-[#f0f0f5]">{editingTargets ? Number(customCal) || targets.calories : targets.calories}</span>
                <span className="text-[10px] text-[#55556a]">kcal/day</span>
              </Ring>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Protein", val: editingTargets ? customPro : targets.protein.toString(), color: "#f97316", unit: "g" },
                { label: "Carbs", val: editingTargets ? customCarb : targets.carbs.toString(), color: "#3b82f6", unit: "g" },
                { label: "Fat", val: editingTargets ? customFat : targets.fat.toString(), color: "#a855f7", unit: "g" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: m.color }} />
                  <p className="text-lg font-bold text-[#f0f0f5]">{m.val}{m.unit}</p>
                  <p className="text-[10px] text-[#55556a]">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customize toggle */}
          {!editingTargets ? (
            <button
              onClick={() => setEditingTargets(true)}
              className="w-full py-3 text-sm text-orange-500 bg-orange-500/5 border border-orange-500/20 rounded-xl
                         active:bg-orange-500/10 transition-colors"
            >
              Customize targets
            </button>
          ) : (
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-3">
              <p className="text-xs text-[#55556a] font-medium">Set your own targets</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#3a3a4a] mb-1 block">Calories (kcal)</label>
                  <input type="number" value={customCal} onChange={(e) => setCustomCal(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-[#3a3a4a] mb-1 block">Protein (g)</label>
                  <input type="number" value={customPro} onChange={(e) => setCustomPro(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-[#3a3a4a] mb-1 block">Carbs (g)</label>
                  <input type="number" value={customCarb} onChange={(e) => setCustomCarb(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-[#3a3a4a] mb-1 block">Fat (g)</label>
                  <input type="number" value={customFat} onChange={(e) => setCustomFat(e.target.value)} className={inputCls} />
                </div>
              </div>
              <button
                onClick={() => setEditingTargets(false)}
                className="text-xs text-[#55556a] underline"
              >
                Reset to suggested
              </button>
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl
                       active:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Start tracking"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Set Up Your Macros</h1>
        <p className="text-sm text-[#55556a] mt-1">
          Tell us about yourself so we can calculate your daily targets
        </p>
      </div>

      <div className="px-5 space-y-4 pb-8">
        {/* Gender */}
        <div>
          <label className="text-xs text-[#55556a] font-medium mb-2 block">Gender</label>
          <div className="flex gap-2">
            {(["male", "female"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  gender === g
                    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                    : "bg-[#16161e] text-[#55556a] border-[#2a2a3a] active:bg-[#1e1e2a]"
                }`}
              >
                {g === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="text-xs text-[#55556a] font-medium mb-2 block">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            className={inputCls}
          />
        </div>

        {/* Height */}
        <div>
          <label className="text-xs text-[#55556a] font-medium mb-2 block">Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            className={inputCls}
          />
          {height && (
            <p className="text-[10px] text-[#3a3a4a] mt-1">
              {Math.floor(Number(height) / 30.48)}'{Math.round((Number(height) % 30.48) / 2.54)}"
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs text-[#55556a] font-medium mb-2 block">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className={inputCls}
          />
          {weight && (
            <p className="text-[10px] text-[#3a3a4a] mt-1">
              {Math.round(Number(weight) * 2.205)} lbs
            </p>
          )}
        </div>

        {/* Activity level */}
        <div>
          <label className="text-xs text-[#55556a] font-medium mb-2 block">Activity level</label>
          <div className="space-y-2">
            {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActivity(key)}
                className={`w-full px-4 py-3 rounded-xl text-left text-sm border transition-colors ${
                  activity === key
                    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                    : "bg-[#16161e] text-[#55556a] border-[#2a2a3a] active:bg-[#1e1e2a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="text-xs text-[#55556a] font-medium mb-2 block">Goal</label>
          <div className="flex gap-2">
            {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setGoal(key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  goal === key
                    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                    : "bg-[#16161e] text-[#55556a] border-[#2a2a3a] active:bg-[#1e1e2a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculate */}
        <button
          onClick={handleCalculate}
          disabled={!age || !height || !weight}
          className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl
                     active:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          Calculate my macros
        </button>
      </div>
    </div>
  );
}

// ── Add meal modal with photo scan ──
function AddMealModal({
  mealType,
  onClose,
  onAdd,
  adding,
}: {
  mealType: string;
  onClose: () => void;
  onAdd: (meal: { dish_name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  adding: boolean;
}) {
  const [mode, setMode] = useState<"choose" | "manual" | "photo">("choose");
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [pro, setPro] = useState("");
  const [carb, setCarb] = useState("");
  const [fat, setFat] = useState("");

  // Photo scan state
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const inputCls =
    "w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5] focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-[#3a3a4a]";

  const mealInfo = MEAL_TYPES.find((m) => m.key === mealType);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
          else { w = Math.round((w * maxSize) / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImagePreview(dataUrl);
        runScan(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function runScan(dataUrl: string) {
    setScanning(true);
    setScanError(null);
    try {
      // Step 1: Identify dish + ingredients
      const idRes = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "identify", image: dataUrl }),
      });
      const idData = await idRes.json();
      if (idData.error) { setScanError(idData.error); setScanning(false); return; }

      // Step 2: Get nutrition
      const nutRes = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "nutrition",
          ingredients: idData.ingredients || [],
          dish: idData.dish || "Unknown dish",
        }),
      });
      const nutData = await nutRes.json();
      if (nutData.error) { setScanError(nutData.error); setScanning(false); return; }

      // Auto-fill the form
      setName(idData.dish || "");
      setCal(Math.round(nutData.calories || 0).toString());
      setPro(Math.round(nutData.protein_g || 0).toString());
      setCarb(Math.round(nutData.carbs_g || 0).toString());
      setFat(Math.round(nutData.fat_g || 0).toString());
      setMode("manual"); // switch to form view so user can review/edit
    } catch {
      setScanError("Could not analyze the photo. Try again.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-[#16161e] rounded-t-2xl border-t border-[#2a2a3a] p-5 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="w-10 h-1 bg-[#2a2a3a] rounded-full mx-auto mb-4" />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Mode: Choose */}
        {mode === "choose" && !scanning && (
          <>
            <h2 className="text-lg font-bold text-[#f0f0f5] mb-1">
              {mealInfo?.emoji} Add to {mealInfo?.label}
            </h2>
            <p className="text-xs text-[#3a3a4a] mb-5">How would you like to log this meal?</p>

            <div className="space-y-3">
              {/* Photo scan option */}
              <button
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
                    fileRef.current.click();
                  }
                }}
                className="w-full flex items-center gap-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl
                           active:bg-orange-500/10 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-400">Take a photo</p>
                  <p className="text-[10px] text-[#55556a] mt-0.5">AI scans your meal and fills macros automatically</p>
                </div>
              </button>

              {/* Upload option */}
              <button
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.removeAttribute("capture");
                    fileRef.current.click();
                  }
                }}
                className="w-full flex items-center gap-4 p-4 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl
                           active:bg-[#1e1e2a] transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[#16161e] border border-[#2a2a3a] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-[#55556a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#c0c0d0]">Upload photo</p>
                  <p className="text-[10px] text-[#55556a] mt-0.5">Pick from gallery for AI analysis</p>
                </div>
              </button>

              {/* Manual entry option */}
              <button
                onClick={() => setMode("manual")}
                className="w-full flex items-center gap-4 p-4 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl
                           active:bg-[#1e1e2a] transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[#16161e] border border-[#2a2a3a] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-[#55556a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#c0c0d0]">Type manually</p>
                  <p className="text-[10px] text-[#55556a] mt-0.5">Enter dish name and macros yourself</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Scanning spinner */}
        {scanning && (
          <div className="py-6">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Meal"
                className="w-full aspect-[4/3] object-cover rounded-2xl border border-[#2a2a3a] mb-4"
              />
            )}
            <div className="flex items-center justify-center gap-3 py-4">
              <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-sm text-[#55556a]">Analyzing your meal...</span>
            </div>
            <div className="space-y-2 mt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3.5 shimmer rounded w-full" />
              ))}
            </div>
          </div>
        )}

        {/* Scan error */}
        {scanError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
            {scanError}
            <button onClick={() => { setScanError(null); setMode("choose"); }} className="block mt-1 underline text-red-400/70">
              Try again
            </button>
          </div>
        )}

        {/* Mode: Manual (also shown after photo scan with auto-filled values) */}
        {mode === "manual" && !scanning && (
          <>
            <h2 className="text-lg font-bold text-[#f0f0f5] mb-1">
              {mealInfo?.emoji} Add to {mealInfo?.label}
            </h2>

            {imagePreview && (
              <div className="mb-3">
                <img
                  src={imagePreview}
                  alt="Meal"
                  className="w-full aspect-[3/2] object-cover rounded-xl border border-[#2a2a3a]"
                />
                <p className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  AI-filled values below. Edit if needed.
                </p>
              </div>
            )}

            {!imagePreview && (
              <p className="text-xs text-[#3a3a4a] mb-4">Enter the dish name and nutritional values</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#55556a] mb-1 block">Dish name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Chicken biryani"
                  className={inputCls}
                  autoFocus={!imagePreview}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#55556a] mb-1 block">Calories (kcal)</label>
                  <input type="number" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-[#55556a] mb-1 block">Protein (g)</label>
                  <input type="number" value={pro} onChange={(e) => setPro(e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-[#55556a] mb-1 block">Carbs (g)</label>
                  <input type="number" value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-[#55556a] mb-1 block">Fat (g)</label>
                  <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" className={inputCls} />
                </div>
              </div>

              <button
                onClick={() =>
                  onAdd({
                    dish_name: name.trim(),
                    calories: Number(cal) || 0,
                    protein: Number(pro) || 0,
                    carbs: Number(carb) || 0,
                    fat: Number(fat) || 0,
                  })
                }
                disabled={!name.trim() || adding}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl
                           active:bg-orange-600 transition-colors disabled:opacity-50 mt-1"
              >
                {adding ? "Adding..." : "Add meal"}
              </button>

              {/* Back to choose mode */}
              {!imagePreview && (
                <button
                  onClick={() => setMode("choose")}
                  className="w-full py-2 text-xs text-[#55556a] active:text-[#8888a0] transition-colors"
                >
                  Back
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main MacrosTab ──
export default function MacrosTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMealType, setAddMealType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Fetch profile + logs
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, logsRes] = await Promise.all([
        fetch(`/api/macros/profile?user_id=${user.id}`),
        fetch(`/api/macros/log?user_id=${user.id}&date=${selectedDate}`),
      ]);
      const profileData = await profileRes.json();
      const logsData = await logsRes.json();
      setProfile(profileData.profile || null);
      setLogs(logsData.logs || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch only logs when date changes (profile doesn't change)
  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/macros/log?user_id=${user.id}&date=${selectedDate}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      /* silent */
    }
  }, [user, selectedDate]);

  async function saveProfile(p: Profile) {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/macros/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, ...p }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setShowEditProfile(false);
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  async function addMeal(mealType: string, meal: { dish_name: string; calories: number; protein: number; carbs: number; fat: number }) {
    if (!user) return;
    setAdding(true);
    try {
      const res = await fetch("/api/macros/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          log_date: selectedDate,
          meal_type: mealType,
          ...meal,
        }),
      });
      const data = await res.json();
      if (data.log) {
        setLogs((prev) => [...prev, data.log]);
        setAddMealType(null);
      }
    } catch {
      /* silent */
    } finally {
      setAdding(false);
    }
  }

  async function deleteMeal(id: string) {
    if (!user) return;
    try {
      await fetch("/api/macros/log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_id: user.id }),
      });
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      /* silent */
    }
  }

  // Date navigation
  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  function formatDate(dateStr: string) {
    if (isToday) return "Today";
    const d = new Date(dateStr + "T00:00:00");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  // Loading
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-6">
        <div className="h-6 shimmer rounded w-1/2 mb-3" />
        <div className="h-32 shimmer rounded-2xl mb-3" />
        <div className="h-20 shimmer rounded-xl mb-3" />
        <div className="h-20 shimmer rounded-xl" />
      </div>
    );
  }

  // No profile yet or editing profile
  if (!profile || showEditProfile) {
    return (
      <ProfileSetup
        initial={profile}
        onSave={saveProfile}
        saving={saving}
      />
    );
  }

  // Calculate totals
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + Number(l.calories),
      protein: acc.protein + Number(l.protein),
      carbs: acc.carbs + Number(l.carbs),
      fat: acc.fat + Number(l.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = {
    calories: Math.max(0, profile.target_calories - totals.calories),
    protein: Math.max(0, profile.target_protein - totals.protein),
    carbs: Math.max(0, profile.target_carbs - totals.carbs),
    fat: Math.max(0, profile.target_fat - totals.fat),
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#f0f0f5]">Macros</h1>
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-2 text-[#55556a] active:text-orange-500 transition-colors"
              title="Edit targets"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date navigator */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between bg-[#16161e] border border-[#2a2a3a] rounded-xl px-4 py-2.5">
            <button onClick={() => shiftDate(-1)} className="p-1 text-[#55556a] active:text-orange-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-[#f0f0f5]">{formatDate(selectedDate)}</span>
            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-1 text-[#55556a] active:text-orange-500 disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calorie ring + macro bars */}
        <div className="px-5 pb-4">
          <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
            <div className="flex items-center justify-center mb-5">
              <Ring value={totals.calories} max={profile.target_calories} size={140} stroke={12} color="#f97316">
                <span className="text-3xl font-bold text-[#f0f0f5]">{remaining.calories}</span>
                <span className="text-[10px] text-[#55556a]">kcal remaining</span>
              </Ring>
            </div>

            <div className="flex gap-4">
              <MacroBar label="Protein" value={Math.round(totals.protein)} max={profile.target_protein} unit="g" color="#f97316" />
              <MacroBar label="Carbs" value={Math.round(totals.carbs)} max={profile.target_carbs} unit="g" color="#3b82f6" />
              <MacroBar label="Fat" value={Math.round(totals.fat)} max={profile.target_fat} unit="g" color="#a855f7" />
            </div>
          </div>
        </div>

        {/* Meal sections */}
        <div className="px-5 pb-6 space-y-3">
          {MEAL_TYPES.map((meal) => {
            const mealLogs = logs.filter((l) => l.meal_type === meal.key);
            const mealCal = mealLogs.reduce((s, l) => s + Number(l.calories), 0);

            return (
              <div key={meal.key} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
                {/* Meal header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meal.emoji}</span>
                    <span className="text-sm font-medium text-[#f0f0f5]">{meal.label}</span>
                    {mealCal > 0 && (
                      <span className="text-[10px] text-[#55556a] bg-[#0a0a0f] px-2 py-0.5 rounded-full">
                        {mealCal} kcal
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setAddMealType(meal.key)}
                    className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center
                               active:bg-orange-500/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Logged items */}
                {mealLogs.length > 0 && (
                  <div className="border-t border-[#2a2a3a]">
                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a3a] last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#c0c0d0] truncate">{log.dish_name}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-[10px] text-[#55556a]">{log.calories} cal</span>
                            <span className="text-[10px] text-orange-400/70">P {log.protein}g</span>
                            <span className="text-[10px] text-blue-400/70">C {log.carbs}g</span>
                            <span className="text-[10px] text-purple-400/70">F {log.fat}g</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMeal(log.id)}
                          className="p-1.5 text-[#3a3a4a] active:text-red-400 transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Daily summary */}
        {logs.length > 0 && (
          <div className="px-5 pb-6">
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
              <p className="text-xs font-medium text-orange-400 mb-2">Daily Summary</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-[#f0f0f5]">{Math.round(totals.calories)}</p>
                  <p className="text-[9px] text-[#55556a]">Calories</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-400">{Math.round(totals.protein)}g</p>
                  <p className="text-[9px] text-[#55556a]">Protein</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-400">{Math.round(totals.carbs)}g</p>
                  <p className="text-[9px] text-[#55556a]">Carbs</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-400">{Math.round(totals.fat)}g</p>
                  <p className="text-[9px] text-[#55556a]">Fat</p>
                </div>
              </div>
              {totals.calories > 0 && totals.calories < profile.target_calories && (
                <p className="text-[10px] text-[#55556a] text-center mt-3">
                  {remaining.calories} kcal and {remaining.protein}g protein remaining for the day
                </p>
              )}
              {totals.calories >= profile.target_calories && (
                <p className="text-[10px] text-green-400 text-center mt-3">
                  You've hit your calorie target for the day!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add meal modal */}
      {addMealType && (
        <AddMealModal
          mealType={addMealType}
          onClose={() => setAddMealType(null)}
          onAdd={(meal) => addMeal(addMealType, meal)}
          adding={adding}
        />
      )}
    </>
  );
}
