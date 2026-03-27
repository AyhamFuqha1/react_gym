import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export type ExerciseItem = {
  id: number;
  general_exercise_id: number;
  name: string;
  difficulty_level: string;
  video_url: string | null;
  instructions: string;
  common_mistakes: string | null;
};

export type GeneralExerciseCategory = {
  id: number;
  name: string;
  muscle_group: string;
  description: string | null;
};

export type ExercisesByCategoryResponse = {
  success: boolean;
  message: string;
  generalExercise: GeneralExerciseCategory;
  exercises: ExerciseItem[];
};

export type ExercisePayload = {
  name: string;
  general_exercise_id: number;
  difficulty_level: string;
  video_url?: string | null;
  instructions: string;
  common_mistakes?: string | null;
};

const exercisesApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export async function getExercisesByGeneralExerciseId(
  generalExerciseId: number
): Promise<ExercisesByCategoryResponse> {
  const response = await exercisesApi.get(
    `/generalExercise/${generalExerciseId}/exercises`
  );
  return response.data;
}

export async function getExerciseById(id: number): Promise<ExerciseItem> {
  const response = await exercisesApi.get(`/exercises/${id}`);
  return response.data;
}

export async function createExercise(payload: ExercisePayload) {
  const response = await exercisesApi.post("/exercises", payload);
  return response.data;
}

export async function updateExercise(id: number, payload: Partial<ExercisePayload>) {
  const response = await exercisesApi.put(`/exercises/${id}`, payload);
  return response.data;
}

export async function deleteExercise(id: number) {
  const response = await exercisesApi.delete(`/exercises/${id}`);
  return response.data;
}