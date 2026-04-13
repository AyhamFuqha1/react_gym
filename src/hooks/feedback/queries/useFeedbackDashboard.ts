import { useQuery } from "@tanstack/react-query";
import { getFeedbackDashboard } from "../../../services/feedback";
import { feedbackKeys } from "../keys";

export function useFeedbackDashboard() {
  return useQuery({
    queryKey: feedbackKeys.dashboard(),
    queryFn: getFeedbackDashboard,
    staleTime: 60 * 1000,
  });
}