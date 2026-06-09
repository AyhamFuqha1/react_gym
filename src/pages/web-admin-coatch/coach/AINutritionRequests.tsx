import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  X,
  User,
  Calendar,
  Sparkles,
  Clock,
  Save,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  Plus,
  Mail,
  Apple,
  GitBranch,
  Target,
  Utensils,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type {
  NutritionModificationRequestItem,
  SearchFoodsResultItem,
} from "../../../utils/aiNutritionRequests";
import {
  getModificationRequestById,
  searchFoods,
} from "../../../services/aiNutritionRequests";
import { useNutritionModificationRequests } from "../../../hooks/aiNutritionRequests/queries/useAINutritionRequestsQueries";
import { useApproveNutritionModification } from "../../../hooks/aiNutritionRequests/mutations/useApproveNutritionModification";
import { useUpdateNutritionModificationRequest } from "../../../hooks/aiNutritionRequests/mutations/useUpdateNutritionModificationRequest";
import { useDeleteNutritionModificationRequest } from "../../../hooks/aiNutritionRequests/mutations/useDeleteNutritionModificationRequest";
import {
  calculateMealTotals,
  calculatePlanTotals,
  createFoodFromSearchResult,
} from "../../../utils/aiNutritionRequests";
import { useUserGoals } from "../../../hooks/aiPlanRequests/queries/useUserGoals";
import { useTranslation, type TranslationKey } from "../../../i18n";

const statusConfig = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Pending Review",
  },
  done: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Completed",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Approved",
  },
  edited: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Edited",
  },
};

