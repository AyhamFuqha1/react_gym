export const coachesKeys = {
  all: ["coaches"] as const,
  list: () => [...coachesKeys.all, "list"] as const,
};
