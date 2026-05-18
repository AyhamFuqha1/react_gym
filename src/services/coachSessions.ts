import api from "./api";

export type CoachSessionStatus = "available" | "full" | "cancelled" | string;

export interface CoachSessionCoach {
  id: number;
  name?: string | null;
  email?: string | null;
}

export interface CoachSessionBookingUser {
  id: number;
  name?: string | null;
  email?: string | null;
}

export interface CoachSessionBooking {
  id: number;
  user_id: number;
  session_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  user?: CoachSessionBookingUser | null;
}

export interface CoachSession {
  id: number;
  coach_id: number;
  day_of_week?: number | string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  capacity?: number | string | null;
  booked_count?: number | string | null;
  status?: CoachSessionStatus | null;
  is_recurring?: boolean | number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  coach?: CoachSessionCoach | null;
  bookings?: CoachSessionBooking[] | null;
}

export interface AdminCancelSessionResponse {
  status?: string;
  message?: string;
  data?: CoachSession | null;
  session?: CoachSession | null;
}

export type AdminRestoreSessionResponse = AdminCancelSessionResponse;
export type CancelCoachSessionResponse = AdminCancelSessionResponse;

export interface CreateCoachSessionPayload {
  coach_id: number;
  day_of_week?: number | null;
  session_date?: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status?: "available" | "cancelled";
  is_recurring?: boolean;
}

export type UpdateCoachSessionPayload = Partial<CreateCoachSessionPayload>;

export interface DeleteCoachSessionResponse {
  status?: string;
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeSessionArray(value: unknown): CoachSession[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord) as unknown as CoachSession[];
}

function unwrapSessionList(payload: unknown): CoachSession[] {
  if (Array.isArray(payload)) {
    return normalizeSessionArray(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const data = payload.data;

  if (Array.isArray(data)) {
    return normalizeSessionArray(data);
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return normalizeSessionArray(data.data);
  }

  return [];
}

function unwrapSession(payload: unknown): CoachSession {
  if (isRecord(payload)) {
    const data = payload.data;

    if (isRecord(data)) {
      if (isRecord(data.data)) {
        return data.data as unknown as CoachSession;
      }

      return data as unknown as CoachSession;
    }
  }

  return payload as CoachSession;
}

export async function getAdminSessions(): Promise<CoachSession[]> {
  const response = await api.get("/admin/sessions");
  return unwrapSessionList(response?.data);
}

export async function getAdminSessionDetails(
  sessionId: number
): Promise<CoachSession> {
  const response = await api.get(`/admin/sessions/${sessionId}`);
  return unwrapSession(response.data);
}

export async function adminCancelSession(
  sessionId: number
): Promise<AdminCancelSessionResponse> {
  const response = await api.post<AdminCancelSessionResponse>(
    `/admin/sessions/${sessionId}/cancel`
  );
  return response.data;
}

export async function adminRestoreSession(
  sessionId: number
): Promise<AdminRestoreSessionResponse> {
  const response = await api.post<AdminRestoreSessionResponse>(
    `/admin/sessions/${sessionId}/restore`
  );
  return response.data;
}

export async function createCoachSession(
  payload: CreateCoachSessionPayload
): Promise<CoachSession> {
  const response = await api.post("/coach/session", payload);
  return unwrapSession(response?.data);
}

export async function getCoachSessionDetails(
  sessionId: number
): Promise<CoachSession> {
  const response = await api.get(`/coach/session/${sessionId}`);
  return unwrapSession(response?.data);
}

export async function updateCoachSession(
  sessionId: number,
  payload: UpdateCoachSessionPayload
): Promise<CoachSession> {
  const response = await api.put(`/coach/session/${sessionId}`, payload);
  return unwrapSession(response?.data);
}

export async function cancelCoachSession(
  sessionId: number
): Promise<CancelCoachSessionResponse> {
  const response = await api.post<CancelCoachSessionResponse>(
    `/coach/session/${sessionId}/cancel`
  );
  return response.data;
}

export async function deleteCoachSession(
  sessionId: number
): Promise<DeleteCoachSessionResponse> {
  const response = await api.delete<DeleteCoachSessionResponse>(
    `/coach/session/${sessionId}`
  );
  return response.data;
}
