import api from "./api";

export interface DashboardSubscriptionByDayItem {
  date: string;
  total: number;
}

export interface DashboardRecentIssueItem {
  id: number;
  feedback_id: number | null;
  equipment_name: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface DashboardWeeklySubscriptionItem {
  week: number;
  users_count: number;
}

export interface DashboardResponse {
  totalMembers: number;
  activeSubscriptions: number;
  equipmentIssues: number;
  monthlyRevenue: number;
  subscriptionsByDay: DashboardSubscriptionByDayItem[];
  recentIssues: DashboardRecentIssueItem[];
  weeklySubscriptions: DashboardWeeklySubscriptionItem[];
  lastUpdated: string;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

export async function getAdminDashboard(): Promise<DashboardResponse> {
  const response = await api.get("/dashboard");
  const data = response.data ?? {};

  return {
    totalMembers: toNumber(data.totalMembers, 0),
    activeSubscriptions: toNumber(data.activeSubscriptions, 0),
    equipmentIssues: toNumber(data.equmont, 0),
    monthlyRevenue: toNumber(data.monyInMonth, 0),
    subscriptionsByDay: Array.isArray(data.subscriptionsByDay)
      ? data.subscriptionsByDay.map((item: any) => ({
          date: String(item.date ?? ""),
          total: toNumber(item.total, 0),
        }))
      : [],
    recentIssues: Array.isArray(data.RecentIssues)
      ? data.RecentIssues.map((item: any) => ({
          id: toNumber(item.id, 0),
          feedback_id: item.feedback_id ?? null,
          equipment_name: String(item.equipment_name ?? ""),
          priority: String(item.priority ?? "low"),
          status: String(item.status ?? "pending"),
          created_at: String(item.created_at ?? ""),
          updated_at: item.updated_at ?? null,
        }))
      : [],
    weeklySubscriptions: Array.isArray(data.weeklySubscriptions)
      ? data.weeklySubscriptions.map((item: any) => ({
          week: toNumber(item.week, 0),
          users_count: toNumber(item.users_count, 0),
        }))
      : [],
    lastUpdated: String(data.last_updated ?? ""),
  };
}