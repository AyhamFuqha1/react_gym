export function normalizeSeverity(value: string): "low" | "medium" | "high" {
  const normalized = value?.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

export function normalizeStatus(value: string): "active" | "inactive" {
  const normalized = value?.toLowerCase();
  return normalized === "inactive" ? "inactive" : "active";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getSafeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}