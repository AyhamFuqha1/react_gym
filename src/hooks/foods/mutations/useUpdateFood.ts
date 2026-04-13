import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFood, type FoodPayload } from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useUpdateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      foodId,
      payload,
    }: {
      foodId: number;
      payload: FoodPayload;
    }) => updateFood(foodId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: foodsKeys.list(),
      });
    },
  });
}