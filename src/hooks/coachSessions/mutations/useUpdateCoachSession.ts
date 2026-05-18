import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateCoachSession,
  type UpdateCoachSessionPayload,
} from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useUpdateCoachSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: number;
      payload: UpdateCoachSessionPayload;
    }) => updateCoachSession(sessionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: coachSessionsKeys.coach() });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminList(),
      });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.coachDetail(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminDetail(variables.sessionId),
      });
    },
  });
}
