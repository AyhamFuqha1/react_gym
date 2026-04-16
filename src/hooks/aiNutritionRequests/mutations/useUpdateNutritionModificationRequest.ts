import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNutritionModificationRequest } from "../../../services/aiNutritionRequests";
import type { NutritionModificationRequestItem } from "../../../utils/aiNutritionRequests";

type UpdateNutritionModificationRequestPayload = Parameters<
  typeof updateNutritionModificationRequest
>[1];

export function useUpdateNutritionModificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateNutritionModificationRequestPayload;
    }) => updateNutritionModificationRequest(id, payload),

    onSuccess: (updatedItem, variables) => {
      queryClient.setQueryData<NutritionModificationRequestItem[]>(
        ["nutrition-modification-requests"],
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((item) =>
            item.id === variables.id
              ? {
                  ...item,
                  ...(updatedItem?.data ?? updatedItem ?? {}),
                }
              : item
          );
        }
      );
    },
  });
}