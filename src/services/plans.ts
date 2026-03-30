import api from "./api";

export interface PlanPayload {
  user_id: number;
  name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
}

export interface PlanResponseItem {
  id: number;
  user_id: number;
  name: string;
  duration_days: number;
  price: number | string;
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface PlansListResponse {
  success: boolean;
  data: PlanResponseItem[];
}

export interface SinglePlanResponse {
  success: boolean;
  data: PlanResponseItem;
}

export async function getPlans() {
  const response = await api.get<PlansListResponse>("/plans");
  return response.data;
}

export async function getPlanById(planId: number) {
  const response = await api.get<SinglePlanResponse>(`/plans/${planId}`);
  return response.data;
}

export async function createPlan(payload: PlanPayload) {
  const response = await api.post("/plans", payload);
  return response.data;
}

export async function updatePlan(planId: number, payload: PlanPayload) {
  const response = await api.put(`/plans/${planId}`, payload);
  return response.data;
}

export async function deletePlan(planId: number) {
  const response = await api.delete(`/plans/${planId}`);
  return response.data;
}