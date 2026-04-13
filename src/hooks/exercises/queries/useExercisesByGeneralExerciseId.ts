import { useQuery } from "@tanstack/react-query";
import { getExercisesByGeneralExerciseId } from "../../../services/exercises";
import { exercisesKeys } from "../keys";

export function useExercisesByGeneralExerciseId(
  generalExerciseId: number,
  enabled = true
) {
  return useQuery({
    queryKey: exercisesKeys.byCategory(generalExerciseId),
    queryFn: () => getExercisesByGeneralExerciseId(generalExerciseId),
    enabled: enabled && Number.isFinite(generalExerciseId) && generalExerciseId > 0,
    staleTime: 60 * 1000,
  });
}