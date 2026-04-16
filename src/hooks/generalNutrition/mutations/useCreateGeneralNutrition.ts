import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGeneralNutrition,
  type GeneralNutritionItem,
  type GeneralNutritionPayload,
} from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useCreateGeneralNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GeneralNutritionPayload) =>
      createGeneralNutrition(payload),

    onSuccess: (createdCategory) => {
      queryClient.setQueryData<GeneralNutritionItem[]>(
        generalNutritionKeys.list(),
        (oldData) => {
          if (!oldData) return [createdCategory];
          return [...oldData, createdCategory];
        }
      );
    },
  });
}