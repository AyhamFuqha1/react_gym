import api from "./api";
import {
  buildApproveModificationPayload,
  normalizeSearchExercisesResponse,
  normalizeTrainingModificationRequestsResponse,
} from "../utils/aiPlanRequests";
import type {
  ModificationRequestItem,
  ModificationUserFeedback,
  SearchExerciseItem,
} from "../utils/aiPlanRequests";

export interface UserInjuryContext {
  id: number;
  user_id: number;
  injury_type: string;
  severity: string;
  status: string;
  notes: string | null;
  created_at?: string;
}

export interface UserProfileContext {
  id: number;
  user_id: number;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  activity_level: string | null;
  preferences: string | null;
  food_allergies: string | null;
  medical_conditions: string | null;
}

export async function getModificationRequestById(id: number) {
  const response = await api.get(`/modification-requests/${id}`);
  return response.data;
}

export async function updateModificationRequest(
  id: number,
  payload: {
    status: string;
    changes_summary: string[];
    modified_plan: {
      plan_id: string | number | null;
      version: number;
      plan_data: {
        schedule: Array<{
          day: number;
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
    };
    recommendations: string[];
    user_feedback: ModificationUserFeedback;
  }
) {
  const response = await api.put(`/modification-requests/${id}`, payload);
  return response.data;
}

export async function deleteModificationRequest(id: number) {
  const response = await api.delete(`/modification-requests/${id}`);
  return response.data;
}

export async function getTrainingModificationRequests(): Promise<
  ModificationRequestItem[]
> {
  const response = await api.get("/modification-requests/training");
  return normalizeTrainingModificationRequestsResponse(response.data);
}

export async function getAllUserInjuries(): Promise<UserInjuryContext[]> {
  const response = await api.get<
    | { success?: boolean; data?: UserInjuryContext[] }
    | UserInjuryContext[]
  >("/userInjuries");

  const items = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

  return items.map((item) => ({
    id: Number(item.id ?? 0),
    user_id: Number(item.user_id ?? 0),
    injury_type: String(item.injury_type ?? ""),
    severity: String(item.severity ?? ""),
    status: String(item.status ?? ""),
    notes: item.notes == null ? null : String(item.notes),
    created_at: item.created_at,
  }));
}

export async function getUserProfileByUserId(
  userId: number
): Promise<UserProfileContext | null> {
  try {
    const response = await api.get<
      | { success?: boolean; data?: UserProfileContext }
      | UserProfileContext
    >(`/profile/user/${userId}`);

    const profile =
      "data" in response.data && response.data.data
        ? response.data.data
        : (response.data as UserProfileContext);

    if (!profile || profile.user_id == null) return null;

    return {
      id: Number(profile.id ?? 0),
      user_id: Number(profile.user_id ?? userId),
      age: profile.age ?? null,
      height: profile.height ?? null,
      weight: profile.weight ?? null,
      gender: profile.gender ?? null,
      activity_level: profile.activity_level ?? null,
      preferences: profile.preferences ?? null,
      food_allergies: profile.food_allergies ?? null,
      medical_conditions: profile.medical_conditions ?? null,
    };
  } catch (error) {
    console.warn(`Could not load profile context for user ${userId}.`, error);
    return null;
  }
}

export async function getUserProfilesByUserIds(
  userIds: number[]
): Promise<Record<number, UserProfileContext>> {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter((id) => Number.isFinite(id) && id > 0))
  );

  const profiles = await Promise.all(
    uniqueUserIds.map((userId) => getUserProfileByUserId(userId))
  );

  return profiles.reduce<Record<number, UserProfileContext>>((map, profile) => {
    if (profile) {
      map[Number(profile.user_id)] = profile;
    }

    return map;
  }, {});
}

export async function approveTrainingModification(request: ModificationRequestItem) {
  const payload = buildApproveModificationPayload(request);
  const response = await api.post(
    `/modification-requests/training/${request.id}/approve-final`,
    payload
  );
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
