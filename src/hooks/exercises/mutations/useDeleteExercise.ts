import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExercise } from "../../../services/exercises";
import { exercisesKeys } from "../keys";

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      generalExerciseId,
    }: {
      id: number;
      generalExerciseId: number;
    }) => deleteExercise(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.byCategory(variables.generalExerciseId),
      });
      queryClient.removeQueries({
        queryKey: exercisesKeys.detail(variables.id),
      });
    },
  });
}