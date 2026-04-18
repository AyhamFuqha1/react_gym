import { useQuery } from "@tanstack/react-query";
import { getNutritionModificationRequests } from "../../../services/aiNutritionRequests";

export const aiNutritionRequestsKeys = {
  all: ["nutrition-modification-requests"] as const,
  lists: () => ["nutrition-modification-requests"] as const,
  detail: (id: number | null | undefined) =>
    ["nutrition-modification-requests", id] as const,
};

export function useNutritionModificationRequests() {
  return useQuery({
    queryKey: aiNutritionRequestsKeys.lists(),
    queryFn: getNutritionModificationRequests,
  });
}