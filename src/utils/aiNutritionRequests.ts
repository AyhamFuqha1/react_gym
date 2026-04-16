export interface NutritionFoodItem {
  foodId: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
}

export interface NutritionMeal {
  meal: string;
  items: NutritionFoodItem[];
}

export interface NutritionModificationRequestItem {
  id: number;
  planId: string;
  version: number;
  requestDate: string | null;
  status: "pending" | "done" | "edited" | "approved";
  source: "generated" | "modification" | string;
  userId: number | null;
  userName: string;
  userAvatar: string;
  userRequest: string;
  changesSummary: string[];
  modifiedPlan: {
    duration: string;
    dailyMeals: NutritionMeal[];
  };
  recommendations: string[];
  goal: string;
  targetWeight: string;
  email: string;
  notes: string;
  dislikedFoods: string[];
}

export interface SearchFoodsResultItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string | null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function toTitleCase(value: string): string {
  if (!value) return "";
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function buildAvatar(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getNestedRecord(
  record: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown> | null {
  const value = record?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeFoodItem(raw: unknown): NutritionFoodItem {
  const item = (raw ?? {}) as Record<string, unknown>;
  const foodMeta = getNestedRecord(item, "food");
  const metadata = getNestedRecord(item, "metadata");

  return {
    foodId: toNumber(
      item.food_id ?? item.nutrition_id ?? item.id ?? foodMeta?.id ?? metadata?.id
    ),
    name: toString(item.name ?? foodMeta?.name ?? metadata?.name, "Food"),
    calories: toNumber(item.calories ?? foodMeta?.calories ?? metadata?.calories),
    protein: toNumber(item.protein ?? foodMeta?.protein ?? metadata?.protein),
    carbs: toNumber(item.carbs ?? foodMeta?.carbs ?? metadata?.carbs),
    fat: toNumber(item.fat ?? foodMeta?.fat ?? metadata?.fat),
    quantity: toNumber(item.quantity, 1),
  };
}

function normalizeMeal(raw: unknown): NutritionMeal {
  const meal = (raw ?? {}) as Record<string, unknown>;

  return {
    meal: toString(meal.meal ?? meal.meal_type ?? meal.name, "Meal"),
    items: toArray(meal.items ?? meal.foods).map(normalizeFoodItem),
  };
}

function extractPlanId(root: Record<string, unknown>): string {
  const modifiedPlan = getNestedRecord(root, "modified_plan");
  const currentPlan = getNestedRecord(root, "current_plan");
  const planData = getNestedRecord(modifiedPlan, "plan_data");

  const rawPlanId =
    modifiedPlan?.plan_id ??
    currentPlan?.id ??
    root.plan_id ??
    root.current_plan_id ??
    root.program_version_id ??
    planData?.plan_id ??
    "";

  return rawPlanId != null ? String(rawPlanId) : "";
}

function extractVersion(root: Record<string, unknown>): number {
  const modifiedPlan = getNestedRecord(root, "modified_plan");

  return toNumber(
    modifiedPlan?.version ?? root.version ?? root.program_version_id ?? 1,
    1
  );
}

function extractDailyMeals(root: Record<string, unknown>): NutritionMeal[] {
  const modifiedPlan = getNestedRecord(root, "modified_plan");
  const planData = getNestedRecord(modifiedPlan, "plan_data");

  const rawMeals =
    modifiedPlan?.daily_meals ??
    planData?.daily_meals ??
    root.daily_meals ??
    [];

  return toArray(rawMeals).map(normalizeMeal);
}

function extractUserName(root: Record<string, unknown>): string {
  const user = getNestedRecord(root, "user");
  const member = getNestedRecord(root, "member");

  return toString(
    user?.name ?? member?.name ?? root.user_name ?? `User #${root.user_id ?? "Unknown"}`
  );
}

function extractEmail(root: Record<string, unknown>): string {
  const user = getNestedRecord(root, "user");
  const member = getNestedRecord(root, "member");

  return toString(user?.email ?? member?.email ?? root.email ?? "N/A");
}

function extractGoal(root: Record<string, unknown>): string {
  const userFeedback = getNestedRecord(root, "user_feedback");
  const goal = getNestedRecord(root, "goal");
  const user = getNestedRecord(root, "user");
  const profile = getNestedRecord(root, "profile");

  return toTitleCase(
    toString(
      userFeedback?.goal ??
        goal?.goal_type ??
        root.goal ??
        root.goal_type ??
        user?.goal ??
        profile?.goal_type ??
        "No goal"
    )
  );
}

function extractTargetWeight(root: Record<string, unknown>): string {
  const user = getNestedRecord(root, "user");
  const profile = getNestedRecord(root, "profile");
  const userFeedback = getNestedRecord(root, "user_feedback");

  return toString(
    user?.target_weight ??
      profile?.target_weight ??
      userFeedback?.target_weight ??
      root.target_weight ??
      ""
  );
}

function extractNotes(root: Record<string, unknown>): string {
  const userFeedback = getNestedRecord(root, "user_feedback");
  return toString(userFeedback?.notes ?? root.notes ?? "");
}

function extractDislikedFoods(root: Record<string, unknown>): string[] {
  const userFeedback = getNestedRecord(root, "user_feedback");
  return normalizeStringArray(userFeedback?.disliked_foods ?? root.disliked_foods);
}

function extractUserRequest(root: Record<string, unknown>, source: string): string {
  const userFeedback = getNestedRecord(root, "user_feedback");

  return toString(
    userFeedback?.modification_request ??
      root.user_request ??
      root.modification_request ??
      (source === "generated"
        ? "AI generated a new nutrition plan for coach review."
        : "Nutrition modification request")
  );
}

export function normalizeNutritionModificationRequestsResponse(
  raw: any
): NutritionModificationRequestItem[] {
  const sourceItems = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
      ? raw
      : [];

  return sourceItems.map((item: any) => {
    const source = String(item?.source ?? "modification").toLowerCase();
    const userName = extractUserName(item);
    const dailyMeals = extractDailyMeals(item);

    return {
      id: Number(item?.id ?? 0),
      planId: extractPlanId(item),
      version: extractVersion(item),
      requestDate: item?.created_at ? String(item.created_at) : null,
      status: String(item?.status ?? "pending").toLowerCase() as
        | "pending"
        | "done"
        | "edited"
        | "approved",
      source,
      userId: item?.user_id != null ? Number(item.user_id) : null,
      userName,
      userAvatar: buildAvatar(userName),
      userRequest: extractUserRequest(item, source),
      changesSummary: Array.isArray(item?.changes_summary)
        ? item.changes_summary.map((entry: any) => String(entry))
        : [],
      modifiedPlan: {
        duration: dailyMeals.length > 0 ? `${dailyMeals.length} meals` : "Not specified",
        dailyMeals,
      },
      recommendations: Array.isArray(item?.recommendations)
        ? item.recommendations.map((entry: any) => String(entry))
        : [],
      goal: extractGoal(item),
      targetWeight: extractTargetWeight(item),
      email: extractEmail(item),
      notes: extractNotes(item),
      dislikedFoods: extractDislikedFoods(item),
    };
  });
}

export function normalizeSearchFoodsResponse(raw: any): SearchFoodsResultItem[] {
  const results = Array.isArray(raw?.results) ? raw.results : [];

  return results.map((item: any) => ({
    id: Number(item?.metadata?.id ?? item?.id ?? 0),
    name: String(item?.metadata?.name ?? item?.name ?? "Food"),
    calories: Number(item?.metadata?.calories ?? item?.calories ?? 0),
    protein: Number(item?.metadata?.protein ?? item?.protein ?? 0),
    carbs: Number(item?.metadata?.carbs ?? item?.carbs ?? 0),
    fat: Number(item?.metadata?.fat ?? item?.fat ?? 0),
    category: item?.metadata?.category
      ? String(item.metadata.category)
      : item?.category
        ? String(item.category)
        : null,
  }));
}

export function createFoodFromSearchResult(
  result: SearchFoodsResultItem
): NutritionFoodItem {
  return {
    foodId: result.id,
    name: result.name,
    calories: result.calories,
    protein: result.protein,
    carbs: result.carbs,
    fat: result.fat,
    quantity: 1,
  };
}

export function calculateMealTotals(meal: NutritionMeal) {
  return meal.items.reduce(
    (totals, item) => {
      const quantity = item.quantity || 1;
      totals.calories += item.calories * quantity;
      totals.protein += item.protein * quantity;
      totals.carbs += item.carbs * quantity;
      totals.fat += item.fat * quantity;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function calculatePlanTotals(meals: NutritionMeal[]) {
  return meals.reduce(
    (totals, meal) => {
      const mealTotals = calculateMealTotals(meal);
      totals.calories += mealTotals.calories;
      totals.protein += mealTotals.protein;
      totals.carbs += mealTotals.carbs;
      totals.fat += mealTotals.fat;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function buildApproveNutritionPayload(
  request: NutritionModificationRequestItem
) {
  return {
    ...(request.planId ? { plan_id: request.planId } : {}),
    daily_meals: request.modifiedPlan.dailyMeals.map((meal) => ({
      meal: meal.meal,
      items: meal.items.map((item) => ({
        food_id: Number(item.foodId),
        name: item.name,
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        quantity: Number(item.quantity),
      })),
    })),
  };
}

export function buildUpdateNutritionModificationPayload(
  request: NutritionModificationRequestItem
) {
  return {
    status: request.status,
    changes_summary: request.changesSummary,
    modified_plan: {
      plan_id: request.planId || null,
      version: request.version,
      plan_data: {
        daily_meals: request.modifiedPlan.dailyMeals.map((meal) => ({
          meal: meal.meal,
          items: meal.items.map((item) => ({
            food_id: item.foodId,
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantity: item.quantity,
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
  };
}