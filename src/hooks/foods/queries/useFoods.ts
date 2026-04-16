import { useQuery } from "@tanstack/react-query";
import { getFoods } from "../../../services/foods";
import { foodsKeys } from "../keys";

export function useFoods() {
  return useQuery({
    queryKey: foodsKeys.list(),
    queryFn: getFoods,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}