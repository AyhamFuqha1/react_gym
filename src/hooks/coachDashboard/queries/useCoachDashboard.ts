import { useQuery } from "@tanstack/react-query";
import { getMembers, type MemberItem as ServiceMemberItem } from "../../../services/members";
import { getNews, type NewsItem } from "../../../services/news";
import {
  getGeneralNutritionCategories,
  type GeneralNutritionItem,
} from "../../../services/generalNutrition";
import {
  getGeneralExercises,
  type GeneralExerciseItem,
} from "../../../services/generalExercises";
import {
  getSubscriptionsForAdmin,
  type SubscriptionAdminItem,
} from "../../../services/subscriptionAdmin";
import { getUserId } from "../../../services/auth";
import { coachDashboardKeys } from "../keys";

export type CoachDashboardData = {
  members: ServiceMemberItem[];
  news: NewsItem[];
  nutritionCategories: GeneralNutritionItem[];
  exerciseCategories: GeneralExerciseItem[];
  coachSubscriptions: SubscriptionAdminItem[];
};

export async function getCoachDashboard(): Promise<CoachDashboardData> {
  const [
    membersRes,
    newsRes,
    nutritionRes,
    exercisesRes,
    subscriptionsRes,
  ] = await Promise.all([
    getMembers(),
    getNews(1, 3),
    getGeneralNutritionCategories(),
    getGeneralExercises(),
    getSubscriptionsForAdmin(),
  ]);

  const currentUserId = Number(getUserId() ?? 0);

  const allSubscriptions = Array.isArray(subscriptionsRes) ? subscriptionsRes : [];

  const coachSubscriptions = allSubscriptions.filter((item) => {
    return Number(item.created_by ?? 0) === currentUserId;
  });

  return {
    members: Array.isArray(membersRes?.members) ? membersRes.members : [],
    news: Array.isArray(newsRes?.data?.data) ? newsRes.data.data : [],
    nutritionCategories: Array.isArray(nutritionRes) ? nutritionRes : [],
    exerciseCategories: Array.isArray(exercisesRes?.categories)
      ? exercisesRes.categories
      : [],
    coachSubscriptions,
  };
}

export function useCoachDashboard() {
  return useQuery({
    queryKey: coachDashboardKeys.dashboard(),
    queryFn: getCoachDashboard,
    staleTime: 60 * 1000,
  });
}