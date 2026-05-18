import { useQuery } from "@tanstack/react-query";
import { getAdminSessions } from "../../../services/coachSessions";
import { coachSessionsKeys } from "../keys";

export function useAdminSessions() {
  return useQuery({
    queryKey: coachSessionsKeys.adminList(),
    queryFn: getAdminSessions,
    staleTime: 60 * 1000,
  });
}
