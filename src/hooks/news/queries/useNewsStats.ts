import { useQuery } from "@tanstack/react-query";
import { getNewsStats } from "../../../services/news";
import { newsKeys } from "../keys";

export function useNewsStats() {
  return useQuery({
    queryKey: newsKeys.stats(),
    queryFn: getNewsStats,
  });
}