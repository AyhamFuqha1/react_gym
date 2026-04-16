import type { FoodItem } from "../services/foods";

export type FoodFormState = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  serving_size: string;
  badge: string;
  image: string;
};

export const initialFormState: FoodFormState = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  serving_size: "",
  badge: "",
  image: "",
};

export const iconEmojiMap: Record<string, string> = {
  protein: "🥩",
  carbohydrates: "🌽",
  carbs: "🌽",
  vegetables: "🥗",
  fruits: "🍎",
  seafood: "🐟",
  "healthy fat": "🥑",
  "healthy fats": "🥑",
  fats: "🥑",
  dairy: "🥛",
  snacks: "🥨",
  hydration: "💧",
  mixed: "🍱",
  "mixed meals": "🍱",
};

export const gradientMap: Record<string, string> = {
  protein: "from-rose-500 to-red-500",
  carbohydrates: "from-amber-500 to-orange-500",
  carbs: "from-amber-500 to-orange-500",
  vegetables: "from-green-500 to-emerald-500",
  fruits: "from-pink-500 to-rose-500",
  seafood: "from-cyan-500 to-blue-500",
  "healthy fat": "from-emerald-500 to-teal-500",
  "healthy fats": "from-emerald-500 to-teal-500",
  fats: "from-emerald-500 to-teal-500",
  dairy: "from-sky-500 to-indigo-500",
  snacks: "from-violet-500 to-purple-500",
  hydration: "from-blue-500 to-cyan-500",
  mixed: "from-purple-500 to-violet-500",
  "mixed meals": "from-purple-500 to-violet-500",
};

export const badgeOptions = [
  "High Protein",
  "Low Fat",
  "Fiber Rich",
  "Heart Healthy",
  "Low GI",
  "Omega-3 Rich",
  "Balanced",
  "Antioxidant",
  "Pre-Workout",
  "Post-Workout",
];

export const badgeColors: Record<string, string> = {
  "High Protein": "bg-blue-50 text-blue-600 border-blue-200",
  "Low Fat": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Omega-3 Rich": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "Fiber Rich": "bg-amber-50 text-amber-600 border-amber-200",
  "Low GI": "bg-green-50 text-green-600 border-green-200",
  "Heart Healthy": "bg-rose-50 text-rose-600 border-rose-200",
  Antioxidant: "bg-purple-50 text-purple-600 border-purple-200",
  Balanced: "bg-indigo-50 text-indigo-600 border-indigo-200",
  "Pre-Workout": "bg-yellow-50 text-yellow-600 border-yellow-200",
  "Post-Workout": "bg-pink-50 text-pink-600 border-pink-200",
};

export function getIconEmoji(icon?: string | null) {
  if (!icon) return "🥗";
  return iconEmojiMap[icon.toLowerCase()] || "🥗";
}

export function getGradient(icon?: string | null) {
  if (!icon) return "from-green-500 to-emerald-500";
  return gradientMap[icon.toLowerCase()] || "from-green-500 to-emerald-500";
}

export function toInputValue(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function filterFoods(
  foods: FoodItem[],
  numericCategoryId: number,
  searchQuery: string,
  calorieFilter: string
) {
  return foods
    .filter((food) => Number(food.category?.id) === Number(numericCategoryId))
    .filter((food) => {
      const matchesSearch = food.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const calories = Number(food.calories);
      let matchesCalories = true;

      if (calorieFilter === "low") matchesCalories = calories < 100;
      if (calorieFilter === "medium") {
        matchesCalories = calories >= 100 && calories < 300;
      }
      if (calorieFilter === "high") matchesCalories = calories >= 300;

      return matchesSearch && matchesCalories;
    });
}
 

export function getCategoryData(
  categoryFoods: FoodItem[],
  categoryId?: string
) {
  const firstFood = categoryFoods[0];

  if (firstFood?.category) {
    return {
      name: firstFood.category.category_name,
      description: firstFood.category.description || "No description available",
      icon: getIconEmoji(firstFood.category.icon),
      gradient: getGradient(firstFood.category.icon),
    };
  }

  return {
    name: `Category #${categoryId ?? ""}`,
    description: "No foods found in this category yet",
    icon: "🥗",
    gradient: "from-green-500 to-emerald-500",
  };
}