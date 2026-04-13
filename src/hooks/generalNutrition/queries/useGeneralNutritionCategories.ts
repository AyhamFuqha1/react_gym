import { useQuery } from "@tanstack/react-query";
import { getGeneralNutritionCategories } from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useGeneralNutritionCategories() {
  return useQuery({
    queryKey: generalNutritionKeys.list(),
    queryFn: getGeneralNutritionCategories,
  });
}