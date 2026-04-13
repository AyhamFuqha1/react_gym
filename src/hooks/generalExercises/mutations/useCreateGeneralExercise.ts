import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGeneralExercise,
  type CreateGeneralExercisePayload,
} from "../../../services/generalExercises";
import { generalExercisesKeys } from "../keys";

export function useCreateGeneralExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGeneralExercisePayload) =>
      createGeneralExercise(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generalExercisesKeys.lists() });
    },
  });
}