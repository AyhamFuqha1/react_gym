import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "../../../services/dashboard";
import { dashboardKeys } from "../keys";

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: getAdminDashboard,
    staleTime: 60 * 1000,
  });
}