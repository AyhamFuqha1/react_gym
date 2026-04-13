export const newsKeys = {
  all: ["news"] as const,

  lists: () => [...newsKeys.all, "lists"] as const,
  list: (page: number, perPage: number) =>
    [...newsKeys.lists(), page, perPage] as const,

  stats: () => [...newsKeys.all, "stats"] as const,

  details: () => [...newsKeys.all, "details"] as const,
  detail: (id: number) => [...newsKeys.details(), id] as const,
};