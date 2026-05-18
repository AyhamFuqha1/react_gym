import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCancelSession } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useAdminCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => adminCancelSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: coachSessionsKeys.coach() });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminList(),
      });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminDetail(sessionId),
      });
    },
  });
}
