import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateGeneralNutrition,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: generalNutritionKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: generalNutritionKeys.detail(variables.id),
      });
    },
  });
}