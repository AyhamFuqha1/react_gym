import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFood, type FoodsResponse } from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useDeleteFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (foodId: number) => deleteFood(foodId),
    onSuccess: (_, deletedFoodId) => {
      queryClient.setQueryData<FoodsResponse | { data: any[] }>(
        foodsKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;

          const oldFoods = Array.isArray(oldData.data) ? oldData.data : [];

          return {
            ...oldData,
            data: oldFoods.filter((food) => food.id !== deletedFoodId),
          };
        }
      );
    },
  });
}