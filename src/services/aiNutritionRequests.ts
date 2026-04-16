import api from "./api";
import {
  buildApproveNutritionPayload,
  buildUpdateNutritionModificationPayload,
  normalizeNutritionModificationRequestsResponse,
  normalizeSearchFoodsResponse,
} from "../utils/aiNutritionRequests";
import type {
  NutritionModificationRequestItem,
  SearchFoodsResultItem,
} from "../utils/aiNutritionRequests";

export async function getModificationRequestById(id: number) {
  const response = await api.get(`/modification-requests/${id}`);
  return response.data;
}

export async function updateNutritionModificationRequest(
  id: number,
  payload: {
    status: string;
    changes_summary: string[];
    modified_plan: {
      plan_id: string | number | null;
      version: number;
      plan_data: {
        daily_meals: Array<{
          meal: string;
          items: Array<{
            food_id: number;
            name: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            quantity: number;
          }>;
        }>;
      };
    };
    recommendations: string[];
    user_feedback: {
      goal?: string;
      target_weight?: string | number;
      disliked_foods?: string[];
      notes?: string;
      modification_request?: string;
    };
  }
) {
  const response = await api.put(`/modification-requests/${id}`, payload);
  return response.data;
}

export async function deleteNutritionModificationRequest(id: number) {
  const response = await api.delete(`/modification-requests/${id}`);
  return response.data;
}

export async function getNutritionModificationRequests(): Promise<
  NutritionModificationRequestItem[]
> {
  const response = await api.get("/modification-requests/nutrition");
  return normalizeNutritionModificationRequestsResponse(response.data);
}

export async function approveNutritionModification(
  request: NutritionModificationRequestItem
) {
  const payload = buildApproveNutritionPayload(request);
  const response = await api.post(
    `/modification-requests/nutrition/${request.id}`,
    payload
  );
  return response.data;
}

export async function searchFoods(
  query: string
): Promise<SearchFoodsResultItem[]> {
  const response = await api.post("/search-foods", { query });
  return normalizeSearchFoodsResponse(response.data);
}