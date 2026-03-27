import api from "./api";

export interface GeneralExerciseItem {
  id: number;
  name: string;
  muscle_group: string;
  description: string;
}

export interface GeneralExercisesDashboardOriginal {
  categories_count: number;
  exercises_count: number;
  categories: GeneralExerciseItem[];
}

export interface GeneralExercisesDashboardResponse {
  headers?: Record<string, unknown>;
  original?: GeneralExercisesDashboardOriginal;
  exception?: unknown;
}

export interface CreateGeneralExercisePayload {
  name: string;
  muscle_group: string;
  description: string;
}

export interface UpdateGeneralExercisePayload {
  name: string;
  muscle_group: string;
  description: string;
}

export async function getGeneralExercises() {
  const response =
    await api.get<GeneralExercisesDashboardResponse>("/generalExercise");

  return (
    response.data?.original ?? {
      categories_count: 0,
      exercises_count: 0,
      categories: [],
    }
  );
}

export async function getGeneralExerciseById(id: number) {
  const response = await api.get<GeneralExerciseItem>(`/generalExercise/${id}`);
  return response.data;
}

export async function createGeneralExercise(
  payload: CreateGeneralExercisePayload
) {
  const response = await api.post<GeneralExerciseItem>(
    "/generalExercise",
    payload
  );
  return response.data;
}

export async function updateGeneralExercise(
  id: number,
  payload: UpdateGeneralExercisePayload
) {
  const response = await api.put<GeneralExerciseItem>(
    `/generalExercise/${id}`,
    payload
  );
  return response.data;
}

export async function deleteGeneralExercise(id: number) {
  const response = await api.delete(`/generalExercise/${id}`);
  return response.data;
}