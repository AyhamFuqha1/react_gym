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

export interface ModificationUserFeedback {
  [key: string]: unknown;
  level?: string;
  difficulty?: string;
  pain_areas?: string[];
  liked_exercises?: string[];
  disliked_exercises?: string[];
  modification_request?: string;
  request_type?: string;
  injury_id?: string | number;
  injury_type?: string;
  severity?: string;
  notes?: string | null;
  status?: string;
}

export interface RequestSafetySource {
  sourceId: string | number | null;
  sourceTable: string | null;
  sourceName: string;
  score: number | null;
  reasonUsed: string | null;
}

export interface RequestSafetyContext {
  injuryWarnings: string[];
  restrictions: string[];
  alternatives: string[];
  ragSummary: string | null;
  sources: RequestSafetySource[];
  generationMode: string | null;
  fallbackReason: string | null;
  debugError: string | null;
}

export interface ModificationRequestItem {
  id: number;
  planId: string;
  version: number;
  requestDate: string | null;
  status: "pending" | "done" | "edited" | "approved";
  source: "generated" | "modification" | string;
  sourceId: string | number | null;
  userId: number | null;
  userName: string;
  userAvatar: string;
  userRequest: string;
  userFeedback?: ModificationUserFeedback;
  changesSummary: string[];
  modifiedPlan: {
    duration: string;
    schedule: PlanWorkoutDay[];
  };
  recommendations: string[];
  safetyContext: RequestSafetyContext;
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

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.map((item) => String(item)) : undefined;
}

function parsePositiveDayNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const directNumber = Number(trimmed);
  if (Number.isFinite(directNumber) && directNumber > 0) {
    return Math.trunc(directNumber);
  }

  const dayMatch = trimmed.match(/\bday\s*#?\s*(\d+)\b/i);
  if (dayMatch?.[1]) return Number(dayMatch[1]);

  const anyNumberMatch = trimmed.match(/\b(\d+)\b/);
  return anyNumberMatch?.[1] ? Number(anyNumberMatch[1]) : null;
}

function parseDayIndex(value: unknown): number | null {
  const parsed =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : NaN;

  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed) + 1;
}

export function resolvePlanDayNumber(dayItem: unknown, index: number): number {
  const source = getObject(dayItem) ?? {};

  return (
    parsePositiveDayNumber(source.day_number) ??
    parsePositiveDayNumber(source.day) ??
    parseDayIndex(source.dayIndex) ??
    parseDayIndex(source.day_index) ??
    parsePositiveDayNumber(source.name) ??
    parsePositiveDayNumber(source.title) ??
    index + 1
  );
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function uniqueStrings(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  groups.flat().forEach((item) => {
    const normalized = item.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return;
    seen.add(key);
    values.push(normalized);
  });

  return values;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function normalizeSafetySources(value: unknown): RequestSafetySource[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const source = getObject(item);
      if (!source) return null;

      const sourceName = firstString(
        source.source_name,
        source.name,
        source.title,
        source.id
      );

      if (!sourceName) return null;

      const scoreValue = Number(source.score);

      return {
        sourceId:
          source.source_id != null
            ? (source.source_id as string | number)
            : source.id != null
              ? (source.id as string | number)
              : null,
        sourceTable: firstString(source.source_table, source.table, source.type),
        sourceName,
        score: Number.isFinite(scoreValue) ? scoreValue : null,
        reasonUsed: firstString(source.reason_used, source.reason, source.preview),
      };
    })
    .filter((item): item is RequestSafetySource => item !== null);
}

function uniqueSafetySources(
  ...groups: RequestSafetySource[][]
): RequestSafetySource[] {
  const seen = new Set<string>();
  const sources: RequestSafetySource[] = [];

  groups.flat().forEach((source) => {
    const key = String(source.sourceId ?? source.sourceName).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    sources.push(source);
  });

  return sources;
}

