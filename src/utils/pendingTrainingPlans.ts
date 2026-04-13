import type { SearchExerciseItem } from "./aiPlanRequests";

export type PendingTrainingPlanApiExercise = {
  id: number;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  difficulty: string;
  day_number: number;
};

export type PendingTrainingPlanApiItem = {
  id: number;
  name: string;
  description: string | null;
  exercises: PendingTrainingPlanApiExercise[];
};

export type PendingTrainingPlansApiResponse = {
  status: boolean;
  data: PendingTrainingPlanApiItem[];
};

export type PendingTrainingExerciseItem = {
  exerciseId: number;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  difficulty: string;
  dayNumber: number;
};

export type PendingTrainingPlanDay = {
  day: number;
  title: string;
  exercises: PendingTrainingExerciseItem[];
};

export type PendingPlanContext = {
  requestId: number | null;
  requestDate: string | null;
  userId: number | null;
  userName: string;
  userAvatar: string;
  userRequest: string;
  difficulty: string | null;
  painAreas: string[];
  likedExercises: string[];
  dislikedExercises: string[];
  changesSummary: string[];
  recommendations: string[];
  programName?: string | null;
  programLevel?: string | null;
  userEmail?: string | null;
};

export type PendingTrainingPlanItem = {
  id: number;
  name: string;
  description: string | null;
  schedule: PendingTrainingPlanDay[];
  totalDays: number;
  totalExercises: number;
  requestContext: PendingPlanContext | null;
};

export type ModificationRequestLite = {
  id: number;
  planId: number;
  version: number;
  requestDate: string | null;
  userId: number | null;
  userName: string;
  userAvatar: string;
  userRequest: string;
  changesSummary: string[];
  recommendations: string[];
  status: "pending" | "edited" | "approved";
};

function buildDayTitle(day: number) {
  return `Day ${day}`;
}

function normalizePlanName(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function tryExtractPlanIdFromName(value: string | null | undefined): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);

  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function matchModificationRequestToPendingPlan(
  plan: PendingTrainingPlanApiItem,
  requests: ModificationRequestLite[]
): ModificationRequestLite | null {
  if (!requests.length) return null;

  const exactById = requests.find((request) => request.planId === Number(plan.id));
  if (exactById) return exactById;

  const extractedId = tryExtractPlanIdFromName(plan.name);
  if (extractedId != null) {
    const byExtractedId = requests.find((request) => request.planId === extractedId);
    if (byExtractedId) return byExtractedId;
  }

  const normalizedName = normalizePlanName(plan.name);
  const byName = requests.find(
    (request) => normalizePlanName(String(request.planId)) === normalizedName
  );
  if (byName) return byName;

  return null;
}

export function normalizePendingTrainingPlansResponse(
  response: PendingTrainingPlansApiResponse | PendingTrainingPlanApiItem[] | unknown,
  modificationRequests: ModificationRequestLite[] = []
): PendingTrainingPlanItem[] {
  const rawPlans: PendingTrainingPlanApiItem[] = Array.isArray(response)
    ? response
    : Array.isArray((response as PendingTrainingPlansApiResponse)?.data)
    ? (response as PendingTrainingPlansApiResponse).data
    : [];

  return rawPlans.map((plan) => {
    const groupedByDay = new Map<number, PendingTrainingExerciseItem[]>();

    (plan.exercises ?? []).forEach((exercise: PendingTrainingPlanApiExercise) => {
      const dayNumber = Number(exercise.day_number ?? 1);

      if (!groupedByDay.has(dayNumber)) {
        groupedByDay.set(dayNumber, []);
      }

      groupedByDay.get(dayNumber)!.push({
        exerciseId: Number(exercise.id),
        name: String(exercise.name ?? "Exercise"),
        sets: Number(exercise.sets ?? 0),
        reps: String(exercise.reps ?? ""),
        restSeconds: Number(exercise.rest_seconds ?? 0),
        difficulty: String(exercise.difficulty ?? "beginner"),
        dayNumber,
      });
    });

    const schedule: PendingTrainingPlanDay[] = Array.from(groupedByDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, exercises]) => ({
        day,
        title: buildDayTitle(day),
        exercises,
      }));

    const matchedRequest = matchModificationRequestToPendingPlan(
      plan,
      modificationRequests
    );

    return {
      id: Number(plan.id),
      name: String(plan.name ?? `Plan ${plan.id}`),
      description: plan.description ?? null,
      schedule,
      totalDays: schedule.length,
      totalExercises: schedule.reduce((sum, day) => sum + day.exercises.length, 0),
      requestContext: matchedRequest
        ? {
            requestId: matchedRequest.id,
            requestDate: matchedRequest.requestDate,
            userId: matchedRequest.userId,
            userName: matchedRequest.userName,
            userAvatar: matchedRequest.userAvatar,
            userRequest: matchedRequest.userRequest,
            difficulty: null,
            painAreas: [],
            likedExercises: [],
            dislikedExercises: [],
            changesSummary: matchedRequest.changesSummary,
            recommendations: matchedRequest.recommendations,
            programName: null,
            programLevel: null,
            userEmail: null,
          }
        : null,
    };
  });
}

