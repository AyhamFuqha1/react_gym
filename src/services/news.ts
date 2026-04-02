import api from "./api";

export type NewsStatus = "public" | "draft" | "deleted";

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  status: NewsStatus;
  author_name: string | null;
  formatted_date: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  is_expired?: boolean;
  remaining_days?: number | null;
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
  expires_at?: string | null;
}

export interface SingleNewsResponse {
  status: string;
  data: NewsItem;
}

export interface UpdateNewsPayload {
  title?: string;
  content?: string;
  status?: NewsStatus;
  published_at?: string | null;
  expires_at?: string | null;
}

export interface UpdateNewsResponse {
  status: string;
  message: string;
  data: NewsItem;
}

export async function getNews(page = 1, perPage = 10) {
  const response = await api.get<GetNewsResponse>("/news", {
    params: {
      page,
      per_page: perPage,
    },
  });
  return response.data;
}

export async function getNewsStats() {
  const response = await api.get<GetNewsStatsResponse>("/news/stats");
  return response.data;
}

export async function getNewsById(id: number) {
  const response = await api.get<SingleNewsResponse>(`/news/${id}`);
  return response.data;
}

export async function createNews(payload: CreateNewsPayload) {
  const response = await api.post("/news", payload);
  return response.data;
}

export async function updateNews(id: number, payload: UpdateNewsPayload) {
  const response = await api.put<UpdateNewsResponse>(`/news/${id}`, payload);
  return response.data;
}

export async function deleteNews(id: number) {
  const response = await api.delete(`/news/${id}`);
  return response.data;
}