import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteModificationRequest } from "../../../services/aiPlanRequests";
import type { ModificationRequestItem } from "../../../utils/aiPlanRequests";

export function useDeleteModificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteModificationRequest(id),

    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<ModificationRequestItem[]>(
        ["training-modification-requests"],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((item) => item.id !== deletedId);
        }
      );
    },
  });
}