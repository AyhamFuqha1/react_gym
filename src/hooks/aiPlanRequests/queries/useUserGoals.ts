import { useQuery } from "@tanstack/react-query";
import { getUserGoals } from "../../../services/userGoals";

export function useUserGoals() {
  return useQuery({
    queryKey: ["user-goals"],
    queryFn: getUserGoals,
    staleTime: 1000 * 60 * 5,
  });
}