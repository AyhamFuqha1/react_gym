import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFood, type FoodPayload } from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FoodPayload) => createFood(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: foodsKeys.list(),
      });
    },
  });
}