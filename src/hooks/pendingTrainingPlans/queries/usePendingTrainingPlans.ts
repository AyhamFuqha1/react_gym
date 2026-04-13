import { useQuery } from "@tanstack/react-query";
import { getPendingTrainingPlans } from "../../../services/pendingTrainingPlans";

export function usePendingTrainingPlans() {
  return useQuery({
    queryKey: ["pending-training-plans"],
    queryFn: getPendingTrainingPlans,
  });
}