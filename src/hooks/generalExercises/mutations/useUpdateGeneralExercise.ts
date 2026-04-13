import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateGeneralExercise,
  type UpdateGeneralExercisePayload,
} from "../../../services/generalExercises";
import { generalExercisesKeys } from "../keys";

export function useUpdateGeneralExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateGeneralExercisePayload;
    }) => updateGeneralExercise(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: generalExercisesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: generalExercisesKeys.detail(variables.id),
      });
    },
  });
}