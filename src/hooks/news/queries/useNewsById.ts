import { useQuery } from "@tanstack/react-query";
import { getNewsById } from "../../../services/news";
import { newsKeys } from "../keys";

export function useNewsById(id: number | null, enabled = true) {
  return useQuery({
    queryKey: newsKeys.detail(id ?? 0),
    queryFn: () => getNewsById(id as number),
    enabled: enabled && id !== null,
  });
}