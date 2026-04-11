import api from "./api";

export interface NutritionFoodItem {
  id: number;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  badge: string | null;
  image: string | null;
  serving_size: string;
}

export interface GeneralNutritionItem {
  id: number;
  category_name: string;
  icon: string | null;
  description: string | null;
  foods: NutritionFoodItem[];
}

export interface GeneralNutritionPayload {
  category_name: string;
  icon: string;
  description: string;
}

type GeneralNutritionApiItem = {
  id: number;
  category_name?: string;
  icon?: string | null;
  description?: string | null;
  foods?: NutritionFoodItem[];
};

type GeneralNutritionListResponse = {
  data?: GeneralNutritionApiItem[];
};

type GeneralNutritionSingleResponse = {
  data?: GeneralNutritionApiItem;
};

function normalizeGeneralNutritionItem(
  item: GeneralNutritionApiItem
): GeneralNutritionItem {
  return {
    id: item.id,
    category_name: item.category_name || "Unknown Category",
    icon: item.icon ?? null,
    description: item.description ?? "",
    foods: Array.isArray(item.foods) ? item.foods : [],
  };
}

export async function getGeneralNutritionCategories(): Promise<
  GeneralNutritionItem[]
> {
  const response = await api.get<GeneralNutritionListResponse>(
    "/general-nutrition"
  );

  const rawData = Array.isArray(response.data?.data) ? response.data.data : [];

  return rawData.map(normalizeGeneralNutritionItem);
}

export async function createGeneralNutrition(
  payload: GeneralNutritionPayload
): Promise<GeneralNutritionItem> {
  const response = await api.post<GeneralNutritionSingleResponse>(
    "/generalNutrition",
    payload
  );

  return normalizeGeneralNutritionItem(
    response.data?.data || {
      id: 0,
      category_name: payload.category_name,
      icon: payload.icon,
      description: payload.description,
      foods: [],
    }
  );
}

export async function getGeneralNutritionById(
  id: number
): Promise<GeneralNutritionItem> {
  const response = await api.get<GeneralNutritionSingleResponse>(
    `/generalNutrition/${id}`
  );

  return normalizeGeneralNutritionItem(
    response.data?.data || {
      id,
      category_name: "Unknown Category",
      icon: null,
      description: "",
      foods: [],
    }
  );
}

export async function updateGeneralNutrition(
  id: number,
  payload: GeneralNutritionPayload
): Promise<GeneralNutritionItem> {
  const response = await api.put<GeneralNutritionSingleResponse>(
    `/generalNutrition/${id}`,
    payload
  );

  return normalizeGeneralNutritionItem(
    response.data?.data || {
      id,
      category_name: payload.category_name,
      icon: payload.icon,
      description: payload.description,
      foods: [],
    }
  );
}

export async function deleteGeneralNutrition(id: number): Promise<void> {
  await api.delete(`/generalNutrition/${id}`);
}