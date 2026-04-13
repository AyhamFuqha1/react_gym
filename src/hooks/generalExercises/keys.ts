export const generalExercisesKeys = {
  all: ["general-exercises"] as const,
  lists: () => [...generalExercisesKeys.all, "list"] as const,
  list: () => [...generalExercisesKeys.lists()] as const,
  details: () => [...generalExercisesKeys.all, "detail"] as const,
  detail: (id: number) => [...generalExercisesKeys.details(), id] as const,
};