import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateGeneralNutrition,
  type GeneralNutritionItem,
  type GeneralNutritionPayload,
} from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useUpdateGeneralNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: GeneralNutritionPayload;
    }) => updateGeneralNutrition(id, payload),

    onSuccess: (updatedCategory, variables) => {
      queryClient.setQueryData<GeneralNutritionItem[]>(
        generalNutritionKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((item) =>
            item.id === variables.id ? updatedCategory : item
          );
        }
      );

      queryClient.setQueryData<GeneralNutritionItem>(
        generalNutritionKeys.detail(variables.id),
        updatedCategory
      );
    },
  });
}