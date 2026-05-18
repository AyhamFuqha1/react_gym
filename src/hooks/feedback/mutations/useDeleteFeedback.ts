import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFeedback } from "../../../services/feedback";
import { feedbackKeys } from "../keys";

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
    },
  });
}
