import { useQuery } from "@tanstack/react-query";
import { getGeneralExercises } from "../../../services/generalExercises";
import { generalExercisesKeys } from "../keys";

export function useGeneralExercises() {
  return useQuery({
    queryKey: generalExercisesKeys.list(),
    queryFn: getGeneralExercises,
    staleTime: 60 * 1000,
  });
}