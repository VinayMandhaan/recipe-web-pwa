"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import RecipeDetail from "./RecipeDetail";

interface SavedRecipe {
  id: string;
  dish: string;
  ingredients: string[];
  steps: string[];
  tag: string | null;
}

interface MealPlan {
  id: string;
  date: string;
  recipe_id: string;
  meal_type: string;
  saved_recipes: SavedRecipe;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍿" },
];

const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-amber-500",
  lunch: "bg-yellow-500",
  dinner: "bg-indigo-500",
  snack: "bg-pink-500",
};

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function PlanTab() {
  const { user } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [pickerMealType, setPickerMealType] = useState("dinner");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [viewRecipe, setViewRecipe] = useState<SavedRecipe | null>(null);

  const fetchPlans = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/meal-plans?user_id=${user.id}&month=${month + 1}&year=${year}`)
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, month, year]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }

  async function openRecipePicker(mealType: string) {
    setPickerMealType(mealType);
    if (savedRecipes.length === 0 && user) {
      const res = await fetch(`/api/recipes?user_id=${user.id}`);
      const d = await res.json();
      setSavedRecipes(d.recipes || []);
    }
    setShowRecipePicker(true);
  }

  async function addToPlan(recipe: SavedRecipe) {
    if (!user || !selectedDay) return;
    const date = dateKey(year, month, selectedDay);
    const res = await fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        date,
        recipe_id: recipe.id,
        meal_type: pickerMealType,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setPlans((prev) => [...prev, d.plan]);
    }
    setShowRecipePicker(false);
  }

  async function removeFromPlan(planId: string) {
    if (!user) return;
    await fetch("/api/meal-plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: planId, user_id: user.id }),
    });
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  }

  const calDays = getCalendarDays(year, month);
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Group plans by date
  const plansByDate = new Map<string, MealPlan[]>();
  for (const p of plans) {
    const key = p.date;
    if (!plansByDate.has(key)) plansByDate.set(key, []);
    plansByDate.get(key)!.push(p);
  }

  const selectedDateStr = selectedDay ? dateKey(year, month, selectedDay) : null;
  const selectedPlans = selectedDateStr ? plansByDate.get(selectedDateStr) || [] : [];

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meal Plan</h1>
              <p className="text-sm text-gray-500 mt-1">Plan your meals for the month</p>
            </div>
            <button
              onClick={goToday}
              className="px-3 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-xs font-medium
                         active:bg-blue-100 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Month navigation */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 text-gray-500 active:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 text-gray-500 active:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar grid */}
        <div className="px-5 pb-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dk = dateKey(year, month, day);
              const dayPlans = plansByDate.get(dk) || [];
              const selected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                    selected
                      ? "bg-blue-500 text-white"
                      : isToday(day)
                        ? "bg-blue-50 text-blue-500"
                        : "bg-white border border-gray-100 text-gray-700 active:bg-gray-50"
                  }`}
                >
                  <span className="text-xs font-medium">{day}</span>
                  {dayPlans.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayPlans.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className={`w-1 h-1 rounded-full ${
                            selected ? "bg-white/70" : MEAL_COLORS[p.meal_type] || "bg-blue-500"
                          }`}
                        />
                      ))}
                      {dayPlans.length > 3 && (
                        <span className={`text-[6px] ${selected ? "text-white/70" : "text-gray-500"}`}>
                          +{dayPlans.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div className="px-5 pt-4 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {MONTHS[month]} {selectedDay}
              </h3>
              <div className="flex gap-1.5">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.key}
                    onClick={() => openRecipePicker(mt.key)}
                    className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-medium
                               active:bg-blue-50 active:text-blue-500 transition-colors"
                  >
                    {mt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {selectedPlans.length === 0 ? (
              <div className="bg-white border border-gray-100 border-dashed rounded-xl p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500">No meals planned</p>
                <p className="text-xs text-gray-400 mt-1">Tap a meal icon above to add a recipe</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPlans.map((p) => {
                  const mt = MEAL_TYPES.find((m) => m.key === p.meal_type);
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm"
                    >
                      <span className="text-lg">{mt?.emoji || "🍽️"}</span>
                      <button
                        onClick={() => setViewRecipe(p.saved_recipes)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.saved_recipes.dish}
                        </p>
                        <p className="text-[10px] text-gray-500 capitalize">{p.meal_type}</p>
                      </button>
                      <button
                        onClick={() => removeFromPlan(p.id)}
                        className="p-1.5 text-gray-400 active:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No day selected hint */}
        {!selectedDay && !loading && (
          <div className="px-5 pt-4 pb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm">
              <p className="text-sm text-gray-500">Tap a date to plan meals</p>
              <p className="text-xs text-gray-400 mt-1">
                Color dots show planned meals for each day
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recipe picker overlay */}
      {showRecipePicker && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex justify-center">
        <div className="flex flex-col w-full max-w-[480px] bg-white safe-top safe-bottom
                        lg:border-x lg:border-gray-200">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowRecipePicker(false)}
              className="p-1 -ml-1 text-gray-500 active:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Add {MEAL_TYPES.find((m) => m.key === pickerMealType)?.label || "Meal"}
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {savedRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center px-8 pt-20">
                <p className="text-sm text-gray-500">No saved recipes</p>
                <p className="text-xs text-gray-400 mt-1">
                  Save some recipes first, then add them to your meal plan
                </p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-2">
                {savedRecipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => addToPlan(r)}
                    className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm
                               active:bg-gray-50 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.dish}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {r.ingredients.length} ingredients, {r.steps.length} steps
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Recipe detail view */}
      {viewRecipe && (
        <RecipeDetail
          dish={viewRecipe.dish}
          ingredients={viewRecipe.ingredients}
          steps={viewRecipe.steps}
          onClose={() => setViewRecipe(null)}
        />
      )}
    </>
  );
}
