import type { GeneralNutritionItem } from "../services/generalNutrition";

export type CategoryCard = {
  id: number;
  name: string;
  foodCount: number;
  icon: string;
  gradient: string;
  bgSoft: string;
  borderColor: string;
  textColor: string;
  description: string;
};

export type FormState = {
  category_name: string;
  icon: string;
  description: string;
};

export type IconOption = {
  value: string;
  label: string;
  emoji: string;
};

export const initialForm: FormState = {
  category_name: "",
  icon: "",
  description: "",
};

export const iconOptions: IconOption[] = [
  { value: "protein", label: "Protein", emoji: "🥩" },
  { value: "carbohydrates", label: "Carbohydrates", emoji: "🌾" },
  { value: "healthy_fats", label: "Healthy Fats", emoji: "🥑" },
  { value: "vegetables", label: "Vegetables", emoji: "🥗" },
  { value: "fruits", label: "Fruits", emoji: "🍎" },
  { value: "mixed_meals", label: "Mixed Meals", emoji: "🍱" },
  { value: "dairy", label: "Dairy", emoji: "🥛" },
  { value: "seafood", label: "Seafood", emoji: "🐟" },
  { value: "snacks", label: "Snacks", emoji: "🥜" },
  { value: "hydration", label: "Hydration", emoji: "💧" },
];

const stylePresets = [
  {
    gradient: "from-blue-500 to-cyan-500",
    bgSoft: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-600",
    fallbackIcon: "🥩",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    bgSoft: "bg-amber-50",
    borderColor: "border-amber-100",
    textColor: "text-amber-600",
    fallbackIcon: "🌾",
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    bgSoft: "bg-emerald-50",
    borderColor: "border-emerald-100",
    textColor: "text-emerald-600",
    fallbackIcon: "🥑",
  },
  {
    gradient: "from-green-500 to-emerald-500",
    bgSoft: "bg-green-50",
    borderColor: "border-green-100",
    textColor: "text-green-600",
    fallbackIcon: "🥗",
  },
  {
    gradient: "from-pink-500 to-rose-500",
    bgSoft: "bg-pink-50",
    borderColor: "border-pink-100",
    textColor: "text-pink-600",
    fallbackIcon: "🍎",
  },
  {
    gradient: "from-purple-500 to-violet-500",
    bgSoft: "bg-purple-50",
    borderColor: "border-purple-100",
    textColor: "text-purple-600",
    fallbackIcon: "🍱",
  },
];

export function mapIcon(
  icon: string | null | undefined,
  fallbackIcon: string
): string {
  if (!icon) return fallbackIcon;

  const normalized = icon.trim().toLowerCase();
  const found = iconOptions.find((option) => option.value === normalized);

  return found?.emoji || fallbackIcon;
}

export function getCategoryVisual(index: number, item: GeneralNutritionItem) {
  const preset = stylePresets[index % stylePresets.length];

  return {
    gradient: preset.gradient,
    bgSoft: preset.bgSoft,
    borderColor: preset.borderColor,
    textColor: preset.textColor,
    icon: mapIcon(item.icon, preset.fallbackIcon),
  };
}

export function mapCategories(data: GeneralNutritionItem[]): CategoryCard[] {
  return data.map((item, index) => {
    const visual = getCategoryVisual(index, item);

    return {
      id: item.id,
      name: item.category_name,
      foodCount: item.foods.length,
      icon: visual.icon,
      gradient: visual.gradient,
      bgSoft: visual.bgSoft,
      borderColor: visual.borderColor,
      textColor: visual.textColor,
      description: item.description?.trim() || "No description available.",
    };
  });
}