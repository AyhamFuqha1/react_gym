import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveNutritionModification,
  searchFoods,
  type ApproveNutritionPayload,
} from "../../../services/aiNutritionRequests";
import { normalizeSearchFoodsResponse } from "../../../utils/aiNutritionRequests";
import { aiNutritionRequestsKeys } from "../queries/useAINutritionRequestsQueries";

export function useSearchFoodsMutation() {
  return useMutation({
    mutationFn: async (query: string) => {
      const response = await searchFoods(query);
      return normalizeSearchFoodsResponse(response);
    },
  });
}

export function useApproveNutritionModificationMutation(requestId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ApproveNutritionPayload) => {
      if (!requestId) {
        throw new Error("Missing request id.");
      }

      return approveNutritionModification(requestId, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: aiNutritionRequestsKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: aiNutritionRequestsKeys.detail(requestId),
        }),
      ]);
    },
  });
}