export function extractRequestSafetyContext(raw: any): RequestSafetyContext {
  const modifiedPlan = getObject(raw?.modified_plan);

  return {
    injuryWarnings: uniqueStrings(
      normalizeStringArray(raw?.injury_warnings),
      normalizeStringArray(modifiedPlan?.injury_warnings)
    ),
    restrictions: uniqueStrings(
      normalizeStringArray(raw?.restrictions),
      normalizeStringArray(raw?.exercise_restrictions),
      normalizeStringArray(modifiedPlan?.restrictions),
      normalizeStringArray(modifiedPlan?.exercise_restrictions)
    ),
    alternatives: uniqueStrings(
      normalizeStringArray(raw?.alternatives),
      normalizeStringArray(raw?.ai_alternatives),
      normalizeStringArray(modifiedPlan?.alternatives),
      normalizeStringArray(modifiedPlan?.ai_alternatives)
    ),
    ragSummary: firstString(raw?.rag_summary, modifiedPlan?.rag_summary),
    sources: uniqueSafetySources(
      normalizeSafetySources(raw?.sources),
      normalizeSafetySources(modifiedPlan?.sources)
    ),
    generationMode: firstString(raw?.generation_mode, modifiedPlan?.generation_mode),
    fallbackReason: firstString(raw?.fallback_reason, modifiedPlan?.fallback_reason),
    debugError: firstString(
      raw?.rag_debug_error_message,
      modifiedPlan?.rag_debug_error_message,
      raw?.rag_debug_error_type,
      modifiedPlan?.rag_debug_error_type
    ),
  };
}

function normalizeUserFeedback(raw: unknown): ModificationUserFeedback | undefined {
  const source = getObject(raw);
  if (!source) return undefined;

  const feedback: ModificationUserFeedback = { ...source };

  feedback.level = getString(source.level);
  feedback.difficulty = getString(source.difficulty);
  feedback.pain_areas = getStringArray(source.pain_areas);
  feedback.liked_exercises = getStringArray(source.liked_exercises);
  feedback.disliked_exercises = getStringArray(source.disliked_exercises);
  feedback.modification_request = getString(source.modification_request);
  feedback.request_type = getString(source.request_type);
  feedback.injury_type = getString(source.injury_type);
  feedback.severity = getString(source.severity);
  feedback.status = getString(source.status);
  feedback.notes =
    source.notes === null || source.notes === undefined
      ? (source.notes as null | undefined)
      : String(source.notes);

  if (source.injury_id !== null && source.injury_id !== undefined) {
    feedback.injury_id =
      typeof source.injury_id === "number"
        ? source.injury_id
        : String(source.injury_id);
  }

  return feedback;
}

export function isInjuryModificationRequest(
  source?: string | null,
  feedback?: ModificationUserFeedback | null
) {
  return (
    String(source ?? "").toLowerCase() === "injury" ||
    String(feedback?.request_type ?? "").toLowerCase() === "injury"
  );
}

export function buildModificationUserRequest(
  feedback: ModificationUserFeedback | undefined,
  source: string,
  fallback?: string
) {
  const modificationRequest = feedback?.modification_request?.trim();
  const injuryType = feedback?.injury_type?.trim();
  const genericRequest = "Training modification request";
  const injuryRequest = injuryType
    ? `Training modification requested because of injury: ${injuryType}`
    : genericRequest;

  if (isInjuryModificationRequest(source, feedback)) {
    if (!modificationRequest || modificationRequest === genericRequest) {
      return injuryRequest;
    }
  }

  return (
    modificationRequest ||
    fallback ||
    (source === "generated"
      ? "AI generated a new training plan for coach review."
      : genericRequest)
  );
}

