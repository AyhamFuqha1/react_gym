export type RequestTabType = "new" | "modifications";

export interface PlanExercise {
  exerciseId: number;
  name: string;
  muscleGroup: string | null;
  difficulty: string;
  sets: number;
  reps: string;
  restSeconds: number;
  dayNumber: number;
}

export interface PlanWorkoutDay {
  day: number;
  title: string;
  exercises: PlanExercise[];
}

export interface PendingTrainingPlanItem {
  id: number;
  name: string;
  description: string | null;
  status: "pending";
  generatedDate: string | null;
  userName: string;
  userAvatar: string;
  userGoal: string;
  userLevel: string;
  durationLabel: string;
  daysPerWeek: number;
  workouts: PlanWorkoutDay[];
}

export interface ModificationRequestItem {
  id: number;
  planId: number;
  version: number;
  requestDate: string | null;
  status: "pending" | "edited" | "approved";
  userId: number | null;
  userName: string;
  userAvatar: string;
  userRequest: string;
  changesSummary: string[];
  modifiedPlan: {
    duration: string;
    schedule: PlanWorkoutDay[];
  };
  recommendations: string[];
}

export interface SearchExerciseItem {
  id: number;
  name: string;
  difficulty: string;
  muscleGroup: string | null;
}

function toTitleCase(value: string): string {
  if (!value) return "";
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildAvatar(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function guessWorkoutTitle(
  day: number,
  exercises: Array<{ muscleGroup?: string | null }>
): string {
  const groups = Array.from(
    new Set(
      exercises
        .map((item) => item.muscleGroup)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (groups.length === 0) return `Day ${day} Workout`;
  if (groups.length === 1) return toTitleCase(groups[0]);
  if (groups.length === 2) {
    return `${toTitleCase(groups[0])} & ${toTitleCase(groups[1])}`;
  }
  return `Day ${day} Workout`;
}

export function normalizePendingTrainingPlansResponse(raw: any): PendingTrainingPlanItem[] {
  const items = Array.isArray(raw?.data) ? raw.data : [];

  return items.map((item: any) => {
    const rawExercises = Array.isArray(item?.exercises) ? item.exercises : [];

    const exercises: PlanExercise[] = rawExercises.map((exercise: any) => ({
      exerciseId: Number(exercise?.id ?? exercise?.exercise_id ?? 0),
      name: String(exercise?.name ?? "Exercise"),
      muscleGroup: exercise?.muscle_group ? String(exercise.muscle_group) : null,
      difficulty: String(exercise?.difficulty ?? "beginner"),
      sets: Number(exercise?.sets ?? 0),
      reps: String(exercise?.reps ?? ""),
      restSeconds: Number(exercise?.rest_seconds ?? 0),
      dayNumber: Number(exercise?.day_number ?? 1),
    }));

    const groupedByDay = new Map<number, PlanExercise[]>();
    exercises.forEach((exercise) => {
      const day = exercise.dayNumber || 1;
      const list = groupedByDay.get(day) ?? [];
      list.push(exercise);
      groupedByDay.set(day, list);
    });

    const workouts: PlanWorkoutDay[] = Array.from(groupedByDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, dayExercises]) => ({
        day,
        title: guessWorkoutTitle(day, dayExercises),
        exercises: dayExercises,
      }));

    return {
      id: Number(item?.id ?? 0),
      name: String(item?.name ?? "Pending Training Plan"),
      description: item?.description ? String(item.description) : null,
      status: "pending",
      generatedDate: null,
      userName: "Pending Plan",
      userAvatar: "PP",
      userGoal: "Training Plan",
      userLevel: "AI Generated",
      durationLabel: `${workouts.length || 1} day plan`,
      daysPerWeek: workouts.length || 1,
      workouts,
    };
  });
}

export function normalizeTrainingModificationRequestsResponse(
  raw: any
): ModificationRequestItem[] {
  const sourceItems = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
      ? raw
      : [];

  return sourceItems.map((item: any) => {
    const userName =
      item?.user_name ||
      item?.user?.name ||
      item?.member_name ||
      `User #${item?.user_id ?? "Unknown"}`;

    const modifiedPlanSource =
      item?.modified_plan?.plan_data?.schedule ||
      item?.modified_plan?.schedule ||
      item?.plan_data?.schedule ||
      item?.schedule ||
      [];

    const schedule: PlanWorkoutDay[] = (
      Array.isArray(modifiedPlanSource) ? modifiedPlanSource : []
    ).map((dayItem: any, index: number) => {
      const dayNumber = Number(dayItem?.day ?? dayItem?.day_number ?? index + 1);

      const exercises: PlanExercise[] = (
        Array.isArray(dayItem?.exercises) ? dayItem.exercises : []
      ).map((exercise: any) => ({
        exerciseId: Number(exercise?.exercise_id ?? exercise?.id ?? 0),
        name: String(exercise?.name ?? "Exercise"),
        muscleGroup: exercise?.muscle_group ? String(exercise.muscle_group) : null,
        difficulty: String(exercise?.difficulty ?? "beginner"),
        sets: Number(exercise?.sets ?? 0),
        reps: String(exercise?.reps ?? ""),
        restSeconds: Number(exercise?.rest_seconds ?? 0),
        dayNumber,
      }));

      return {
        day: dayNumber,
        title: guessWorkoutTitle(dayNumber, exercises),
        exercises,
      };
    });

    const rawDurationWeeks =
      item?.modified_plan?.duration_weeks ??
      item?.duration_weeks ??
      item?.user_feedback?.duration_weeks;

    const duration =
      rawDurationWeeks != null
        ? `${rawDurationWeeks} Weeks`
        : schedule.length > 0
          ? `${schedule.length} day${schedule.length > 1 ? "s" : ""}`
          : "Not specified";

    return {
      id: Number(item?.id ?? item?.modification_request_id ?? 0),
      planId: Number(
        item?.modified_plan?.plan_id ??
          item?.plan_id ??
          item?.current_plan_id ??
          item?.program_version_id ??
          0
      ),
      version: Number(
        item?.modified_plan?.version ??
          item?.version ??
          item?.program_version_id ??
          1
      ),
      requestDate: item?.created_at ? String(item.created_at) : null,
      status: String(item?.status ?? "pending").toLowerCase() as
        | "pending"
        | "edited"
        | "approved",
      userId: item?.user_id != null ? Number(item.user_id) : null,
      userName: String(userName),
      userAvatar: buildAvatar(String(userName)),
      userRequest: String(
        item?.user_feedback?.modification_request ??
          item?.user_request ??
          item?.modification_request ??
          "Training modification request"
      ),
      changesSummary: Array.isArray(item?.changes_summary)
        ? item.changes_summary.map((entry: any) => String(entry))
        : [],
      modifiedPlan: {
        duration,
        schedule,
      },
      recommendations: Array.isArray(item?.recommendations)
        ? item.recommendations.map((entry: any) => String(entry))
        : [],
    };
  });
}

export function normalizeSearchExercisesResponse(raw: any): SearchExerciseItem[] {
  const results = Array.isArray(raw?.results) ? raw.results : [];

  return results.map((item: any) => ({
    id: Number(item?.metadata?.id ?? 0),
    name: String(item?.metadata?.name ?? "Exercise"),
    difficulty: String(item?.metadata?.difficulty ?? "beginner"),
    muscleGroup: item?.metadata?.muscle_group
      ? String(item.metadata.muscle_group)
      : null,
  }));
}

export function buildPendingPlanSavePayload(plan: PendingTrainingPlanItem) {
  return {
    plan_id: plan.id,
    name: plan.name,
    description: plan.description ?? "edited pending training plan",
    schedule: plan.workouts.map((workout) => ({
      day_number: workout.day,
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.exerciseId,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.restSeconds,
      })),
    })),
  };
}

