import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelCoachSession } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useCancelCoachSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => cancelCoachSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: coachSessionsKeys.coach() });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminList(),
      });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.coachDetail(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminDetail(sessionId),
      });
    },
  });
}
