import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveNutritionModification } from "../../../services/aiNutritionRequests";
import type { NutritionModificationRequestItem } from "../../../utils/aiNutritionRequests";

export function useApproveNutritionModification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: NutritionModificationRequestItem) =>
      approveNutritionModification(request),

    onSuccess: (approvedItem, variables) => {
      queryClient.setQueryData<NutritionModificationRequestItem[]>(
        ["nutrition-modification-requests"],
        (oldData) => {
          if (!oldData) return oldData;

          const responseItem = approvedItem?.data ?? approvedItem ?? null;

          return oldData.map((item) =>
            item.id === variables.id
              ? {
                  ...item,
                  ...(responseItem ?? {}),
                  status: responseItem?.status ?? "approved",
                }
              : item
          );
        }
      );
    },
  });
}