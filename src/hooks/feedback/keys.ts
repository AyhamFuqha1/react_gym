export const feedbackKeys = {
  all: ["feedback"] as const,
  dashboard: () => [...feedbackKeys.all, "dashboard"] as const,
};