import api from "./api";

export interface InjuryDashboardItem {
  id: number;
  user_name: string;
  injury_type: string;
  severity: "low" | "medium" | "high";
  status: "active" | "inactive" | string;
  exercise_restrictions: string[];
  ai_alternatives: string[];
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
  severity: "low" | "medium" | "high";
  notes: string | null;
  status: "active" | "inactive" | string;
  created_at?: string;
}

export interface GetInjuryByIdResponse {
  success: boolean;
  data: InjuryDetails;
}

export interface CreateInjuryPayload {
  user_id: number;
  injury_type: string;
  severity: "low" | "medium" | "high";
  notes?: string;
  status: "active" | "inactive";
}

export interface CreateInjuryResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: string | number;
    injury_type: string;
    severity: "low" | "medium" | "high";
    notes: string | null;
    status: "active" | "inactive";
  };
}

export interface UpdateInjuryPayload {
  user_id?: number;
  injury_type?: string;
  severity?: "low" | "medium" | "high";
  notes?: string;
  status?: "active" | "inactive";
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