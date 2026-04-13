import { useQuery } from "@tanstack/react-query";
import { getMembers } from "../../../services/members";
import { membersKeys } from "../keys";

export function useMembers() {
  return useQuery({
    queryKey: membersKeys.list(),
    queryFn: getMembers,
  });
}