import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCoachSession } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useDeleteCoachSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => deleteCoachSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: coachSessionsKeys.coach() });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminList(),
      });
      queryClient.removeQueries({
        queryKey: coachSessionsKeys.coachDetail(sessionId),
      });
      queryClient.removeQueries({
        queryKey: coachSessionsKeys.adminDetail(sessionId),
      });
    },
  });
}
