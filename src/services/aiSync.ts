import api from "./api";

export interface SyncStatsGroup {
  added: number;
  updated: number;
  deleted: number;
}

export interface SyncAllResponse {
  status: string;
  stats: {
    exercises: SyncStatsGroup;
    nutrition: SyncStatsGroup;
    elapsed_seconds: number;
  };
}

export async function runSmartSync(): Promise<SyncAllResponse> {
  const response = await api.post("/sync-all");
  return response.data;
}

export async function runFullSync(): Promise<SyncAllResponse> {
  const response = await api.post("/sync-all?full_sync=true");
  return response.data;
}