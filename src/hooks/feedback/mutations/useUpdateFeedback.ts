import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateFeedback,
  type UpdateFeedbackPayload,
} from "../../../services/feedback";
import { feedbackKeys } from "../keys";

interface UpdateFeedbackVariables {
  id: number;
  payload: UpdateFeedbackPayload;
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateFeedbackVariables) =>
      updateFeedback(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
    },
  });
}
