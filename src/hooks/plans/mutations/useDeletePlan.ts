import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlan } from "../../../services/plans";
import { plansKeys } from "../keys";

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) => deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: plansKeys.list(),
      });
    },
  });
}