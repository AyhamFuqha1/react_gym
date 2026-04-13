import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExercise, type ExercisePayload } from "../../../services/exercises";
import { exercisesKeys } from "../keys";

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExercisePayload) => createExercise(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.byCategory(variables.general_exercise_id),
      });
    },
  });
}