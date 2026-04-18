import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import { searchFoods } from "../../../services/aiNutritionRequests";
import type {
  NutritionModificationRequestItem,
  SearchFoodsResultItem,
} from "../../../utils/aiNutritionRequests";
import { aiNutritionRequestsKeys } from "../queries/useAINutritionRequestsQueries";

type ApproveNutritionPayload = {
  plan_id?: number;
  daily_meals: Array<{
    meal: string;
    items: Array<{
      food_id: number;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      quantity: number;
    }>;
  }>;
};

export function useSearchFoodsMutation() {
  return useMutation<SearchFoodsResultItem[], Error, string>({
    mutationFn: async (query: string) => {
      return searchFoods(query);
    },
  });
}

export function useApproveNutritionModificationMutation(
  requestId: number | null
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ApproveNutritionPayload) => {
      if (!requestId) {
        throw new Error("Missing request id.");
      }

      const response = await api.post(
        `/modification-requests/nutrition/${requestId}`,
        payload
      );

      return response.data;
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: aiNutritionRequestsKeys.lists(),
        }),
        ...(requestId
          ? [
              queryClient.invalidateQueries({
                queryKey: aiNutritionRequestsKeys.detail(requestId),
              }),
            ]
          : []),
      ]);
    },
  });
}