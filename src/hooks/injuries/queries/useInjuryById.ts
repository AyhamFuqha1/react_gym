import { useQuery } from "@tanstack/react-query";
import { getInjuryById } from "../../../services/injuries";
import { injuriesKeys } from "../keys";

export function useInjuryById(id: number | null, enabled = true) {
  return useQuery({
    queryKey: injuriesKeys.detail(id ?? 0),
    queryFn: () => getInjuryById(id as number),
    enabled: enabled && id !== null,
  });
}