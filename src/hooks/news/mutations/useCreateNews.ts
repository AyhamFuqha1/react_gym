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

    onSuccess: (createdNews) => {
      const newItem = createdNews?.data ?? createdNews;

      queryClient.setQueryData<any>(newsKeys.all, (oldData: any) => {
        if (!oldData) {
          return { data: [newItem] };
        }

        if (Array.isArray(oldData)) {
          return [newItem, ...oldData];
        }

        if (Array.isArray(oldData?.data)) {
          return {
            ...oldData,
            data: [newItem, ...oldData.data],
          };
        }

        return oldData;
      });
    },
  });
}