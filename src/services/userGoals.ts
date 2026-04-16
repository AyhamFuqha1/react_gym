import api from "./api";

export interface UserGoalItem {
  id: number;
  user_id: number;
  goal_type: string;
  target_weight: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export async function getUserGoals(): Promise<UserGoalItem[]> {
  const response = await api.get("/user-goals");
  return Array.isArray(response.data) ? response.data : [];
}