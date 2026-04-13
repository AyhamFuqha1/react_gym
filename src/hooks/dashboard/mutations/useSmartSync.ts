import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runSmartSync } from "../../../services/aiSync";
import { dashboardKeys } from "../keys";

export function useSmartSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runSmartSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.admin() });
    },
  });
}