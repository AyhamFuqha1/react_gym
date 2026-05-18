import { useQuery } from "@tanstack/react-query";
import { getAdminSessions } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useCoachSessions(coachId: number | null) {
  return useQuery({
    queryKey: coachSessionsKeys.coachList(coachId),
    queryFn: async () => {
      if (coachId === null) {
        return [];
      }

      const sessions = await getAdminSessions();
      return sessions.filter((session) => Number(session.coach_id) === coachId);
    },
    enabled: coachId !== null,
    staleTime: 60 * 1000,
  });
}
