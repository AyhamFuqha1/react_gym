import api from "./api";

export type InjurySeverity = "mild" | "moderate" | "severe";
export type InjuryStatus = "active" | "recovered";

export interface InjuryModificationRequest {
  id: number | string;
  type?: string;
  status?: string;
  source?: string;
  source_id?: number | string | null;
  recommendations?: unknown;
  changes_summary?: unknown;
  modified_plan?: unknown;
  user_feedback?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface InjuryDashboardItem {
  id: number;
  user_name: string;
  injury_type: string;
  severity: InjurySeverity | string;
  status: InjuryStatus | string;
  exercise_restrictions?: unknown;
  ai_alternatives?: unknown;
  modification_request?: InjuryModificationRequest | null;
}

export interface InjuryPaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface InjuryDashboardResponse {
  current_page: number;
  data: InjuryDashboardItem[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: InjuryPaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface InjuryDetails {
  id: number;
  user_id: number;
  injury_type: string;
  severity: InjurySeverity | string;
  notes: string | null;
  status: InjuryStatus | string;
  created_at?: string;
}

export interface GetInjuryByIdResponse {
  success: boolean;
  data: InjuryDetails;
}

export interface CreateInjuryPayload {
  user_id: number;
  injury_type: string;
  severity: InjurySeverity;
  notes?: string;
  status: InjuryStatus;
}

export interface CreateInjuryResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: string | number;
    injury_type: string;
    severity: InjurySeverity;
    notes: string | null;
    status: InjuryStatus;
  };
}

export interface UpdateInjuryPayload {
  user_id?: number;
  injury_type?: string;
  severity?: InjurySeverity;
  notes?: string;
  status?: InjuryStatus;
}

export interface UpdateInjuryResponse {
  success: boolean;
  message: string;
  data: boolean;
}

export interface DeleteInjuryResponse {
  success: boolean;
  message: string;
}

export async function getInjuriesDashboard(page = 1) {
  const response = await api.get<InjuryDashboardResponse>(
    "/userInjuries/dashboard",
    {
      params: { page },
    }
  );

  return response.data;
}

export async function getInjuryById(id: number) {
  const response = await api.get<GetInjuryByIdResponse>(`/userInjuries/${id}`);
  return response.data;
}

export async function createInjury(payload: CreateInjuryPayload) {
  const response = await api.post<CreateInjuryResponse>(
    "/userInjuries",
    payload
  );
  return response.data;
}

export async function updateInjury(id: number, payload: UpdateInjuryPayload) {
  const response = await api.put<UpdateInjuryResponse>(
    `/userInjuries/${id}`,
    payload
  );
  return response.data;
}

export async function deleteInjury(id: number) {
  const response = await api.delete<DeleteInjuryResponse>(
    `/userInjuries/${id}`
  );
  return response.data;
}
