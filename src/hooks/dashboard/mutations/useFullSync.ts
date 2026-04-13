import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runFullSync } from "../../../services/aiSync";
import { dashboardKeys } from "../keys";

export function useFullSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runFullSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.admin() });
    },
  });
}