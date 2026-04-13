import { useQuery } from "@tanstack/react-query";
import { getExerciseById } from "../../../services/exercises";
import { exercisesKeys } from "../keys";

export function useExerciseById(id: number, enabled = true) {
  return useQuery({
    queryKey: exercisesKeys.detail(id),
    queryFn: () => getExerciseById(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
    staleTime: 60 * 1000,
  });
}