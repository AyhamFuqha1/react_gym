import type { NewsItem } from "../services/news";

export function getExcerpt(content: string, maxLength = 90) {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength)}...`;
}

export function getStoredUserId() {
  const raw =
    localStorage.getItem("user_id") || sessionStorage.getItem("user_id");

  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getDateValue(date?: string | null) {
  if (!date) return 0;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDisplayDateTime(value?: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function getExpiryTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function isNewsExpired(item: NewsItem | null) {
  if (!item) return false;

  if (item.status === "deleted") return false;
  if (item.is_expired) return true;

  const expiryTime = getExpiryTime(item.expires_at);
  if (expiryTime == null) return false;

  return expiryTime <= Date.now();
}

export function getRemainingLabel(item: NewsItem | null) {
  if (!item) return "No expiry";
  if (item.status === "deleted") return "In trash";

  const expiryTime = getExpiryTime(item.expires_at);
  if (expiryTime == null) return "No expiry";

  const diffMs = expiryTime - Date.now();

  if (diffMs <= 0) return "Expired";

  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (totalMinutes < 60) {
    return `${totalMinutes} minute(s) left`;
  }

  if (totalHours < 24) {
    return `${totalHours} hour(s) left`;
  }

  return `${totalDays} day(s) left`;
}

export function getDisplayStatus(item: NewsItem | null) {
  if (!item) return "unknown";
  if (item.status === "deleted") return "deleted";
  if (isNewsExpired(item)) return "expired";
  return item.status;
}

export function toApiDateTime(value?: string) {
  if (!value) return null;
  return `${value.replace("T", " ")}:00`;
}