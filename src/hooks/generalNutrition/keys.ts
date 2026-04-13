export const generalNutritionKeys = {
  all: ["generalNutrition"] as const,
  lists: () => [...generalNutritionKeys.all, "lists"] as const,
  list: () => [...generalNutritionKeys.lists()] as const,
  details: () => [...generalNutritionKeys.all, "details"] as const,
  detail: (id: number) => [...generalNutritionKeys.details(), id] as const,
};