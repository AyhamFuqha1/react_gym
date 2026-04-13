import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlan, type PlanPayload } from "../../../services/plans";
import { plansKeys } from "../keys";

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlanPayload) => createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: plansKeys.list(),
      });
    },
  });
}