import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runSmartSync } from "../../../services/aiSync";
import { coachDashboardKeys } from "../keys";

export function useCoachSmartSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runSmartSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachDashboardKeys.dashboard() });
    },
  });
}