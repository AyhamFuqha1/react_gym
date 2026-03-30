import api from "./api";

export interface FoodCategory {
  id: number;
  category_name: string;
  icon: string | null;
  description: string | null;
}

export interface FoodItem {
  id: number;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  badge: string | null;
  image: string | null;
  serving_size: string | null;
  category: FoodCategory;
}

export interface FoodsResponse {
  data: FoodItem[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface FoodPayload {
  general_nutrition_id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  image: string | null;
}

export async function getFoods() {
  const response = await api.get<FoodsResponse>("/foods");
  return response.data;
}

export async function createFood(payload: FoodPayload) {
  const response = await api.post("/foods", payload);
  return response.data;
}

export async function updateFood(foodId: number, payload: FoodPayload) {
  const response = await api.put(`/foods/${foodId}`, payload);
  return response.data;
}

export async function deleteFood(foodId: number) {
  const response = await api.delete(`/foods/${foodId}`);
  return response.data;
}