export function buildApproveModificationPayload(request: ModificationRequestItem) {
  return {
    user_id: request.userId ?? 1,
    plan_data: {
      version: request.version,
      duration_weeks: Number.parseInt(request.modifiedPlan.duration, 10) || 4,
      schedule: request.modifiedPlan.schedule.map((day) => ({
        day: day.day,
        exercises: day.exercises.map((exercise) => ({
          exercise_id: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.restSeconds,
          difficulty: exercise.difficulty,
        })),
      })),
    },
  };
}

export function updatePendingPlanExercise(
  plans: PendingTrainingPlanItem[],
  planId: number,
  dayNumber: number,
  exerciseId: number,
  patch: Partial<PlanExercise>
): PendingTrainingPlanItem[] {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    return {
      ...plan,
      workouts: plan.workouts.map((workout) => {
        if (workout.day !== dayNumber) return workout;

        return {
          ...workout,
          exercises: workout.exercises.map((exercise) =>
            exercise.exerciseId === exerciseId
              ? { ...exercise, ...patch }
              : exercise
          ),
        };
      }),
    };
  });
}

export function addExerciseToPendingPlanDay(
  plans: PendingTrainingPlanItem[],
  planId: number,
  dayNumber: number,
  exercise: SearchExerciseItem
): PendingTrainingPlanItem[] {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    return {
      ...plan,
      workouts: plan.workouts.map((workout) => {
        if (workout.day !== dayNumber) return workout;

        const exists = workout.exercises.some(
          (item) => item.exerciseId === exercise.id
        );
        if (exists) return workout;

        return {
          ...workout,
          exercises: [
            ...workout.exercises,
            {
              exerciseId: exercise.id,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              difficulty: exercise.difficulty,
              sets: 3,
              reps: "8-12",
              restSeconds: 60,
              dayNumber,
            },
          ],
        };
      }),
    };
  });
}

export function removeExerciseFromPendingPlanDay(
  plans: PendingTrainingPlanItem[],
  planId: number,
  dayNumber: number,
  exerciseId: number
): PendingTrainingPlanItem[] {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    return {
      ...plan,
      workouts: plan.workouts.map((workout) => {
        if (workout.day !== dayNumber) return workout;

        return {
          ...workout,
          exercises: workout.exercises.filter(
            (exercise) => exercise.exerciseId !== exerciseId
          ),
        };
      }),
    };
  });
}