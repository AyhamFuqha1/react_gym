import api from "./api";

export interface MemberItem {
  id: number;
  user_name: string;
  plan_name: string | null;
  status: string | null;
  end_date: string | null;
}

export interface MembersStats {
  total: number;
  active: number;
  not_active: number;
}

export interface MembersResponse {
  stats: MembersStats;
  members: MemberItem[];
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  role_id: number;
}

export interface MemberOverviewResponse {
  name: string;
  email: string;
  gender: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal_type: string | null;
  target_weight: string | number | null;
}

export interface MemberNutritionFood {
  id: number;
  general_nutrition_id: number;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  serving_size: string | null;
  image: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MemberNutritionUser {
  id: number;
  name: string;
  email: string;
  number_phone: string | null;
  fingerprint: string | null;
  email_verified_at: string | null;
  role_id: number;
  status: string;
  number_day?: number;
  created_at?: string;
  updated_at?: string;
  liked_foods: MemberNutritionFood[];
  disliked_foods: MemberNutritionFood[];
  user_nutrition_plan_active: any[];
}

export interface MemberNutritionResponse {
  user: MemberNutritionUser;
  available_foods: MemberNutritionFood[];
}

export interface PlanOption {
  id: number;
  name: string;
  duration_days: number;
  price: number | string;
  is_active: boolean | number;
  user_id?: number;
}

export interface RenewMemberSubscriptionPayload {
  user_id: number;
  plan_id: number;
  discount: number;
  start_date: string;
}

export async function getMembers() {
  const response = await api.get<MembersResponse>("/members");
  return response.data;
}

export async function createMember(payload: CreateMemberPayload) {
  const response = await api.post("/members", payload);
  return response.data;
}

export async function getMemberById(id: number) {
  const response = await api.get(`/members/${id}`);
  return response.data;
}

export async function getMemberOverview(id: number) {
  const response = await api.get<MemberOverviewResponse>(`/members/overView/${id}`);
  return response.data;
}

export async function getMemberNutrition(id: number) {
  const response = await api.get<MemberNutritionResponse>(`/members/nutrition/${id}`);
  return response.data;
}

export async function getPlanOptions() {
  const response = await api.get<{ success: boolean; data: PlanOption[] }>("/plans");
  return response.data?.data || [];
}

export async function renewMemberSubscription(payload: RenewMemberSubscriptionPayload) {
  const response = await api.post("/members/ReNewSubscription", payload);
  return response.data;
}

export async function freezeMemberSubscription(memberId: number) {
  const response = await api.post(`/members/subscription/freeze/${memberId}`);
  return response.data;
}

export async function resumeMemberSubscription(memberId: number) {
  const response = await api.post(`/members/subscription/resume/${memberId}`);
  return response.data;
}