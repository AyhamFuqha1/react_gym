import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateModificationRequest } from "../../../services/aiPlanRequests";

type UpdateModificationRequestPayload = Parameters<
  typeof updateModificationRequest
>[1];

export function useUpdateModificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateModificationRequestPayload;
    }) => updateModificationRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-modification-requests"],
      });
    },
  });
}