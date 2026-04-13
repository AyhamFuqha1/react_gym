import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGeneralNutrition } from "../../../services/generalNutrition";
import { generalNutritionKeys } from "../keys";

export function useDeleteGeneralNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteGeneralNutrition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: generalNutritionKeys.list(),
      });
    },
  });
}