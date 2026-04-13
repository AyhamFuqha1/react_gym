import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlan, type PlanPayload } from "../../../services/plans";
import { plansKeys } from "../keys";

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: number;
      payload: PlanPayload;
    }) => updatePlan(planId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plansKeys.list(),
      });

      queryClient.invalidateQueries({
        queryKey: plansKeys.detail(variables.planId),
      });
    },
  });
}