const sourceConfig = {
  generated: {
    label: "Generated",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  modification: {
    label: "Modification",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type DetailApiFoodItem = {
  food_id?: number;
  nutrition_id?: number;
  id?: number;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  quantity?: number;
};

type DetailApiMeal = {
  meal?: string;
  items?: DetailApiFoodItem[];
};

type DetailApiResponse = {
  id: number;
  user_id: number;
  program_version_id: number | null;
  type: string;
  status: string;
  source?: string;
  changes_summary: string[];
  modified_plan: {
    plan_id: string | number | null;
    version: number;
    daily_meals?: DetailApiMeal[];
    plan_data?: {
      daily_meals?: DetailApiMeal[];
    };
    total_daily?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
    generated_at?: string;
  } | null;
  recommendations: string[];
  user_feedback?: {
    goal?: string;
    target_weight?: string | number;
    disliked_foods?: string[];
    notes?: string;
    modification_request?: string;
    request_type?: string;
  };
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  program_version?: {
    id: number;
    name: string;
    level: string;
  } | null;
};

type EnrichedNutritionModificationRequestItem = NutritionModificationRequestItem & {
  displayGoal: string;
  displayTargetWeight: string;
};

function toTitleCase(value: string) {
  if (!value) return "";
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatRequestDate(value?: string | null) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRequestStatusLabel(
  value: string,
  t: (key: TranslationKey) => string
) {
  const labels: Record<string, TranslationKey> = {
    pending: "aiRequests.pendingReview",
    done: "common.completed",
    approved: "common.approved",
    edited: "aiRequests.edited",
  };

  return t(labels[value] ?? "aiRequests.pendingReview");
}

function getRequestSourceLabel(
  value: string,
  t: (key: TranslationKey) => string
) {
  const labels: Record<string, TranslationKey> = {
    generated: "aiRequests.generated",
    modification: "aiRequests.modification",
  };

  return t(labels[value] ?? "aiRequests.modification");
}

export default function AINutritionRequests() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [nutritionRequests, setNutritionRequests] = useState<
    NutritionModificationRequestItem[]
  >([]);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const { data: userGoals = [] } = useUserGoals();
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);

  const [detailsById, setDetailsById] = useState<Record<number, DetailApiResponse>>(
    {}
  );

  const [foodSearchByMeal, setFoodSearchByMeal] = useState<Record<string, string>>(
    {}
  );
  const [foodResultsByMeal, setFoodResultsByMeal] = useState<
    Record<string, SearchFoodsResultItem[]>
  >({});
  const [foodSearchLoadingKey, setFoodSearchLoadingKey] = useState<string | null>(
    null
  );

  const {
    data: serverRequests = [],
    isLoading,
    isFetching,
    refetch,
  } = useNutritionModificationRequests();

  const approveMutation = useApproveNutritionModification();
  const updateMutation = useUpdateNutritionModificationRequest();
  const deleteMutation = useDeleteNutritionModificationRequest();

  useEffect(() => {
    setNutritionRequests(serverRequests);
  }, [serverRequests]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const goalsMap = useMemo(() => {
  const map = new Map<number, { goal: string; targetWeight: string }>();

  userGoals.forEach((item) => {
    map.set(Number(item.user_id), {
      goal: toTitleCase(String(item.goal_type ?? "")),
      targetWeight: String(item.target_weight ?? ""),
    });
  });

  return map;
}, [userGoals]);

const enrichedRequests = useMemo<EnrichedNutritionModificationRequestItem[]>(() => {
  return nutritionRequests.map((request) => {
    const goalInfo = goalsMap.get(Number(request.userId ?? 0));

    return {
      ...request,
      displayGoal:
        goalInfo?.goal ?? (toTitleCase(String(request.goal ?? "")) || t("aiRequests.goal")),
      displayTargetWeight: goalInfo?.targetWeight ?? String(request.targetWeight ?? ""),
    };
  });
}, [nutritionRequests, goalsMap, t]);

  const filteredRequests = useMemo(() => {
    return enrichedRequests.filter((request) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        request.userName.toLowerCase().includes(q) ||
        String(request.id).includes(q) ||
        request.planId.toLowerCase().includes(q) ||
        request.displayGoal.toLowerCase().includes(q)||
        request.source.toLowerCase().includes(q)
      );
    });}, [enrichedRequests, searchQuery]);
  

    const totalRequests = enrichedRequests.length;
    const pendingReviewCount = enrichedRequests.filter(
      (item) => item.status === "pending"
    ).length;
    const generatedCount = enrichedRequests.filter(
      (item) => item.source === "generated"
    ).length;
    const modificationCount = enrichedRequests.filter(
      (item) => item.source === "modification"
    ).length;

  function toggleExpand(id: number) {
    setExpandedRequest((current) => (current === id ? null : id));
  }

  async function refreshAll() {
    await refetch();
  }

  async function handleApprove(requestId: number) {
    const request = nutritionRequests.find((item) => item.id === requestId);
    if (!request) return;

    const canApprove = request.modifiedPlan.dailyMeals.length > 0;

    if (!canApprove) {
      setToast({
        type: "error",
        message: t("aiRequests.noNutritionPreview"),
      });
      return;
    }

    try {
      await approveMutation.mutateAsync(request);
      setToast({
        type: "success",
        message: t("aiRequests.nutritionApproved"),
      });
      await refreshAll();
      if (expandedRequest === requestId) {
        setExpandedRequest(null);
      }
    } catch {
      setToast({
        type: "error",
        message: t("aiRequests.nutritionApproveFailed"),
      });
    }
  }

  async function handleViewDetails(requestId: number) {
  try {
    setLoadingDetailsId(requestId);
    const full = (await getModificationRequestById(requestId)) as DetailApiResponse;

    setDetailsById((current) => ({
      ...current,
      [requestId]: full,
    }));

    const rawDailyMeals =
      full?.modified_plan?.daily_meals ??
      full?.modified_plan?.plan_data?.daily_meals ??
      [];

    const dailyMeals = rawDailyMeals.map((mealItem) => ({
      meal: String(mealItem?.meal ?? "Meal"),
      items: Array.isArray(mealItem?.items)
        ? mealItem.items.map((item) => ({
            foodId: Number(item?.food_id ?? item?.nutrition_id ?? item?.id ?? 0),
            name: String(item?.name ?? "Food"),
            calories: Number(item?.calories ?? 0),
            protein: Number(item?.protein ?? 0),
            carbs: Number(item?.carbs ?? 0),
            fat: Number(item?.fat ?? 0),
            quantity: Number(item?.quantity ?? 1),
          }))
        : [],
    }));

    setNutritionRequests((current) =>
      current.map((item) => {
        if (item.id !== requestId) return item;

        const rawPlanId =
          full?.modified_plan?.plan_id ?? full?.program_version_id ?? item.planId;

        return {
          ...item,
          planId: rawPlanId != null ? String(rawPlanId) : "",
          version: Number(
            full?.modified_plan?.version ?? full?.program_version_id ?? item.version
          ),
          requestDate: full?.created_at ?? item.requestDate,
          status: String(full?.status ?? item.status).toLowerCase() as
            | "pending"
            | "done"
            | "edited"
            | "approved",
          source: String(full?.source ?? item.source),
          userId: Number(full?.user_id ?? item.userId ?? 0),
          userName: full?.user?.name ? String(full.user.name) : item.userName,
          userRequest:
            full?.user_feedback?.modification_request ?? item.userRequest,
          changesSummary: Array.isArray(full?.changes_summary)
            ? full.changes_summary.map((x) => String(x))
            : item.changesSummary,
          recommendations: Array.isArray(full?.recommendations)
            ? full.recommendations.map((x) => String(x))
            : item.recommendations,
          modifiedPlan: {
            duration:
              dailyMeals.length > 0
                ? `${dailyMeals.length} meals`
                : "Not specified",
            dailyMeals,
          },
          email: full?.user?.email ? String(full.user.email) : item.email,
          goal: String(full?.user_feedback?.goal ?? item.goal),
          targetWeight: String(
            full?.user_feedback?.target_weight ?? item.targetWeight ?? ""
          ),
          notes: String(full?.user_feedback?.notes ?? item.notes ?? ""),
          dislikedFoods: Array.isArray(full?.user_feedback?.disliked_foods)
            ? full.user_feedback.disliked_foods.map((x) => String(x))
            : item.dislikedFoods,
        };
      })
    );

    setExpandedRequest(requestId);
  } catch {
    setToast({
      type: "error",
      message: t("aiRequests.detailsFailed"),
    });
  } finally {
    setLoadingDetailsId(null);
  }
}

  function handleFoodFieldChange(
    requestId: number,
    mealIndex: number,
    foodId: number,
    field: "quantity" | "calories" | "protein" | "carbs" | "fat" | "name",
    value: string
  ) {
    setNutritionRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            dailyMeals: request.modifiedPlan.dailyMeals.map((meal, index) => {
              if (index !== mealIndex) return meal;

              return {
                ...meal,
                items: meal.items.map((food) =>
                  food.foodId !== foodId
                    ? food
                    : {
                        ...food,
                        ...(field === "name"
                          ? { name: value }
                          : { [field]: Number(value || 0) }),
                      }
                ),
              };
            }),
          },
        };
      })
    );
  }

  function handleMealNameChange(
    requestId: number,
    mealIndex: number,
    value: string
  ) {
    setNutritionRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            dailyMeals: request.modifiedPlan.dailyMeals.map((meal, index) =>
              index !== mealIndex ? meal : { ...meal, meal: value }
            ),
          },
        };
      })
    );
  }

  function handleDeleteFood(requestId: number, mealIndex: number, foodId: number) {
    setNutritionRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            dailyMeals: request.modifiedPlan.dailyMeals.map((meal, index) => {
              if (index !== mealIndex) return meal;

              return {
                ...meal,
                items: meal.items.filter((food) => food.foodId !== foodId),
              };
            }),
          },
        };
      })
    );
  }

  function handleAddFoodManually(requestId: number, mealIndex: number) {
    setNutritionRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            dailyMeals: request.modifiedPlan.dailyMeals.map((meal, index) => {
              if (index !== mealIndex) return meal;

              return {
                ...meal,
                items: [
                  ...meal.items,
                  {
                    foodId: Date.now(),
                    name: "",
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    quantity: 1,
                  },
                ],
              };
            }),
          },
        };
      })
    );
  }

  async function handleSearchFoods(requestId: number, mealIndex: number) {
    const key = `food-${requestId}-${mealIndex}`;
    const query = foodSearchByMeal[key]?.trim();

    if (!query) return;

    try {
      setFoodSearchLoadingKey(key);
      const results = await searchFoods(query);

      const currentRequest = nutritionRequests.find((item) => item.id === requestId);
      const existingIds = new Set(
        currentRequest?.modifiedPlan.dailyMeals.flatMap((meal) =>
          meal.items.map((food) => food.foodId)
        ) ?? []
      );

      const filteredResults = results.filter((food) => !existingIds.has(food.id));

      setFoodResultsByMeal((current) => ({
        ...current,
        [key]: filteredResults,
      }));
    } catch {
      setToast({
        type: "error",
        message: t("aiRequests.searchFailed"),
      });
    } finally {
      setFoodSearchLoadingKey(null);
    }
  }

  function handleAddFoodFromSearch(
    requestId: number,
    mealIndex: number,
    food: SearchFoodsResultItem
  ) {
    setNutritionRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            dailyMeals: request.modifiedPlan.dailyMeals.map((meal, index) => {
              if (index !== mealIndex) return meal;

              const alreadyExists = meal.items.some(
                (item) => item.foodId === food.id
              );
              if (alreadyExists) return meal;

              return {
                ...meal,
                items: [...meal.items, createFoodFromSearchResult(food)],
              };
            }),
          },
        };
      })
    );
  }

  async function handleSaveChanges(requestId: number) {
    const request = nutritionRequests.find((item) => item.id === requestId);
    if (!request) return;

    try {
      await updateMutation.mutateAsync({
        id: requestId,
        payload: {
          status: request.status,
          changes_summary: request.changesSummary,
          modified_plan: {
            plan_id: request.planId || null,
            version: request.version,
            plan_data: {
              daily_meals: request.modifiedPlan.dailyMeals.map((meal) => ({
                meal: meal.meal,
                items: meal.items.map((food) => ({
                  food_id: food.foodId,
                  name: food.name,
                  calories: food.calories,
                  protein: food.protein,
                  carbs: food.carbs,
                  fat: food.fat,
                  quantity: food.quantity,
                })),
              })),
            },
          },
          recommendations: request.recommendations,
          user_feedback: {
            goal: request.goal,
            target_weight: request.targetWeight,
            disliked_foods: request.dislikedFoods,
            notes: request.notes,
            modification_request: request.userRequest,
          },
        },
      });

      setEditingRequestId(null);
      setToast({
        type: "success",
        message: t("aiRequests.updated"),
      });
      await refetch();
    } catch {
      setToast({
        type: "error",
        message: t("aiRequests.updateFailed"),
      });
    }
  }

  async function handleDeleteRequest(requestId: number) {
    try {
      await deleteMutation.mutateAsync(requestId);
      setToast({
        type: "success",
        message: t("aiRequests.deleted"),
      });
      if (expandedRequest === requestId) {
        setExpandedRequest(null);
      }
      await refetch();
    } catch {
      setToast({
        type: "error",
        message: t("aiRequests.deleteFailed"),
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] p-6 lg:p-8 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {toast ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0D7D6D]/20 flex-shrink-0">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                  {t("aiRequests.nutritionTitle")}
                </h1>
              </div>
              <p className="text-gray-500 text-base lg:text-lg">
                {t("aiRequests.nutritionSubtitle")}
              </p>
            </div>

            <Button
              onClick={() => refreshAll()}
              disabled={isFetching}
              className="h-11 px-5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700"
            >
              {isFetching ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 w-4 h-4" />
              )}
              {t("common.refresh")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              title={t("aiRequests.totalRequests")}
              value={totalRequests}
              icon={<Sparkles className="w-6 h-6 text-blue-600" />}
            />
            <StatCard
              title={t("aiRequests.pendingReview")}
              value={pendingReviewCount}
              valueClassName="text-amber-600"
              icon={<Clock className="w-6 h-6 text-amber-600" />}
            />
            <StatCard
              title={t("aiRequests.generatedPlans")}
              value={generatedCount}
              valueClassName="text-[#111827]"
              icon={<GitBranch className="w-6 h-6 text-cyan-600" />}
            />
            <StatCard
              title={t("aiRequests.modificationRequests")}
              value={modificationCount}
              valueClassName="text-[#111827]"
              icon={<RefreshCw className="w-6 h-6 text-violet-600" />}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={t("aiRequests.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-gray-200 text-[#111827] placeholder:text-gray-400 rounded-xl text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex items-center justify-center text-gray-600">
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
            {t("aiRequests.loadingNutrition")}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((request) => {
              const status =
                statusConfig[request.status as keyof typeof statusConfig] ??
                statusConfig.pending;

              const source =
                sourceConfig[request.source as keyof typeof sourceConfig] ??
                sourceConfig.modification;

              const isExpanded = expandedRequest === request.id;
              const hasModifiedPlan =
              Array.isArray(request.modifiedPlan.dailyMeals) &&
              request.modifiedPlan.dailyMeals.length > 0;
              const isEditing = editingRequestId === request.id;
              const detail = detailsById[request.id];
              const planTotals = calculatePlanTotals(request.modifiedPlan.dailyMeals);

              return (
                <div
                  key={request.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                          {request.userAvatar}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                              {request.userName}
                            </h3>

                            <div
                              className={`px-3 py-1 rounded-lg border ${status.bg} ${status.border}`}
                            >
                              <span className={`text-sm font-bold ${status.text}`}>
                                {getRequestStatusLabel(request.status, t)}
                              </span>
                            </div>

                            <div
                              className={`px-3 py-1 rounded-lg border ${source.bg} ${source.border}`}
                            >
                              <span className={`text-sm font-bold ${source.text}`}>
                                {getRequestSourceLabel(request.source, t)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="w-4 h-4" />
                              {t("aiRequests.requestId")}:{" "}
                              <strong className="text-[#111827]">{request.id}</strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              {t("aiRequests.planRef")}:{" "}
                              <strong className="text-[#111827]">
                                {request.planId || t("aiRequests.generatedRequest")}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              {t("aiRequests.version")}:{" "}
                              <strong className="text-[#111827]">
                                {request.version}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              {t("aiRequests.goal")}:{" "}
                              <strong className="text-[#111827]">
                                {request.displayGoal}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {formatRequestDate(request.requestDate)}
                            </span>
                          </div>

                          {request.targetWeight ? (
                            <div className="mt-2 text-sm text-gray-500">
                              {t("aiRequests.targetWeight")}:{" "}
                              <strong className="text-[#111827]">
                                {request.displayTargetWeight}
                              </strong>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          isExpanded
                            ? toggleExpand(request.id)
                            : handleViewDetails(request.id)
                        }
                        className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 h-10 px-4 self-start"
                      >
                        {loadingDetailsId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 w-4 h-4" />
                            {t("aiRequests.collapse")}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 w-4 h-4" />
                            {t("aiRequests.viewDetails")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="p-6 space-y-6 bg-[#FCFDFD]">
                      <SectionCard
                        icon={<Send className="w-5 h-5 text-amber-600" />}
                        title={t("aiRequests.userRequest")}
                        titleClassName="text-[#111827]"
                      >
                        <p className="text-gray-600 leading-relaxed break-words">
                          "{request.userRequest}"
                        </p>
                      </SectionCard>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionCard
                          icon={<User className="w-5 h-5 text-[#0D7D6D]" />}
                          title={t("aiRequests.requestContext")}
                          titleClassName="text-[#111827]"
                        >
                          <div className="space-y-3 text-sm text-gray-700">
                            <Row icon={<User className="w-4 h-4 mt-0.5 text-gray-500" />} label={t("aiRequests.user")} value={detail?.user?.name ?? request.userName} />
                            <Row icon={<Mail className="w-4 h-4 mt-0.5 text-gray-500" />} label={t("common.email")} value={detail?.user?.email ?? request.email ?? t("common.notAvailable")} />
                            <Row icon={<Target className="w-4 h-4 mt-0.5 text-gray-500" />} label={t("aiRequests.goal")} value={request.displayGoal || t("common.notAvailable")} />
                            <Row icon={<Target className="w-4 h-4 mt-0.5 text-gray-500" />} label={t("aiRequests.targetWeight")} value={request.displayTargetWeight || t("common.notAvailable")} />
                            <Row icon={<Utensils className="w-4 h-4 mt-0.5 text-gray-500" />} label={t("aiRequests.program")} value={detail?.program_version?.name ?? (request.source === "generated" ? t("aiRequests.generatedNutritionPlan") : request.planId || t("common.notAvailable"))} />
                            <Row icon={<Sparkles className="w-4 h-4 mt-0.5 text-gray-500" />} label={t("aiRequests.level")} value={detail?.program_version?.level ?? t("common.notAvailable")} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm font-semibold text-[#111827] mb-2">{t("aiRequests.notes")}</p>
                            <p className="text-sm text-gray-600 break-words">
                              {request.notes || t("aiRequests.noNotes")}
                            </p>
                          </div>
                        </SectionCard>

                        <SectionCard
                          icon={<Apple className="w-5 h-5 text-amber-600" />}
                          title={t("aiRequests.nutritionPreferences")}
                          titleClassName="text-[#111827]"
                        >
                          <div className="space-y-4 text-sm text-gray-700">
                            <div>
                              <p className="font-semibold text-[#111827] mb-2">
                                {t("aiRequests.dislikedFoods")}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {request.dislikedFoods.length ? (
                                  request.dislikedFoods.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 break-words"
                                    >
                                      {item}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-500">
                                    {t("aiRequests.noDislikedFoods")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </SectionCard>
                      </div>

                      <SectionCard
                        icon={<Sparkles className="w-5 h-5 text-cyan-600" />}
                        title={t("aiRequests.aiChangesSummary")}
                        titleClassName="text-cyan-700"
                        wrapperClassName="bg-cyan-50 border-cyan-200"
                      >
                        {request.changesSummary.length > 0 ? (
                          <ul className="space-y-2">
                            {request.changesSummary.map((change, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <span className="text-cyan-700 mt-1">•</span>
                                <span className="break-words">{change}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {t("aiRequests.noChanges")}
                          </p>
                        )}
                      </SectionCard>

                      {hasModifiedPlan ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Apple className="w-5 h-5 text-[#0D7D6D]" />
                            <h4 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827]">
                              {t("aiRequests.updatedPlanPreview")}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <MetricCard title={t("aiRequests.totalCalories")} value={planTotals.calories} />
                            <MetricCard title={t("aiRequests.totalProtein")} value={planTotals.protein} />
                            <MetricCard title={t("aiRequests.totalCarbs")} value={planTotals.carbs} />
                            <MetricCard title={t("aiRequests.totalFat")} value={planTotals.fat} />
                          </div>

                          {request.modifiedPlan.dailyMeals.map((meal, mealIndex) => {
                            const mealTotals = calculateMealTotals(meal);

                            return (
                              <div
                                key={`${request.id}-${mealIndex}`}
                                className="bg-white rounded-2xl p-6 border border-gray-200"
                              >
                                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center flex-shrink-0">
                                      <Apple className="w-5 h-5 text-white" />
                                    </div>

                                    <div className="min-w-0">
                                      {isEditing ? (
                                        <Input
                                          value={meal.meal}
                                          onChange={(e) =>
                                            handleMealNameChange(
                                              request.id,
                                              mealIndex,
                                              e.target.value
                                            )
                                          }
                                          className="h-10 border-gray-200 text-[#111827] font-semibold"
                                        />
                                      ) : (
                                        <h5 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                                          {meal.meal}
                                        </h5>
                                      )}
                                      <p className="text-sm text-gray-500">{t("aiRequests.mealSection")}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:min-w-[420px]">
                                    <MiniMetric label={t("aiRequests.calories")} value={mealTotals.calories} />
                                    <MiniMetric label={t("aiRequests.protein")} value={mealTotals.protein} />
                                    <MiniMetric label={t("aiRequests.carbs")} value={mealTotals.carbs} />
                                    <MiniMetric label={t("aiRequests.fat")} value={mealTotals.fat} />
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[920px]">
                                    <thead>
                                      <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          {t("aiRequests.food")}
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          {t("aiRequests.qty")}
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          {t("aiRequests.calories")}
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          {t("aiRequests.protein")}
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          {t("aiRequests.carbs")}
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          {t("aiRequests.fat")}
                                        </th>
                                        {isEditing ? (
                                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                            {t("common.actions")}
                                          </th>
                                        ) : null}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {meal.items.map((food) => (
                                        <tr
                                          key={food.foodId}
                                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                          <td className="py-4 px-4">
                                            {isEditing ? (
                                              <Input
                                                value={food.name}
                                                onChange={(e) =>
                                                  handleFoodFieldChange(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId,
                                                    "name",
                                                    e.target.value
                                                  )
                                                }
                                                className="bg-white border-gray-200 text-[#111827]"
                                              />
                                            ) : (
                                              <p className="font-semibold text-[#111827] break-words">
                                                {food.name}
                                              </p>
                                            )}
                                          </td>

                                          <td className="py-4 px-4 text-center">
                                            {isEditing ? (
                                              <Input
                                                type="number"
                                                value={food.quantity}
                                                onChange={(e) =>
                                                  handleFoodFieldChange(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId,
                                                    "quantity",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-20 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                              />
                                            ) : (
                                              <span className="text-[#111827] font-bold">
                                                {food.quantity}
                                              </span>
                                            )}
                                          </td>

                                          <td className="py-4 px-4 text-center">
                                            {isEditing ? (
                                              <Input
                                                type="number"
                                                value={food.calories}
                                                onChange={(e) =>
                                                  handleFoodFieldChange(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId,
                                                    "calories",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                              />
                                            ) : (
                                              <span className="text-[#111827] font-bold">
                                                {food.calories}
                                              </span>
                                            )}
                                          </td>

                                          <td className="py-4 px-4 text-center">
                                            {isEditing ? (
                                              <Input
                                                type="number"
                                                value={food.protein}
                                                onChange={(e) =>
                                                  handleFoodFieldChange(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId,
                                                    "protein",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                              />
                                            ) : (
                                              <span className="text-[#111827] font-bold">
                                                {food.protein}
                                              </span>
                                            )}
                                          </td>

                                          <td className="py-4 px-4 text-center">
                                            {isEditing ? (
                                              <Input
                                                type="number"
                                                value={food.carbs}
                                                onChange={(e) =>
                                                  handleFoodFieldChange(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId,
                                                    "carbs",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                              />
                                            ) : (
                                              <span className="text-[#111827] font-bold">
                                                {food.carbs}
                                              </span>
                                            )}
                                          </td>

                                          <td className="py-4 px-4 text-center">
                                            {isEditing ? (
                                              <Input
                                                type="number"
                                                value={food.fat}
                                                onChange={(e) =>
                                                  handleFoodFieldChange(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId,
                                                    "fat",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                              />
                                            ) : (
                                              <span className="text-[#111827] font-bold">
                                                {food.fat}
                                              </span>
                                            )}
                                          </td>

                                          {isEditing ? (
                                            <td className="py-4 px-4 text-center">
                                              <button
                                                onClick={() =>
                                                  handleDeleteFood(
                                                    request.id,
                                                    mealIndex,
                                                    food.foodId
                                                  )
                                                }
                                                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center transition-colors"
                                              >
                                                <Trash2 className="w-4 h-4 text-rose-600" />
                                              </button>
                                            </td>
                                          ) : null}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {isEditing ? (
                                  <div className="mt-5 space-y-3">
                                    {(() => {
                                      const mealKey = `food-${request.id}-${mealIndex}`;
                                      const searchResults =
                                        foodResultsByMeal[mealKey] ?? [];

                                      return (
                                        <>
                                          <div className="flex flex-col sm:flex-row gap-3">
                                            <Input
                                              value={foodSearchByMeal[mealKey] ?? ""}
                                              onChange={(e) =>
                                                setFoodSearchByMeal((current) => ({
                                                  ...current,
                                                  [mealKey]: e.target.value,
                                                }))
                                              }
                                              placeholder={t("aiRequests.searchFoodsPlaceholder")}
                                              className="bg-white border-gray-200 text-[#111827]"
                                            />
                                            <Button
                                              onClick={() =>
                                                handleSearchFoods(
                                                  request.id,
                                                  mealIndex
                                                )
                                              }
                                              className="bg-[#0D7D6D]/10 hover:bg-[#0D7D6D]/15 border border-[#0D7D6D]/20 text-[#0D7D6D] sm:w-auto w-full"
                                            >
                                              {foodSearchLoadingKey === mealKey ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <>
                                                  <Search className="mr-2 w-4 h-4" />
                                                  {t("common.search")}
                                                </>
                                              )}
                                            </Button>
                                          </div>

                                          {searchResults.length > 0 ? (
                                            <div className="grid gap-2">
                                              {searchResults.map((item) => (
                                                <div
                                                  key={item.id}
                                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                                                >
                                                  <div className="min-w-0">
                                                    <p className="text-[#111827] font-semibold break-words">
                                                      {item.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 break-words">
                                                      {item.category ?? t("aiRequests.food")} • Cal {item.calories}
                                                    </p>
                                                  </div>

                                                  <Button
                                                    onClick={() =>
                                                      handleAddFoodFromSearch(
                                                        request.id,
                                                        mealIndex,
                                                        item
                                                      )
                                                    }
                                                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 sm:w-auto w-full"
                                                  >
                                                    <Plus className="mr-2 w-4 h-4" />
                                                    {t("common.add")}
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}

                                          <Button
                                            onClick={() =>
                                              handleAddFoodManually(
                                                request.id,
                                                mealIndex
                                              )
                                            }
                                            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700"
                                          >
                                            <Plus className="mr-2 w-4 h-4" />
                                            {t("aiRequests.addFoodManually")}
                                          </Button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <SectionCard
                          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                          title={t("aiRequests.updatedPlanPreview")}
                          titleClassName="text-amber-700"
                          wrapperClassName="bg-amber-50 border-amber-200"
                        >
                          <p className="text-sm text-amber-700">
                            {t("aiRequests.noNutritionPreview")}
                          </p>
                        </SectionCard>
                      )}

                      <SectionCard
                        icon={<Sparkles className="w-5 h-5 text-blue-600" />}
                        title={t("aiRequests.aiRecommendations")}
                        titleClassName="text-blue-700"
                        wrapperClassName="bg-blue-50 border-blue-200"
                      >
                        {request.recommendations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {request.recommendations.map((rec, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-700 break-words"
                              >
                                {rec}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {t("aiRequests.noRecommendations")}
                          </p>
                        )}
                      </SectionCard>

                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 -mx-6 -mb-6 px-6 py-5">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                          {isEditing ? (
                            <Button
                              onClick={() => handleSaveChanges(request.id)}
                              disabled={updateMutation.isPending}
                              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              ) : (
                                <Save className="mr-2 w-5 h-5" />
                              )}
                              {t("aiRequests.saveChanges")}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setEditingRequestId(request.id)}
                              className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold"
                            >
                              <Edit2 className="mr-2 w-5 h-5" />
                              {t("aiRequests.editRequest")}
                            </Button>
                          )}

                          <Button
                            onClick={() => handleApprove(request.id)}
                            disabled={!hasModifiedPlan || approveMutation.isPending}
                            className="flex-1 h-14 bg-[#0D7D6D] hover:bg-[#0b6b5e] text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            ) : (
                              <Check className="mr-2 w-5 h-5" />
                            )}
                            {t("aiRequests.approveSavePlan")}
                          </Button>

                          <Button
                            onClick={() => handleDeleteRequest(request.id)}
                            disabled={deleteMutation.isPending}
                            variant="outline"
                            className="h-14 px-6 border-rose-200 text-rose-600 hover:bg-rose-50 text-base font-semibold"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 w-5 h-5" />
                            )}
                            {t("common.delete")}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingRequestId(null);
                              setExpandedRequest(null);
                            }}
                            className="h-14 px-6 border-gray-200 text-gray-600 hover:bg-gray-50 text-base font-semibold"
                          >
                            <X className="mr-2 w-5 h-5" />
                            {t("common.close")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {filteredRequests.length === 0 ? (
              <EmptyState
                icon={<RefreshCw className="w-10 h-10 text-gray-400" />}
                title={t("aiRequests.noNutritionTitle")}
                description={t("aiRequests.noNutritionDescription")}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  valueClassName = "text-[#111827]",
}: {
  title: string;
  value: number;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-w-0">
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#111827]">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
      <p className="text-[11px] uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#111827]">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  titleClassName,
  wrapperClassName = "bg-white border-gray-200",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  titleClassName: string;
  wrapperClassName?: string;
}) {
  return (
    <div className={`border rounded-2xl p-5 min-w-0 ${wrapperClassName}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 border border-gray-200">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={`text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold mb-3 ${titleClassName}`}
          >
            {title}
          </h4>
          {children}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <div>
        <span className="font-semibold text-[#111827]">{label}:</span> {value}
      </div>
    </div>
  );
}
