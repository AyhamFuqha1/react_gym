export const injuriesKeys = {
  all: ["injuries"] as const,

  dashboard: () => [...injuriesKeys.all, "dashboard"] as const,
  dashboardPage: (page: number) =>
    [...injuriesKeys.dashboard(), page] as const,

  details: () => [...injuriesKeys.all, "details"] as const,
  detail: (id: number) => [...injuriesKeys.details(), id] as const,
};
