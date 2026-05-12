export function normalizeSeverity(
  value: string | null | undefined
): "mild" | "moderate" | "severe" {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "severe" || normalized === "high") return "severe";
  if (normalized === "moderate" || normalized === "medium") return "moderate";
  return "mild";
}

export function normalizeStatus(
  value: string | null | undefined
): "active" | "recovered" {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) return "active";
  return normalized === "active" ? "active" : "recovered";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatKey(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseJsonString(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    const parsed = parseJsonString(value);
    if (parsed !== value) return toDisplayString(parsed);
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayString(item))
      .filter(Boolean)
      .join("; ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = [
      "text",
      "message",
      "summary",
      "recommendation",
      "change",
      "description",
      "name",
      "title",
    ];

    for (const key of preferredKeys) {
      const preferred = toDisplayString(record[key]);
      if (preferred) return preferred;
    }

    return Object.entries(record)
      .map(([key, entry]) => {
        const displayValue = toDisplayString(entry);
        return displayValue ? `${formatKey(key)}: ${displayValue}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

export function getSafeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayString(item)).filter(Boolean);
  }

  const displayValue = toDisplayString(value);
  return displayValue ? [displayValue] : [];
}
