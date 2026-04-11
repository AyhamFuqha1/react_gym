export type TabKey = "overview" | "subscription" | "nutrition";

export type PlanFormState = {
  user_id: number;
  name: string;
  duration_days: string;
  price: string;
  is_active: boolean;
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "No end date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString();
}

export function capitalizeWords(value: string | null | undefined) {
  if (!value) return "N/A";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function createInitialPlanForm(userId: number): PlanFormState {
  return {
    user_id: userId,
    name: "",
    duration_days: "",
    price: "",
    is_active: true,
  };
}