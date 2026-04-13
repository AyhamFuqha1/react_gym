import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveEditedTrainingPlan } from "../../../services/pendingTrainingPlans";
import type { PendingTrainingPlanItem } from "../../../utils/pendingTrainingPlans";

export function useSavePendingTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: PendingTrainingPlanItem) => saveEditedTrainingPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-training-plans"],
      });
    },
  });
}