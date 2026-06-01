import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateInjury,
  type UpdateInjuryPayload,
} from "../../../services/injuries";
import { injuriesKeys } from "../keys";

export function useUpdateInjury() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateInjuryPayload;
    }) => updateInjury(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: injuriesKeys.dashboard(),
      });

      queryClient.invalidateQueries({
        queryKey: injuriesKeys.detail(variables.id),
      });
    },
  });
}
