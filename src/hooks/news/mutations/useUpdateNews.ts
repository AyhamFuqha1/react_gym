import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateNews,
  type UpdateNewsPayload,
  type NewsItem,
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

    onSuccess: (updatedNews, variables) => {
      const newItem = updatedNews?.data ?? updatedNews;

      queryClient.setQueryData<any>(newsKeys.all, (oldData: any) => {
        if (!oldData) return oldData;

        if (Array.isArray(oldData)) {
          return oldData.map((item) =>
            item.id === variables.id ? { ...item, ...newItem } : item
          );
        }

        if (Array.isArray(oldData?.data)) {
          return {
            ...oldData,
            data: oldData.data.map((item: any) =>
              item.id === variables.id ? { ...item, ...newItem } : item
            ),
          };
        }

        return oldData;
      });

      queryClient.setQueryData<NewsItem>(newsKeys.detail(variables.id), newItem);
    },
  });
}