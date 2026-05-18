import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRestoreSession } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useAdminRestoreSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => adminRestoreSession(sessionId),
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
