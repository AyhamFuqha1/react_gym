import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExercise, type ExercisePayload } from "../../../services/exercises";
import { exercisesKeys } from "../keys";

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      generalExerciseId,
    }: {
      id: number;
      payload: Partial<ExercisePayload>;
      generalExerciseId: number;
    }) => updateExercise(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.byCategory(variables.generalExerciseId),
      });
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(variables.id),
      });
    },
  });
}