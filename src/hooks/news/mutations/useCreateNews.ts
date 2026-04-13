import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createNews,
  type CreateNewsPayload,
} from "../../../services/news";
import { newsKeys } from "../keys";

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNewsPayload) => createNews(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: newsKeys.all,
      });
    },
  });
}