function guessWorkoutTitle(
  day: number,
  exercises: Array<{ muscleGroup?: string | null }>,
  focus?: string
): string {
  if (focus?.trim()) return focus;

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

export function normalizeTrainingModificationRequestsResponse(
  raw: any
): ModificationRequestItem[] {
  const sourceItems = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
      ? raw
      : [];

  return sourceItems.map((item: any) => {
    const source = String(item?.source ?? "modification").toLowerCase();
    const userFeedback = normalizeUserFeedback(item?.user_feedback);

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
      const dayNumber = resolvePlanDayNumber(dayItem, index);

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
        title: guessWorkoutTitle(dayNumber, exercises, dayItem?.focus),
        exercises,
      };
    });

    const rawDurationWeeks =
      item?.modified_plan?.plan_data?.duration_weeks ??
      item?.modified_plan?.duration_weeks ??
      item?.duration_weeks ??
      item?.user_feedback?.duration_weeks;

    const duration =
      rawDurationWeeks != null
        ? `${rawDurationWeeks} weeks`
        : schedule.length > 0
          ? `${schedule.length} days`
          : "Not specified";

    const rawPlanId =
      item?.modified_plan?.plan_id ??
      item?.plan_id ??
      item?.current_plan_id ??
      item?.program_version_id ??
      "";

    const changesSummary = uniqueStrings(
      normalizeStringArray(item?.changes_summary),
      normalizeStringArray(item?.modified_plan?.changes_summary)
    );

    const recommendations = uniqueStrings(
      normalizeStringArray(item?.recommendations),
      normalizeStringArray(item?.modified_plan?.recommendations)
    );

    return {
      id: Number(item?.id ?? item?.modification_request_id ?? 0),
      planId: rawPlanId != null ? String(rawPlanId) : "",
      version: Number(
        item?.modified_plan?.version ??
          item?.version ??
          item?.program_version_id ??
          1
      ),
      requestDate: item?.created_at ? String(item.created_at) : null,
      status: String(item?.status ?? "pending").toLowerCase() as
        | "pending"
        | "done"
        | "edited"
        | "approved",
      source,
      sourceId: item?.source_id ?? item?.sourceId ?? null,
      userId: item?.user_id != null ? Number(item.user_id) : null,
      userName: String(userName),
      userAvatar: buildAvatar(String(userName)),
      userRequest: buildModificationUserRequest(
        userFeedback,
        source,
        item?.user_request ?? item?.modification_request
      ),
      userFeedback,
      changesSummary,
      modifiedPlan: {
        duration,
        schedule,
      },
      recommendations,
      safetyContext: extractRequestSafetyContext(item),
    };
  });
}

export function normalizeSearchExercisesResponse(raw: any): SearchExerciseItem[] {
  const results = Array.isArray(raw?.results)
    ? raw.results
    : Array.isArray(raw?.data?.results)
      ? raw.data.results
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

  return results.map((item: any) => ({
    id: Number(item?.metadata?.id ?? item?.source_id ?? item?.id ?? 0),
    name: String(
      item?.metadata?.name ?? item?.source_name ?? item?.name ?? "Exercise"
    ),
    difficulty: String(item?.metadata?.difficulty ?? item?.difficulty ?? "beginner"),
    muscleGroup: item?.metadata?.muscle_group
      ? String(item.metadata.muscle_group)
      : item?.muscle_group
        ? String(item.muscle_group)
      : null,
  }));
}

export function buildApproveModificationPayload(request: ModificationRequestItem) {
  return {
    plan_data: {
      plan_id: request.planId || null,
      version: request.version,
      plan_data: {
        duration_weeks:
          Number.parseInt(request.modifiedPlan.duration, 10) ||
          request.modifiedPlan.schedule.length ||
          4,
        schedule: request.modifiedPlan.schedule.map((day) => ({
          day: day.day,
          exercises: day.exercises.map((exercise) => ({
            exercise_id: exercise.exerciseId,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.restSeconds,
            difficulty: exercise.difficulty,
            muscle_group: exercise.muscleGroup,
          })),
        })),
      },
    },
  };
}
