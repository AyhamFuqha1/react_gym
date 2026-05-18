export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatStatusLabel(status: string) {
  if (status === "in_progress") return "In Progress";
  if (status === "pending") return "Pending";
  if (status === "resolved") return "Resolved";
  if (status === "reviewed") return "Under Review";
  if (status === "implemented") return "Resolved";
  if (status === "under_review") return "Under Review";
  return status.replace(/_/g, " ");
}
