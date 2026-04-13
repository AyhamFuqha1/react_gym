export const plansKeys = {
  all: ["plans"] as const,
  lists: () => [...plansKeys.all, "list"] as const,
  list: () => [...plansKeys.lists()] as const,
  details: () => [...plansKeys.all, "details"] as const,
  detail: (planId: number) => [...plansKeys.details(), planId] as const,
};