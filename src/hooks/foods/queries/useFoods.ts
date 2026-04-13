import { useQuery } from "@tanstack/react-query";
import { getFoods } from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useFoods() {
  return useQuery({
    queryKey: foodsKeys.list(),
    queryFn: getFoods,
  });
}