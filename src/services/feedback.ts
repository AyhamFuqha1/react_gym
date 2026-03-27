import api from "./api";

export type FeedbackType = "equipment" | "trainer" | "suggestion";

export interface FeedbackDetails {
  name?: string;
  priority?: string;
  status?: string;
  rating?: number;
  note?: string;
}

export interface FeedbackItem {
  id: number;
  user_name: string;
  type: FeedbackType;
  content: string;
  created_at: string;
  details?: FeedbackDetails;
}

export interface FeedbackDashboardResponse {
  current_page: number;
  data: FeedbackItem[];
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

export async function getFeedbackDashboard() {
  const response = await api.get<FeedbackDashboardResponse>("/feedback/dashboard");
  return response.data;
}