import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNews } from "../../../services/news";
import { newsKeys } from "../keys";

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: newsKeys.all,
      });
    },
  });
}