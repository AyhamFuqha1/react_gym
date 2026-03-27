import api from "./api";

export type NewsStatus = "public" | "draft" | "deleted";

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  status: NewsStatus;
  author_name: string | null;
  formatted_date: string | null;
}

export interface NewsPaginationData {
  current_page: number;
  data: NewsItem[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface GetNewsResponse {
  status: string;
  data: NewsPaginationData;
}

export interface NewsStats {
  published: number;
  drafts: number;
  total_views: number;
}

export interface GetNewsStatsResponse {
  status: string;
  data: NewsStats;
}

export interface CreateNewsPayload {
  user_id: number;
  title: string;
  content: string;
  status: "public" | "draft";
}

export async function getNews(perPage = 10) {
  const response = await api.get<GetNewsResponse>("/news", {
    params: { per_page: perPage },
  });
  return response.data;
}

export async function getNewsStats() {
  const response = await api.get<GetNewsStatsResponse>("/news/stats");
  return response.data;
}

export async function createNews(payload: CreateNewsPayload) {
  const response = await api.post("/news", payload);
  return response.data;
}

export async function deleteNews(id: number) {
  const response = await api.delete(`/news/${id}`);
  return response.data;
}