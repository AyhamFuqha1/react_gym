import type { MemberItem, MembersStats } from "../services/members";

export const avatarColors = [
  "from-[#0D7D6D] to-[#14B8A6]",
  "from-purple-500 to-purple-400",
  "from-blue-500 to-blue-400",
  "from-rose-500 to-rose-400",
  "from-amber-500 to-amber-400",
];

export const emptyStats: MembersStats = {
  total: 0,
  active: 0,
  not_active: 0,
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function formatDate(date: string | null) {
  if (!date) return "No end date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString();
}

export function getMemberStatus(member: MemberItem) {
  return (member.status || "unknown").toLowerCase();
}

export function filterAndSortMembers(
  members: MemberItem[],
  searchTerm: string,
  statusFilter: string,
  sortBy: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return [...members]
    .filter((member) => {
      const matchesSearch = member.user_name
        .toLowerCase()
        .includes(normalizedSearch);

      const normalizedStatus = getMemberStatus(member);

      const matchesFilter =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? normalizedStatus === "active"
          : normalizedStatus !== "active";

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.user_name.localeCompare(a.user_name);
        case "id-desc":
          return b.id - a.id;
        case "id-asc":
          return a.id - b.id;
        case "name-asc":
        default:
          return a.user_name.localeCompare(b.user_name);
      }
    });
}