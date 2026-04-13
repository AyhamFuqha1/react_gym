import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGeneralExercise } from "../../../services/generalExercises";
import { generalExercisesKeys } from "../keys";

export function useDeleteGeneralExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteGeneralExercise(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: generalExercisesKeys.lists() });
      queryClient.removeQueries({
        queryKey: generalExercisesKeys.detail(id),
      });
    },
  });
}