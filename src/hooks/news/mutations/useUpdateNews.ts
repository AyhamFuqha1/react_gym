import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateNews,
  type UpdateNewsPayload,
} from "../../../services/news";
import { newsKeys } from "../keys";

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateNewsPayload;
    }) => updateNews(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: newsKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: newsKeys.detail(variables.id),
      });
    },
  });
}