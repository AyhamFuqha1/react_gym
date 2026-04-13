import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFood } from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useDeleteFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (foodId: number) => deleteFood(foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: foodsKeys.list(),
      });
    },
  });
}