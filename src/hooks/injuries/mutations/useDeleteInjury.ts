import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInjury } from "../../../services/injuries";
import { injuriesKeys } from "../keys";

export function useDeleteInjury() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteInjury(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: injuriesKeys.dashboard(),
      });
    },
  });
}