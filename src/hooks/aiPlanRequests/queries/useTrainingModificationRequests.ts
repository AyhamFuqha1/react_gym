import { useQuery } from "@tanstack/react-query";
import { getTrainingModificationRequests } from "../../../services/aiPlanRequests";

export function useTrainingModificationRequests() {
  return useQuery({
    queryKey: ["training-modification-requests"],
    queryFn: getTrainingModificationRequests,
  });
}