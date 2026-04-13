import { useQuery } from "@tanstack/react-query";
import { getNews } from "../../../services/news";
import { newsKeys } from "../keys";

export function useNews(page = 1, perPage = 10) {
  return useQuery({
    queryKey: newsKeys.list(page, perPage),
    queryFn: () => getNews(page, perPage),
  });
}