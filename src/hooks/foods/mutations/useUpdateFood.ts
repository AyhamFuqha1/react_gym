import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateFood,
  type FoodPayload,
  type FoodsResponse,
} from "../../../services/foods";
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

    onSuccess: (updatedFood, variables) => {
      queryClient.setQueryData<FoodsResponse | { data: any[] }>(
        foodsKeys.list(),
        (oldData) => {
          if (!oldData) return oldData;

          const oldFoods = Array.isArray(oldData.data) ? oldData.data : [];

          return {
            ...oldData,
            data: oldFoods.map((food) =>
              food.id === variables.foodId
                ? {
                    ...food,
                    ...updatedFood.data,
                    category:
                      updatedFood.data?.category ??
                      food.category,
                  }
                : food
            ),
          };
        }
      );
    },
  });
}