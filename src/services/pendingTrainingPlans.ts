import api from "./api";
import {
  buildPendingPlanSavePayload,
  normalizePendingTrainingPlansResponse,
  type PendingTrainingPlanItem,
  type ModificationRequestLite,
  type PendingPlanContext,
} from "../utils/pendingTrainingPlans";
import {
  normalizeSearchExercisesResponse,
  normalizeTrainingModificationRequestsResponse,
  type SearchExerciseItem,
} from "../utils/aiPlanRequests";

type DetailApiResponse = {
  id: number;
  user_id: number;
  program_version_id: number;
  type: string;
  status: string;
  changes_summary: string[];
  modified_plan: {
    plan_id: number;
    version: number;
    plan_data: {
      schedule: Array<{
        day: number;
        focus?: string;
        exercises: Array<{
          name: string;
          reps: string;
          sets: number;
          difficulty: string;
          exercise_id: number;
          muscle_group: string | null;
          rest_seconds: number;
        }>;
      }>;
    };
  } | null;
  recommendations: string[];
  user_feedback?: {
    difficulty?: string;
    pain_areas?: string[];
    liked_exercises?: string[];
    disliked_exercises?: string[];
    modification_request?: string;
  };
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  program_version?: {
    id: number;
    name: string;
    level: string;
  };
};

export async function getPendingTrainingPlans(): Promise<PendingTrainingPlanItem[]> {
  const [plansResponse, modRequestsResponse] = await Promise.all([
    api.get("/PendingTrainingPlans"),
    api.get("/modification-requests/training"),
  ]);

  const liteRequests = normalizeTrainingModificationRequestsResponse(
    modRequestsResponse.data
  ) as unknown as ModificationRequestLite[];

  return normalizePendingTrainingPlansResponse(plansResponse.data, liteRequests);
}

export async function saveEditedTrainingPlan(plan: PendingTrainingPlanItem) {
  const payload = buildPendingPlanSavePayload(plan);
  const response = await api.post("/PendingTrainingPlans", payload);
  return response.data;
}

export async function searchExercises(
  query: string,
  nResults = 10
): Promise<SearchExerciseItem[]> {
  const payload = {
    query: query.trim(),
    n_results: nResults,
  };

  const response = await api.post("/search-exercises", payload, {
    params: payload,
  });
  return normalizeSearchExercisesResponse(response.data);
}

export async function getPendingPlanRequestContext(
  requestId: number
): Promise<PendingPlanContext | null> {
  const response = await api.get(`/modification-requests/${requestId}`);
  const full = response.data as DetailApiResponse;

  if (!full) return null;

  return {
    requestId: Number(full.id ?? requestId),
    requestDate: full.created_at ?? null,
    userId: full.user_id != null ? Number(full.user_id) : null,
    userName: full.user?.name ? String(full.user.name) : `User #${full.user_id ?? "Unknown"}`,
    userAvatar: full.user?.name
      ? full.user.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") || "AI"
      : "AI",
    userRequest:
      full.user_feedback?.modification_request ??
      "Training modification request",
    difficulty: full.user_feedback?.difficulty ?? null,
    painAreas: Array.isArray(full.user_feedback?.pain_areas)
      ? full.user_feedback!.pain_areas!.map(String)
      : [],
    likedExercises: Array.isArray(full.user_feedback?.liked_exercises)
      ? full.user_feedback!.liked_exercises!.map(String)
      : [],
    dislikedExercises: Array.isArray(full.user_feedback?.disliked_exercises)
      ? full.user_feedback!.disliked_exercises!.map(String)
      : [],
    changesSummary: Array.isArray(full.changes_summary)
      ? full.changes_summary.map(String)
      : [],
    recommendations: Array.isArray(full.recommendations)
      ? full.recommendations.map(String)
      : [],
    programName: full.program_version?.name ?? null,
    programLevel: full.program_version?.level ?? null,
    userEmail: full.user?.email ?? null,
  };
}
