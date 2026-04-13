import { useQuery } from "@tanstack/react-query";
import { getGeneralExerciseById } from "../../../services/generalExercises";
import { generalExercisesKeys } from "../keys";

export function useGeneralExerciseById(id: number, enabled = true) {
  return useQuery({
    queryKey: generalExercisesKeys.detail(id),
    queryFn: () => getGeneralExerciseById(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
    staleTime: 60 * 1000,
  });
}