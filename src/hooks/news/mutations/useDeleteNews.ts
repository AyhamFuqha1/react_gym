import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNews } from "../../../services/news";
import { newsKeys } from "../keys";

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNews(id),

    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<any>(newsKeys.all, (oldData: any) => {
        if (!oldData) return oldData;

        if (Array.isArray(oldData)) {
          return oldData.filter((item) => item.id !== deletedId);
        }

        if (Array.isArray(oldData?.data)) {
          return {
            ...oldData,
            data: oldData.data.filter((item: any) => item.id !== deletedId),
          };
        }

        return oldData;
      });

      queryClient.removeQueries({
        queryKey: newsKeys.detail(deletedId),
      });
    },
  });
}