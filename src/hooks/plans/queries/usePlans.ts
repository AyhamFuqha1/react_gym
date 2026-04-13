import { useQuery } from "@tanstack/react-query";
import { getPlans } from "../../../services/plans";
import { plansKeys } from "../keys";

export function usePlans() {
  return useQuery({
    queryKey: plansKeys.list(),
    queryFn: getPlans,
  });
}