import api from "./api";

export interface MemberItem {
  id: number;
  user_name: string;
  plan_name: string | null;
  status: string | null;
  end_date: string | null;
  remaining_days?: number | string | null;
  frozen_remaining_days?: number | string | null;
  frozen_at?: string | null;
  resumed_at?: string | null;
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
  subscription_status?: string | null;
  end_date?: string | null;
  number_day?: number | string | null;
  remaining_days?: number | string | null;
  frozen_remaining_days?: number | string | null;
  frozen_at?: string | null;
  resumed_at?: string | null;
  subscription?: unknown;
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

export type MemberDisplaySubscriptionStatus =
  | "active"
  | "frozen"
  | "expired"
  | "inactive"
  | "unknown";

function normalizeDateOnly(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;

  const parts = value.split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getSubscriptionRemainingDays(
  endDate: string | null | undefined
): number {
  if (!endDate) return 0;

  const end = parseDateOnly(endDate);
  if (!end) return 0;

  const today = normalizeDateOnly(new Date());
  const normalizedEnd = normalizeDateOnly(end);

  const diffDays =
    (normalizedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) return 0;

  return Math.floor(diffDays);
}

function toDayCount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);

  if (Number.isNaN(parsed)) return null;

  return Math.max(Math.floor(parsed), 0);
}

export function getSubscriptionDaysLeft({
  status,
  endDate,
  remainingDays,
  frozenRemainingDays,
}: {
  status: string | null | undefined;
  endDate: string | null | undefined;
  remainingDays?: number | string | null;
  frozenRemainingDays?: number | string | null;
}): number {
  const normalizedStatus = (status || "unknown").trim().toLowerCase();

  if (normalizedStatus === "frozen") {
    return (
      toDayCount(frozenRemainingDays) ??
      toDayCount(remainingDays) ??
      0
    );
  }

  if (normalizedStatus === "active") {
    return toDayCount(remainingDays) ?? getSubscriptionRemainingDays(endDate);
  }

  return toDayCount(remainingDays) ?? 0;
}

export function isSubscriptionExpired(
  endDate: string | null | undefined
): boolean {
  if (!endDate) return false;

  const end = parseDateOnly(endDate);
  if (!end) return false;

  const today = normalizeDateOnly(new Date());
  const normalizedEnd = normalizeDateOnly(end);

  return normalizedEnd.getTime() <= today.getTime();
}

export function getDisplaySubscriptionStatus(
  status: string | null | undefined,
  endDate: string | null | undefined,
  daysLeft?: number | string | null
): MemberDisplaySubscriptionStatus {
  const normalizedStatus = (status || "unknown").trim().toLowerCase();

  if (normalizedStatus === "frozen") return "frozen";
  if (normalizedStatus === "active" && (toDayCount(daysLeft) ?? 0) > 0) {
    return "active";
  }

  if (isSubscriptionExpired(endDate)) return "expired";

  if (normalizedStatus === "active") return "active";
  if (normalizedStatus === "inactive") return "inactive";
  if (normalizedStatus === "expired") return "expired";

  return "unknown";
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
  const response = await api.get<MemberOverviewResponse>(
    `/members/overView/${id}`
  );
  return response.data;
}

export async function getMemberNutrition(id: number) {
  const response = await api.get<MemberNutritionResponse>(
    `/members/nutrition/${id}`
  );
  return response.data;
}

export async function getPlanOptions() {
  const response = await api.get<{ success: boolean; data: PlanOption[] }>(
    "/plans"
  );
  return response.data?.data || [];
}

export async function renewMemberSubscription(
  payload: RenewMemberSubscriptionPayload
) {
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
