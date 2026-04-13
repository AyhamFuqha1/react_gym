export const dashboardKeys = {
  all: ["dashboard"] as const,
  admin: () => [...dashboardKeys.all, "admin"] as const,
  sync: () => [...dashboardKeys.all, "sync"] as const,
};