import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveTrainingModification } from "../../../services/aiPlanRequests";
import type { ModificationRequestItem } from "../../../utils/aiPlanRequests";

export function useApproveTrainingModification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ModificationRequestItem) =>
      approveTrainingModification(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-modification-requests"],
      });
    },
  });
}