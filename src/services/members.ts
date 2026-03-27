import api from "./api";

export interface MemberItem {
  id: number;
  user_name: string;
  plan_name: string | null;
  status: string | null;
  end_date: string | null;
}

export interface MembersStats {
  total: number;
  active: number;
  not_active: number;
}

export interface MembersResponse {
  stats: MembersStats;
  members: MemberItem[];
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  role_id: number;
}

export async function getMembers() {
  const response = await api.get<MembersResponse>("/members");
  return response.data;
}

export async function createMember(payload: CreateMemberPayload) {
  const response = await api.post("/members", payload);
  return response.data;
}

export async function getMemberById(id: number) {
  const response = await api.get(`/members/${id}`);
  return response.data;
}