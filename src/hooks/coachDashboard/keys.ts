export const coachDashboardKeys = {
  all: ["coach-dashboard"] as const,
  dashboard: () => [...coachDashboardKeys.all, "dashboard"] as const,
};