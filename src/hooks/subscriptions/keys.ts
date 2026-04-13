export const subscriptionsKeys = {
  all: ["subscriptions"] as const,
  admin: () => [...subscriptionsKeys.all, "admin"] as const,
};