import api from "./api";

export interface CoachItem {
  id: number;
  name: string;
  email: string;
  status?: string | null;
  created_at?: string | null;
}

export interface CoachesResponse {
  coaches: CoachItem[];
}

export interface CreateCoachPayload {
  name: string;
  email: string;
}

export interface CreateCoachResponse {
  message: string;
}

function normalizeCoaches(payload: unknown): CoachItem[] {
  if (Array.isArray(payload)) {
    return payload as CoachItem[];
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const data = payload as Record<string, unknown>;

  if (Array.isArray(data.coaches)) {
    return data.coaches as CoachItem[];
  }

  if (Array.isArray(data.data)) {
    return data.data as CoachItem[];
  }

  return [];
}

export async function getCoaches(): Promise<CoachesResponse> {
  const response = await api.get("/coaches");

  return {
    coaches: normalizeCoaches(response.data),
  };
}

export async function createCoach(
  payload: CreateCoachPayload
): Promise<CreateCoachResponse> {
  const response = await api.post<CreateCoachResponse>("/register", {
    ...payload,
    role_id: 3,
  });

  return response.data;
}
