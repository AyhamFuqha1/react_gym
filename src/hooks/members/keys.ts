export const membersKeys = {
  all: ["members"] as const,
  list: () => [...membersKeys.all, "list"] as const,
};