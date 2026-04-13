import { useQuery } from "@tanstack/react-query";
import { getGeneralNutritionById } from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useGeneralNutritionById(id: number | null, enabled = true) {
  return useQuery({
    queryKey: generalNutritionKeys.detail(id ?? 0),
    queryFn: () => getGeneralNutritionById(id as number),
    enabled: enabled && id !== null,
  });
}