import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createInjury,
  type CreateInjuryPayload,
} from "../../../services/injuries";
import { injuriesKeys } from "../keys";

export function useCreateInjury() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInjuryPayload) => createInjury(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: injuriesKeys.dashboard(),
      });
    },
  });
}
