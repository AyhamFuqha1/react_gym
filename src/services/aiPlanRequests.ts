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

export async function approveTrainingModification(request: ModificationRequestItem) {
  const payload = buildApproveModificationPayload(request);
  const response = await api.post(
    `/modification-requests/training/${request.id}/approve-final`,
    payload
  );
  return response.data;
}

export async function searchExercises(
  query: string
): Promise<SearchExerciseItem[]> {
  const response = await api.post("/search-exercises", { query });
  return normalizeSearchExercisesResponse(response.data);
}
