// Client-side dietary tag detection from ingredients - no API call needed

const MEAT = /\b(chicken|beef|pork|lamb|mutton|turkey|duck|bacon|ham|sausage|salami|pepperoni|steak|mince|ground meat|veal|goat)\b/i;
const FISH = /\b(fish|salmon|tuna|shrimp|prawn|crab|lobster|cod|tilapia|anchov|sardine|mackerel|squid|clam|mussel|oyster|scallop)\b/i;
const DAIRY = /\b(milk|cream|cheese|butter|yogurt|yoghurt|ghee|paneer|curd|whey|sour cream|cream cheese|mozzarella|parmesan|cheddar)\b/i;
const EGG = /\b(egg|eggs)\b/i;
const GLUTEN = /\b(flour|bread|pasta|noodle|spaghetti|penne|macaroni|wheat|roti|naan|tortilla|biscuit|cracker|breadcrumb|couscous|semolina|barley|rye|croissant|pita|wrap)\b/i;
const NUTS = /\b(almond|cashew|walnut|pistachio|pecan|hazelnut|macadamia|peanut|pine nut|brazil nut)\b/i;
const HIGH_CARB = /\b(sugar|honey|maple syrup|rice|potato|bread|pasta|noodle|flour|corn|tortilla)\b/i;

export interface DietaryTag {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

const ALL_TAGS: DietaryTag[] = [
  { key: "vegan", label: "Vegan", emoji: "🌱", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  { key: "vegetarian", label: "Vegetarian", emoji: "🥬", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  { key: "gluten-free", label: "Gluten-Free", emoji: "🌾", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  { key: "dairy-free", label: "Dairy-Free", emoji: "🥛", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { key: "nut-free", label: "Nut-Free", emoji: "🥜", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  { key: "keto", label: "Keto", emoji: "🥑", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
];

export function detectDietaryTags(ingredients: string[]): DietaryTag[] {
  const joined = ingredients.join(" ");
  const tags: DietaryTag[] = [];

  const hasMeat = MEAT.test(joined);
  const hasFish = FISH.test(joined);
  const hasDairy = DAIRY.test(joined);
  const hasEgg = EGG.test(joined);
  const hasGluten = GLUTEN.test(joined);
  const hasNuts = NUTS.test(joined);
  const hasHighCarb = HIGH_CARB.test(joined);

  // Vegan: no meat, fish, dairy, eggs
  if (!hasMeat && !hasFish && !hasDairy && !hasEgg) {
    tags.push(ALL_TAGS.find((t) => t.key === "vegan")!);
  }
  // Vegetarian: no meat, no fish (dairy/eggs ok)
  else if (!hasMeat && !hasFish) {
    tags.push(ALL_TAGS.find((t) => t.key === "vegetarian")!);
  }

  if (!hasGluten) tags.push(ALL_TAGS.find((t) => t.key === "gluten-free")!);
  if (!hasDairy) tags.push(ALL_TAGS.find((t) => t.key === "dairy-free")!);
  if (!hasNuts) tags.push(ALL_TAGS.find((t) => t.key === "nut-free")!);

  // Keto: no high carb, has fat/protein sources
  if (!hasHighCarb && (hasMeat || hasFish || hasEgg || hasDairy || hasNuts)) {
    tags.push(ALL_TAGS.find((t) => t.key === "keto")!);
  }

  return tags;
}
