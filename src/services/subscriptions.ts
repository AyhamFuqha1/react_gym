import  apiFetch  from "./api";

export type SubscriptionStatus = "active" | "expired" | "pending" | "frozen" | string;

export type SubscriptionAdminItem = {
  id: number;
  user_id: number;
  created_by: number | null;
  plan_id: number;
  discount: string;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  } | null;
  creator?: {
    id: number;
    name: string;
    role_id?: number;
    role?: {
      id: number;
      name: string;
    } | null;
  } | null;
  plan?: {
    id: number;
    duration_days: number;
    is_active: number;
    name: string;
  } | null;
};

export async function getSubscriptionsForAdmin(): Promise<SubscriptionAdminItem[]> {
  const response = await apiFetch("/subscriptionForAdmin");

  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}