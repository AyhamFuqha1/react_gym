import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFood,
  type FoodPayload,
  type FoodsResponse,
} from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FoodPayload) => createFood(payload),
    onSuccess: (createdFood, variables) => {
      queryClient.setQueryData<FoodsResponse | { data: any[] }>(
        foodsKeys.list(),
        (oldData) => {
          const oldFoods = Array.isArray(oldData?.data) ? oldData.data : [];

          const newFoodRaw = createdFood?.data?.data ?? createdFood?.data ?? createdFood;

          const newFood = {
            ...newFoodRaw,
            category: newFoodRaw?.category ?? {
              id: variables.general_nutrition_id,
              category_name: "",
              icon: null,
              description: null,
            },
          };

          return {
            ...(oldData ?? { data: [] }),
            data: [...oldFoods, newFood],
          };
        }
      );
    },
  });
}