import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Save,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  User,
  Mail,
  ShieldAlert,
  HeartPulse,
  Sparkles,
  Send,
  Calendar,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  addExerciseToPendingPlanDay,
  removeExerciseFromPendingPlanDay,
  updatePendingPlanExercise,
  type PendingTrainingPlanItem,
  type PendingPlanContext,
} from "../../../utils/pendingTrainingPlans";
import type { SearchExerciseItem } from "../../../utils/aiPlanRequests";
import {
  getPendingPlanRequestContext,
  searchExercises,
} from "../../../services/pendingTrainingPlans";
import { usePendingTrainingPlans } from "../../../hooks/pendingTrainingPlans/queries/usePendingTrainingPlans";
import { useSavePendingTrainingPlan } from "../../../hooks/pendingTrainingPlans/mutations/useSavePendingTrainingPlan";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const difficultyColors: Record<string, string> = {
  beginner: "text-green-600",
  intermediate: "text-amber-600",
  advanced: "text-rose-600",
  medium: "text-amber-600",
};

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

export function PendingTrainingPlans() {
  const [plans, setPlans] = useState<PendingTrainingPlanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const [exerciseSearchByDay, setExerciseSearchByDay] = useState<
    Record<string, string>
  >({});
  const [exerciseResultsByDay, setExerciseResultsByDay] = useState<
    Record<string, SearchExerciseItem[]>
  >({});
  const [exerciseSearchLoadingKey, setExerciseSearchLoadingKey] = useState<
    string | null
  >(null);

  const [loadingContextPlanId, setLoadingContextPlanId] = useState<number | null>(
    null
  );
  const [requestContextByPlanId, setRequestContextByPlanId] = useState<
    Record<number, PendingPlanContext | null>
  >({});

  const {
    data: serverPlans = [],
    isLoading,
    isFetching,
    refetch,
  } = usePendingTrainingPlans();

  const saveMutation = useSavePendingTrainingPlan();

  useEffect(() => {
    setPlans(serverPlans);
  }, [serverPlans]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return plans;

    return plans.filter((plan) => {
      return (
        plan.name.toLowerCase().includes(q) ||
        String(plan.id).includes(q) ||
        (plan.description ?? "").toLowerCase().includes(q) ||
        (plan.requestContext?.userName ?? "").toLowerCase().includes(q) ||
        (plan.requestContext?.userRequest ?? "").toLowerCase().includes(q)
      );
    });
  }, [plans, searchQuery]);

  const totalPlans = plans.length;

  async function toggleExpand(plan: PendingTrainingPlanItem) {
    const nextExpanded = expandedPlanId === plan.id ? null : plan.id;
    setExpandedPlanId(nextExpanded);

    if (
      nextExpanded === plan.id &&
      plan.requestContext?.requestId &&
      !requestContextByPlanId[plan.id]
    ) {
      try {
        setLoadingContextPlanId(plan.id);
        const detail = await getPendingPlanRequestContext(
          plan.requestContext.requestId
        );
        setRequestContextByPlanId((current) => ({
          ...current,
          [plan.id]: detail,
        }));
      } catch (error) {
        console.error(error);
        setToast({
          type: "error",
          message: "Failed to load request context details.",
        });
      } finally {
        setLoadingContextPlanId(null);
      }
    }
  }

  function handleExerciseFieldChange(
    planId: number,
    dayNumber: number,
    exerciseId: number,
    field: "sets" | "reps" | "restSeconds",
    value: string
  ) {
    const patch =
      field === "sets" || field === "restSeconds"
        ? { [field]: Number(value || 0) }
        : { [field]: value };

    setPlans((current) =>
      updatePendingPlanExercise(current, planId, dayNumber, exerciseId, patch)
    );
  }

  function handleDeleteExercise(
    planId: number,
    dayNumber: number,
    exerciseId: number
  ) {
    setPlans((current) =>
      removeExerciseFromPendingPlanDay(current, planId, dayNumber, exerciseId)
    );
  }

  async function handleSearchExercises(planId: number, dayNumber: number) {
    const key = `${planId}-${dayNumber}`;
    const query = exerciseSearchByDay[key]?.trim();

    if (!query) return;

    try {
      setExerciseSearchLoadingKey(key);
      const results = await searchExercises(query);

      const currentPlan = plans.find((item) => item.id === planId);

      const existingExerciseIds = new Set(
        currentPlan?.schedule.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exerciseId)
        ) ?? []
      );

      const filteredResults = results.filter(
        (exercise) => !existingExerciseIds.has(exercise.id)
      );

      setExerciseResultsByDay((current) => ({
        ...current,
        [key]: filteredResults,
      }));
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to search exercises." });
    } finally {
      setExerciseSearchLoadingKey(null);
    }
  }

  function handleAddExercise(
    planId: number,
    dayNumber: number,
    exercise: SearchExerciseItem
  ) {
    setPlans((current) =>
      addExerciseToPendingPlanDay(current, planId, dayNumber, exercise)
    );
  }

  async function handleSave(planId: number) {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;

    try {
      await saveMutation.mutateAsync(plan);
      setToast({ type: "success", message: "Training plan saved successfully." });
      await refetch();
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to save training plan." });
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
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                  Pending Training Plans
                </h1>
              </div>
              <p className="text-gray-500 text-base lg:text-lg">
                Review pending plans with their original request context before approving
              </p>
            </div>

            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-11 px-5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700"
            >
              {isFetching ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>

          <div className="mb-6">
            <StatCard
              title="Total Plans"
              value={totalPlans}
              icon={<Dumbbell className="w-6 h-6 text-blue-600" />}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by plan name, plan ID, member name, or request..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-gray-200 text-[#111827] placeholder:text-gray-400 rounded-xl text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex items-center justify-center text-gray-600">
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
            Loading pending training plans...
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPlans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;
              const context = requestContextByPlanId[plan.id] ?? plan.requestContext;

              return (
                <div
                  key={plan.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                          {context?.userAvatar ?? "TP"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                              {plan.name}
                            </h3>
                            <div className="px-3 py-1 rounded-lg border bg-amber-50 border-amber-200">
                              <span className="text-sm font-bold text-amber-700">
                                Pending
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>
                              Plan ID: <strong className="text-[#111827]">{plan.id}</strong>
                            </span>
                            <span>
                              Days:{" "}
                              <strong className="text-[#111827]">{plan.totalDays}</strong>
                            </span>
                            <span>
                              Exercises:{" "}
                              <strong className="text-[#111827]">{plan.totalExercises}</strong>
                            </span>
                            {context?.requestId ? (
                              <span>
                                Request ID:{" "}
                                <strong className="text-[#111827]">
                                  {context.requestId}
                                </strong>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => toggleExpand(plan)}
                        className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 h-10 px-4 self-start"
                      >
                        {loadingContextPlanId === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 w-4 h-4" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 w-4 h-4" />
                            View Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="p-6 space-y-6 bg-[#FCFDFD]">
                      {context ? (
                        <>
                          <SectionCard
                            icon={<Send className="w-5 h-5 text-amber-600" />}
                            title="Original User Request"
                            titleClassName="text-[#111827]"
                          >
                            <p className="text-gray-600 leading-relaxed break-words">
                              "{context.userRequest}"
                            </p>
                          </SectionCard>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <SectionCard
                              icon={<User className="w-5 h-5 text-[#0D7D6D]" />}
                              title="Request Context"
                              titleClassName="text-[#111827]"
                            >
                              <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex items-start gap-2">
                                  <User className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      User:
                                    </span>{" "}
                                    {context.userName}
                                  </div>
                                </div>

                                <div className="flex items-start gap-2 break-all">
                                  <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      Email:
                                    </span>{" "}
                                    {context.userEmail ?? "N/A"}
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <Dumbbell className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      Program:
                                    </span>{" "}
                                    {context.programName ?? `Plan ${plan.id}`}
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      Level:
                                    </span>{" "}
                                    {context.programLevel ?? "N/A"}
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <ShieldAlert className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      Difficulty:
                                    </span>{" "}
                                    {context.difficulty ?? "N/A"}
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <HeartPulse className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      Pain Areas:
                                    </span>{" "}
                                    {context.painAreas.length
                                      ? context.painAreas.join(", ")
                                      : "None"}
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 mt-0.5 text-gray-500" />
                                  <div>
                                    <span className="font-semibold text-[#111827]">
                                      Request Date:
                                    </span>{" "}
                                    {formatRequestDate(context.requestDate)}
                                  </div>
                                </div>
                              </div>
                            </SectionCard>

                            <SectionCard
                              icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                              title="Exercise Preferences"
                              titleClassName="text-[#111827]"
                            >
                              <div className="space-y-4 text-sm text-gray-700">
                                <div>
                                  <p className="font-semibold text-[#111827] mb-2">
                                    Preferred Exercises
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {context.likedExercises.length ? (
                                      context.likedExercises.map((item, idx) => (
                                        <span
                                          key={idx}
                                          className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 break-words"
                                        >
                                          {item}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-500">
                                        No preferred exercises.
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <p className="font-semibold text-[#111827] mb-2">
                                    Avoid Exercises
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {context.dislikedExercises.length ? (
                                      context.dislikedExercises.map((item, idx) => (
                                        <span
                                          key={idx}
                                          className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 break-words"
                                        >
                                          {item}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-500">
                                        No avoided exercises.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SectionCard>
                          </div>

                          <SectionCard
                            icon={<Sparkles className="w-5 h-5 text-cyan-600" />}
                            title="AI Changes Summary"
                            titleClassName="text-cyan-700"
                            wrapperClassName="bg-cyan-50 border-cyan-200"
                          >
                            {context.changesSummary.length > 0 ? (
                              <ul className="space-y-2">
                                {context.changesSummary.map((change, index) => (
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
                                No summarized changes were returned.
                              </p>
                            )}
                          </SectionCard>

                          <SectionCard
                            icon={<Sparkles className="w-5 h-5 text-blue-600" />}
                            title="AI Recommendations"
                            titleClassName="text-blue-700"
                            wrapperClassName="bg-blue-50 border-blue-200"
                          >
                            {context.recommendations.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {context.recommendations.map((rec, idx) => (
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
                                No recommendations returned.
                              </p>
                            )}
                          </SectionCard>
                        </>
                      ) : (
                        <SectionCard
                          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                          title="Request Context"
                          titleClassName="text-amber-700"
                          wrapperClassName="bg-amber-50 border-amber-200"
                        >
                          <p className="text-sm text-amber-700">
                            No linked modification request details were found for this pending plan.
                          </p>
                        </SectionCard>
                      )}

                      {plan.schedule.map((day) => (
                        <div
                          key={`${plan.id}-${day.day}`}
                          className="bg-white rounded-2xl p-6 border border-gray-200"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center flex-shrink-0">
                              <Dumbbell className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827]">
                                Day {day.day}
                              </h4>
                              <p className="text-sm text-gray-500 break-words">
                                {day.title}
                              </p>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px]">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                    Exercise
                                  </th>
                                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                    Difficulty
                                  </th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                    Sets
                                  </th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                    Reps
                                  </th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                    Rest
                                  </th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {day.exercises.map((exercise) => (
                                  <tr
                                    key={exercise.exerciseId}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="py-4 px-4">
                                      <p className="font-semibold text-[#111827] break-words">
                                        {exercise.name}
                                      </p>
                                    </td>

                                    <td className="py-4 px-4">
                                      <span
                                        className={`text-sm font-semibold ${
                                          difficultyColors[
                                            exercise.difficulty.toLowerCase()
                                          ] ?? "text-gray-600"
                                        }`}
                                      >
                                        {exercise.difficulty}
                                      </span>
                                    </td>

                                    <td className="py-4 px-4 text-center">
                                      <Input
                                        type="number"
                                        value={exercise.sets}
                                        onChange={(e) =>
                                          handleExerciseFieldChange(
                                            plan.id,
                                            day.day,
                                            exercise.exerciseId,
                                            "sets",
                                            e.target.value
                                          )
                                        }
                                        className="w-20 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                      />
                                    </td>

                                    <td className="py-4 px-4 text-center">
                                      <Input
                                        value={exercise.reps}
                                        onChange={(e) =>
                                          handleExerciseFieldChange(
                                            plan.id,
                                            day.day,
                                            exercise.exerciseId,
                                            "reps",
                                            e.target.value
                                          )
                                        }
                                        className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                      />
                                    </td>

                                    <td className="py-4 px-4 text-center">
                                      <Input
                                        type="number"
                                        value={exercise.restSeconds}
                                        onChange={(e) =>
                                          handleExerciseFieldChange(
                                            plan.id,
                                            day.day,
                                            exercise.exerciseId,
                                            "restSeconds",
                                            e.target.value
                                          )
                                        }
                                        className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                      />
                                    </td>

                                    <td className="py-4 px-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() =>
                                            handleDeleteExercise(
                                              plan.id,
                                              day.day,
                                              exercise.exerciseId
                                            )
                                          }
                                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4 text-rose-600" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-5 space-y-3">
                            {(() => {
                              const dayKey = `${plan.id}-${day.day}`;
                              const searchResults = exerciseResultsByDay[dayKey] ?? [];

                              return (
                                <>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                      value={exerciseSearchByDay[dayKey] ?? ""}
                                      onChange={(e) =>
                                        setExerciseSearchByDay((current) => ({
                                          ...current,
                                          [dayKey]: e.target.value,
                                        }))
                                      }
                                      placeholder="Search exercises to add..."
                                      className="bg-white border-gray-200 text-[#111827]"
                                    />
                                    <Button
                                      onClick={() =>
                                        handleSearchExercises(plan.id, day.day)
                                      }
                                      className="bg-[#0D7D6D]/10 hover:bg-[#0D7D6D]/15 border border-[#0D7D6D]/20 text-[#0D7D6D] sm:w-auto w-full"
                                    >
                                      {exerciseSearchLoadingKey === dayKey ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Search className="mr-2 w-4 h-4" />
                                          Search
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
                                              {item.muscleGroup ?? "Unknown group"} •{" "}
                                              {item.difficulty}
                                            </p>
                                          </div>

                                          <Button
                                            onClick={() =>
                                              handleAddExercise(plan.id, day.day, item)
                                            }
                                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 sm:w-auto w-full"
                                          >
                                            <Plus className="mr-2 w-4 h-4" />
                                            Add
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-gray-100">
                        <Button
                          onClick={() => handleSave(plan.id)}
                          disabled={saveMutation.isPending}
                          className="flex-1 h-14 bg-[#0D7D6D] hover:bg-[#0b6b5e] text-white text-base font-semibold"
                        >
                          {saveMutation.isPending && saveMutation.variables?.id === plan.id ? (
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="mr-2 w-5 h-5" />
                          )}
                          Save Edited Plan
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setExpandedPlanId(null)}
                          className="h-14 px-8 border-gray-200 text-gray-600 hover:bg-gray-50 text-base font-semibold"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {filteredPlans.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="w-10 h-10 text-gray-400" />}
                title="No pending training plans found"
                description="There are no pending plans right now."
                action={
                  <Button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="mt-6 h-11 px-5 bg-[#0D7D6D] hover:bg-[#0b6b5e] text-white"
                  >
                    {isFetching ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 w-4 h-4" />
                    )}
                    Refresh Plans
                  </Button>
                }
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

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
      {action}
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