import { useQuery } from "@tanstack/react-query";
import { getSubscriptionsForAdmin } from "../../../services/subscriptions";
import { subscriptionsKeys } from "../keys";

export function useSubscriptionsForAdmin() {
  return useQuery({
    queryKey: subscriptionsKeys.admin(),
    queryFn: getSubscriptionsForAdmin,
    staleTime: 60 * 1000,
  });
}