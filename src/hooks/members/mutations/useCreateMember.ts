import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMember,
  type CreateMemberPayload,
} from "../../../services/members";
import { membersKeys } from "../keys";

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMemberPayload) => createMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.list() });
    },
  });
}