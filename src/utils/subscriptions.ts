import type { SubscriptionAdminItem, SubscriptionStatus } from "../services/subscriptions";

export type SubscriptionRow = {
  id: number;
  userName: string;
  userAvatar: string;
  createdBy: string | null;
  planName: string;
  durationDays: number;
  discount: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  raw: SubscriptionAdminItem;
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function mapSubscriptionToRow(item: SubscriptionAdminItem): SubscriptionRow {
  const userName = item.user?.name ?? `User ${item.user_id}`;

  return {
    id: item.id,
    userName,
    userAvatar: getInitials(userName),
    createdBy: item.creator?.name ?? null,
    planName: item.plan?.name ?? "—",
    durationDays: item.plan?.duration_days ?? 0,
    discount: item.discount ?? "0.00",
    startDate: item.start_date,
    endDate: item.end_date,
    status: item.status,
    raw: item,
  };
}