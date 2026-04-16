import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GeneralNutritionItem } from "../../../services/generalNutrition";
import { deleteGeneralNutrition } from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useDeleteGeneralNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteGeneralNutrition(id),

    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<GeneralNutritionItem[]>(
        generalNutritionKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((item) => item.id !== deletedId);
        }
      );

      queryClient.removeQueries({
        queryKey: generalNutritionKeys.detail(deletedId),
      });
    },
  });
}