export function buildPendingPlanSavePayload(plan: PendingTrainingPlanItem) {
  return {
    plan_id: plan.id,
    name: plan.name,
    description: plan.description ?? null,
    schedule: plan.schedule.map((day) => ({
      day_number: day.day,
      exercises: day.exercises.map((exercise) => ({
        id: exercise.exerciseId,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.restSeconds,
      })),
    })),
  };
}

export function updatePendingPlanExercise(
  plans: PendingTrainingPlanItem[],
  planId: number,
  dayNumber: number,
  exerciseId: number,
  patch: Partial<Pick<PendingTrainingExerciseItem, "sets" | "reps" | "restSeconds">>
) {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    return {
      ...plan,
      schedule: plan.schedule.map((day) => {
        if (day.day !== dayNumber) return day;

        return {
          ...day,
          exercises: day.exercises.map((exercise) =>
            exercise.exerciseId !== exerciseId
              ? exercise
              : {
                  ...exercise,
                  ...patch,
                }
          ),
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
) {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    const updatedSchedule = plan.schedule
      .map((day) => {
        if (day.day !== dayNumber) return day;

        return {
          ...day,
          exercises: day.exercises.filter(
            (exercise) => exercise.exerciseId !== exerciseId
          ),
        };
      })
      .filter((day) => day.exercises.length > 0);

    return {
      ...plan,
      schedule: updatedSchedule,
      totalDays: updatedSchedule.length,
      totalExercises: updatedSchedule.reduce(
        (sum, day) => sum + day.exercises.length,
        0
      ),
    };
  });
}

export function addExerciseToPendingPlanDay(
  plans: PendingTrainingPlanItem[],
  planId: number,
  dayNumber: number,
  exercise: SearchExerciseItem
) {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    let dayFound = false;

    const updatedSchedule = plan.schedule.map((day) => {
      if (day.day !== dayNumber) return day;

      dayFound = true;

      const alreadyExists = day.exercises.some(
        (item) => item.exerciseId === exercise.id
      );

      if (alreadyExists) return day;

      return {
        ...day,
        exercises: [
          ...day.exercises,
          {
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 2,
            reps: "12-15",
            restSeconds: 90,
            difficulty: exercise.difficulty,
            dayNumber,
          },
        ],
      };
    });

    const finalSchedule = dayFound
      ? updatedSchedule
      : [
          ...updatedSchedule,
          {
            day: dayNumber,
            title: buildDayTitle(dayNumber),
            exercises: [
              {
                exerciseId: exercise.id,
                name: exercise.name,
                sets: 2,
                reps: "12-15",
                restSeconds: 90,
                difficulty: exercise.difficulty,
                dayNumber,
              },
            ],
          },
        ].sort((a, b) => a.day - b.day);

    return {
      ...plan,
      schedule: finalSchedule,
      totalDays: finalSchedule.length,
      totalExercises: finalSchedule.reduce(
        (sum, day) => sum + day.exercises.length,
        0
      ),
    };
  });
}