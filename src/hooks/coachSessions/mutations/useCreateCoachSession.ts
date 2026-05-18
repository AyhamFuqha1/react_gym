import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCoachSession,
  type CreateCoachSessionPayload,
} from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useCreateCoachSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoachSessionPayload) =>
      createCoachSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSessionsKeys.coach() });
      queryClient.invalidateQueries({
        queryKey: coachSessionsKeys.adminList(),
      });
    },
  });
}
