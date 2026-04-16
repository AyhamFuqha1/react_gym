import { useQuery } from "@tanstack/react-query";
import { getNutritionModificationRequests } from "../../../services/aiNutritionRequests";

export function useNutritionModificationRequests() {
  return useQuery({
    queryKey: ["nutrition-modification-requests"],
    queryFn: getNutritionModificationRequests,
  });
}