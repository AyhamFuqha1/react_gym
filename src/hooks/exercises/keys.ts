export const exercisesKeys = {
  all: ["exercises"] as const,
  byCategory: (generalExerciseId: number) =>
    [...exercisesKeys.all, "category", generalExerciseId] as const,
  details: () => [...exercisesKeys.all, "detail"] as const,
  detail: (id: number) => [...exercisesKeys.details(), id] as const,
};