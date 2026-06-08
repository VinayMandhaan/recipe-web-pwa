// Macro calculation using Mifflin-St Jeor equation

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "active" | "very_active";
export type Goal = "cut" | "maintain" | "bulk";

export interface MacroProfile {
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  very_active: 1.725,
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job)",
  light: "Lightly active (1-3 days/week)",
  active: "Active (3-5 days/week)",
  very_active: "Very active / Lifting (6-7 days/week)",
};

const GOAL_LABELS: Record<Goal, string> = {
  cut: "Lose weight",
  maintain: "Maintain weight",
  bulk: "Build muscle",
};

// Protein per kg based on activity + goal
function getProteinPerKg(activity: ActivityLevel, goal: Goal): number {
  if (goal === "bulk" || activity === "very_active") return 2.0;
  if (goal === "cut") return 1.8; // higher protein on a cut preserves muscle
  if (activity === "active") return 1.6;
  if (activity === "light") return 1.4;
  return 1.2;
}

export function calculateBMR(profile: MacroProfile): number {
  // Mifflin-St Jeor
  const base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age;
  return profile.gender === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(profile: MacroProfile): number {
  const bmr = calculateBMR(profile);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activity_level]);
}

export function calculateMacros(profile: MacroProfile): MacroTargets {
  let tdee = calculateTDEE(profile);

  // Goal adjustment
  if (profile.goal === "cut") tdee -= 500;
  if (profile.goal === "bulk") tdee += 300;

  const calories = Math.max(1200, Math.round(tdee)); // floor at 1200

  // Protein: based on activity + goal
  const proteinPerKg = getProteinPerKg(profile.activity_level, profile.goal);
  const protein = Math.round(proteinPerKg * profile.weight_kg);

  // Fat: 25% of calories
  const fatCalories = calories * 0.25;
  const fat = Math.round(fatCalories / 9);

  // Carbs: remaining calories
  const proteinCalories = protein * 4;
  const carbCalories = calories - proteinCalories - fatCalories;
  const carbs = Math.max(50, Math.round(carbCalories / 4)); // floor at 50g

  return { calories, protein, carbs, fat };
}

export { ACTIVITY_LABELS, GOAL_LABELS };
