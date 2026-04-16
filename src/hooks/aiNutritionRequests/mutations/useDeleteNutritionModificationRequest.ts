import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNutritionModificationRequest } from "../../../services/aiNutritionRequests";
import type { NutritionModificationRequestItem } from "../../../utils/aiNutritionRequests";

export function useDeleteNutritionModificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNutritionModificationRequest(id),

    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<NutritionModificationRequestItem[]>(
        ["nutrition-modification-requests"],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((item) => item.id !== deletedId);
        }
      );
    },
  });
}