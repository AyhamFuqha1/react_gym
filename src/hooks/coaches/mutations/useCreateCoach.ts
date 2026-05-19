import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCoach,
  type CreateCoachPayload,
} from "../../../services/coaches";
import { coachesKeys } from "../keys";

export function useCreateCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoachPayload) => createCoach(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachesKeys.list() });
    },
  });
}
