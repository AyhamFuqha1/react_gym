import { useQuery } from "@tanstack/react-query";
import { getCoaches } from "../../../services/coaches";
import { coachesKeys } from "../keys";

export function useCoaches() {
  return useQuery({
    queryKey: coachesKeys.list(),
    queryFn: getCoaches,
  });
}
