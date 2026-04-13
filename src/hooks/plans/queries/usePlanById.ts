import { useQuery } from "@tanstack/react-query";
import { getPlanById } from "../../../services/plans";
import { plansKeys } from "../keys";

export function usePlanById(planId: number | null, enabled = true) {
  return useQuery({
    queryKey: plansKeys.detail(planId ?? 0),
    queryFn: () => getPlanById(planId as number),
    enabled: enabled && planId !== null,
  });
}