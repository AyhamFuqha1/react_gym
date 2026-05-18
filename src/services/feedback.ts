import api from "./api";

export type FeedbackType = "equipment" | "trainer" | "rating" | "suggestion";

export interface FeedbackDetails {
  name?: string;
  equipment_name?: string;
  priority?: string;
  status?: string;
  rating?: number;
  note?: string;
  trainer_id?: number;
  trainer_name?: string | null;
  trainer_email?: string | null;
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

export interface UpdateFeedbackPayload {
  type?: FeedbackType;
  content?: string;
  equipment_name?: string;
  priority?: string;
  status?: string;
  trainer_id?: number;
  rating?: number;
}

export interface FeedbackMutationResponse {
  message: string;
  data?: FeedbackItem;
}

export async function getFeedbackDashboard() {
  const response = await api.get<FeedbackDashboardResponse>("/feedback/dashboard");
  return response.data;
}

export async function updateFeedback(
  id: number,
  payload: UpdateFeedbackPayload
) {
  const response = await api.put<FeedbackMutationResponse>(
    `/feedback/${id}`,
    payload
  );
  return response.data;
}

export async function deleteFeedback(id: number) {
  const response = await api.delete<FeedbackMutationResponse>(`/feedback/${id}`);
  return response.data;
}
