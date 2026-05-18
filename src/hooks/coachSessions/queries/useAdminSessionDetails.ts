import { useQuery } from "@tanstack/react-query";
import { getAdminSessionDetails } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useAdminSessionDetails(
  sessionId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: coachSessionsKeys.adminDetail(sessionId ?? 0),
    queryFn: () => getAdminSessionDetails(sessionId as number),
    enabled: enabled && sessionId !== null,
  });
}
