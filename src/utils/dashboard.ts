import type { DashboardResponse } from "../services/dashboard";
import {
  Users,
  Wrench,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type DashboardStatCard = {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend: string;
};

export function formatCurrency(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return `${value.toFixed(2)}`;
}

export function formatLastUpdated(value?: string) {
  if (!value) return "Live system snapshot";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "Live system snapshot";

  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatWeekLabel(weekNumber: number) {
  const weekAsString = String(weekNumber);
  if (weekAsString.length >= 2) {
    return `W${weekAsString.slice(-2)}`;
  }
  return `W${weekAsString}`;
}

export function capitalizeStatus(value: string) {
  return value.replace(/_/g, " ");
}

export function buildDashboardStatCards(
  dashboardStats: DashboardResponse | null
): DashboardStatCard[] {
  const totalMembers = dashboardStats?.totalMembers ?? 0;
  const equipmentIssues = dashboardStats?.equipmentIssues ?? 0;
  const activeSubscriptions = dashboardStats?.activeSubscriptions ?? 0;
  const monthlyRevenue = dashboardStats?.monthlyRevenue ?? 0;

  return [
    {
      label: "Total Members",
      value: String(totalMembers),
      badge: `${activeSubscriptions} Active`,
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: Users,
      iconBg: "bg-[#E6F4F1]",
      iconColor: "text-[#0D7D6D]",
      trend:
        totalMembers > 0
          ? `${activeSubscriptions} active subscriptions right now`
          : "No members available yet",
    },
    {
      label: "Equipment Issues",
      value: String(equipmentIssues),
      badge:
        equipmentIssues > 0 ? `${equipmentIssues} Pending` : "All Clear",
      badgeColor:
        equipmentIssues > 0
          ? "bg-red-50 text-red-600 border-red-100"
          : "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: Wrench,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      trend:
        equipmentIssues > 0
          ? "Recent issues need review"
          : "No open equipment issues",
    },
    {
      label: "Active Subscriptions",
      value: String(activeSubscriptions),
      badge:
        totalMembers > 0
          ? `${Math.round((activeSubscriptions / totalMembers) * 100)}%`
          : "0%",
      badgeColor: "bg-amber-50 text-amber-600 border-amber-100",
      icon: Star,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      trend:
        totalMembers > 0
          ? `${activeSubscriptions} of ${totalMembers} members are active`
          : "No active subscriptions yet",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      badge: "This Month",
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend:
        monthlyRevenue > 0
          ? "Revenue collected this month"
          : "No revenue recorded this month",
    },
  ];
}

export function buildSubscriptionsChartData(
  dashboardStats: DashboardResponse | null
) {
  return (dashboardStats?.subscriptionsByDay ?? []).map((item) => ({
    label: formatShortDayLabel(item.date),
    total: item.total,
    fullDate: item.date,
  }));
}

export function buildWeeklySubscriptionsChartData(
  dashboardStats: DashboardResponse | null
) {
  return (dashboardStats?.weeklySubscriptions ?? []).map((item) => ({
    label: formatWeekLabel(item.week),
    total: item.users_count,
    week: item.week,
  }));
}

export function buildMemberActivityItems(
  dashboardStats: DashboardResponse | null
) {
  return [
    {
      label: "Total Members",
      value: dashboardStats?.totalMembers ?? 0,
      color: "bg-[#0D7D6D]",
      max: Math.max(dashboardStats?.totalMembers ?? 1, 1),
    },
    {
      label: "Active Subscriptions",
      value: dashboardStats?.activeSubscriptions ?? 0,
      color: "bg-amber-400",
      max: Math.max(dashboardStats?.totalMembers ?? 1, 1),
    },
    {
      label: "Equipment Issues",
      value: dashboardStats?.equipmentIssues ?? 0,
      color: "bg-purple-400",
      max: Math.max(dashboardStats?.totalMembers ?? 1, 1),
    },
  ];
}