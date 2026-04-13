import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGeneralNutrition,
  type GeneralNutritionPayload,
} from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useCreateGeneralNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GeneralNutritionPayload) =>
      createGeneralNutrition(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: generalNutritionKeys.list(),
      });
    },
  });
}