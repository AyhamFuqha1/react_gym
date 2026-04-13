import { useQuery } from "@tanstack/react-query";
import { getInjuriesDashboard } from "../../../services/injuries";
import { injuriesKeys } from "../keys";

export function useInjuriesDashboard(page = 1) {
  return useQuery({
    queryKey: injuriesKeys.dashboardPage(page),
    queryFn: () => getInjuriesDashboard(page),
  });
}