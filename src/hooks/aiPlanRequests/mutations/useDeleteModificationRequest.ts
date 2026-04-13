import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteModificationRequest } from "../../../services/aiPlanRequests";

export function useDeleteModificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteModificationRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-modification-requests"],
      });
    },
  });
}