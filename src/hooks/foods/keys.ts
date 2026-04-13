export const foodsKeys = {
  all: ["foods"] as const,
  lists: () => [...foodsKeys.all, "lists"] as const,
  list: () => [...foodsKeys.lists()] as const,
};