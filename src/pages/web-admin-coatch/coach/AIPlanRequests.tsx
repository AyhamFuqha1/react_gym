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
  Dumbbell,
  Save,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  Plus,
  Mail,
  ShieldAlert,
  HeartPulse,
  GitBranch,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type {
  ModificationRequestItem,
  SearchExerciseItem,
} from "../../../utils/aiPlanRequests";
import { getModificationRequestById, searchExercises } from "../../../services/aiPlanRequests";
import { useTrainingModificationRequests } from "../../../hooks/aiPlanRequests/queries/useTrainingModificationRequests";
import { useApproveTrainingModification } from "../../../hooks/aiPlanRequests/mutations/useApproveTrainingModification";
import { useUpdateModificationRequest } from "../../../hooks/aiPlanRequests/mutations/useUpdateModificationRequest";
import { useDeleteModificationRequest } from "../../../hooks/aiPlanRequests/mutations/useDeleteModificationRequest";
import { useUserGoals } from "../../../hooks/aiPlanRequests/queries/useUserGoals";

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

const difficultyColors: Record<string, string> = {
  beginner: "text-green-600",
  intermediate: "text-amber-600",
  advanced: "text-rose-600",
  medium: "text-amber-600",
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type DetailApiExercise = {
  name: string;
  reps: string;
  sets: number;
  difficulty: string;
  exercise_id: number;
  muscle_group: string | null;
  rest_seconds: number;
};

type DetailApiDay = {
  day: number;
  focus?: string;
  exercises: DetailApiExercise[];
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
    plan_data: {
      duration_weeks?: number;
      schedule: DetailApiDay[];
    };
  } | null;
  recommendations: string[];
  user_feedback?: {
    difficulty?: string;
    pain_areas?: string[];
    liked_exercises?: string[];
    disliked_exercises?: string[];
    modification_request?: string;
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
  };
};

type EnrichedModificationRequestItem = ModificationRequestItem & {
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

function guessDayTitle(
  day: number,
  exercises: { muscleGroup: string | null }[],
  focus?: string
) {
  if (focus?.trim()) return focus;

  const groups = Array.from(
    new Set(exercises.map((item) => item.muscleGroup).filter(Boolean))
  ) as string[];

  if (groups.length === 0) return `Day ${day} Workout`;
  if (groups.length === 1) return groups[0];
  if (groups.length === 2) return `${groups[0]} & ${groups[1]}`;
  return `Day ${day} Workout`;
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

export function AIPlanRequests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [modificationRequests, setModificationRequests] = useState<
    ModificationRequestItem[]
  >([]);
  const [editingModificationId, setEditingModificationId] = useState<number | null>(
    null
  );
  const [toast, setToast] = useState<ToastState>(null);
  const { data: userGoals = [] } = useUserGoals();
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);

  const [modificationDetailsById, setModificationDetailsById] = useState<
    Record<number, DetailApiResponse>
  >({});

  const [modExerciseSearchByDay, setModExerciseSearchByDay] = useState<
    Record<string, string>
  >({});
  const [modExerciseResultsByDay, setModExerciseResultsByDay] = useState<
    Record<string, SearchExerciseItem[]>
  >({});
  const [modExerciseSearchLoadingKey, setModExerciseSearchLoadingKey] = useState<
    string | null
  >(null);

  const {
    data: serverRequests = [],
    isLoading,
    isFetching,
    refetch: refetchModificationRequests,
  } = useTrainingModificationRequests();

  const approveMutation = useApproveTrainingModification();
  const updateMutation = useUpdateModificationRequest();
  const deleteMutation = useDeleteModificationRequest();

  useEffect(() => {
    setModificationRequests(serverRequests);
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

  const enrichedRequests = useMemo<EnrichedModificationRequestItem[]>(() => {
    return modificationRequests.map((request) => {
      const goalInfo = goalsMap.get(Number(request.userId ?? 0));

      return {
        ...request,
        displayGoal: goalInfo?.goal ?? "No goal",
        displayTargetWeight: goalInfo?.targetWeight ?? "",
      };
    });
  }, [modificationRequests, goalsMap]);

  const filteredRequests = useMemo(() => {
    return enrichedRequests.filter((request) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        request.userName.toLowerCase().includes(q) ||
        String(request.id).includes(q) ||
        request.planId.toLowerCase().includes(q) ||
        request.displayGoal.toLowerCase().includes(q) ||
        request.source.toLowerCase().includes(q)
      );
    });
  }, [enrichedRequests, searchQuery]);

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
    await refetchModificationRequests();
  }

  async function handleApprove(requestId: number) {
    const request = modificationRequests.find((item) => item.id === requestId);
    if (!request) return;

    const canApprove = request.modifiedPlan.schedule.length > 0;

    if (!canApprove) {
      setToast({
        type: "error",
        message: "This request does not have a valid plan preview yet.",
      });
      return;
    }

    try {
      await approveMutation.mutateAsync(request);
      setToast({
        type: "success",
        message: "Plan approved and saved successfully.",
      });
      await refreshAll();
      if (expandedRequest === requestId) {
        setExpandedRequest(null);
      }
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        message: "Failed to approve and save the plan.",
      });
    }
  }

  async function handleViewModificationDetails(requestId: number) {
    try {
      setLoadingDetailsId(requestId);
      const full = (await getModificationRequestById(requestId)) as DetailApiResponse;

      setModificationDetailsById((current) => ({
        ...current,
        [requestId]: full,
      }));

      const schedule =
        full?.modified_plan?.plan_data?.schedule?.map((dayItem) => {
          const exercises = (dayItem.exercises ?? []).map((exercise) => ({
            exerciseId: Number(exercise.exercise_id ?? 0),
            name: String(exercise.name ?? "Exercise"),
            muscleGroup: exercise.muscle_group ?? null,
            difficulty: String(exercise.difficulty ?? "beginner"),
            sets: Number(exercise.sets ?? 0),
            reps: String(exercise.reps ?? ""),
            restSeconds: Number(exercise.rest_seconds ?? 0),
            dayNumber: Number(dayItem.day ?? 1),
          }));

          return {
            day: Number(dayItem.day ?? 1),
            title: guessDayTitle(
              Number(dayItem.day ?? 1),
              exercises,
              dayItem.focus
            ),
            exercises,
          };
        }) ?? [];

      setModificationRequests((current) =>
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
                full?.modified_plan?.plan_data?.duration_weeks != null
                  ? `${full.modified_plan.plan_data.duration_weeks} weeks`
                  : schedule.length > 0
                    ? `${schedule.length} days`
                    : item.modifiedPlan.duration,
              schedule,
            },
          };
        })
      );

      setExpandedRequest(requestId);
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        message: "Failed to load request details.",
      });
    } finally {
      setLoadingDetailsId(null);
    }
  }

  function handleModificationExerciseFieldChange(
    requestId: number,
    dayNumber: number,
    exerciseId: number,
    field: "sets" | "reps" | "restSeconds",
    value: string
  ) {
    setModificationRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            schedule: request.modifiedPlan.schedule.map((day) => {
              if (day.day !== dayNumber) return day;

              return {
                ...day,
                exercises: day.exercises.map((exercise) =>
                  exercise.exerciseId !== exerciseId
                    ? exercise
                    : {
                        ...exercise,
                        ...(field === "sets" || field === "restSeconds"
                          ? { [field]: Number(value || 0) }
                          : { [field]: value }),
                      }
                ),
              };
            }),
          },
        };
      })
    );
  }

  function handleModificationDeleteExercise(
    requestId: number,
    dayNumber: number,
    exerciseId: number
  ) {
    setModificationRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            schedule: request.modifiedPlan.schedule.map((day) => {
              if (day.day !== dayNumber) return day;

              return {
                ...day,
                exercises: day.exercises.filter(
                  (exercise) => exercise.exerciseId !== exerciseId
                ),
              };
            }),
          },
        };
      })
    );
  }

  async function handleModificationSearchExercises(
    requestId: number,
    dayNumber: number
  ) {
    const key = `mod-${requestId}-${dayNumber}`;
    const query = modExerciseSearchByDay[key]?.trim();

    if (!query) return;

    try {
      setModExerciseSearchLoadingKey(key);
      const results = await searchExercises(query);

      const currentRequest = modificationRequests.find(
        (item) => item.id === requestId
      );

      const existingExerciseIds = new Set(
        currentRequest?.modifiedPlan.schedule.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exerciseId)
        ) ?? []
      );

      const filteredResults = results.filter(
        (exercise) => !existingExerciseIds.has(exercise.id)
      );

      setModExerciseResultsByDay((current) => ({
        ...current,
        [key]: filteredResults,
      }));
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to search exercises." });
    } finally {
      setModExerciseSearchLoadingKey(null);
    }
  }

  function handleModificationAddExercise(
    requestId: number,
    dayNumber: number,
    exercise: SearchExerciseItem
  ) {
    setModificationRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) return request;

        return {
          ...request,
          modifiedPlan: {
            ...request.modifiedPlan,
            schedule: request.modifiedPlan.schedule.map((day) => {
              if (day.day !== dayNumber) return day;

              const alreadyExists = day.exercises.some(
                (item) => item.exerciseId === exercise.id
              );

              if (alreadyExists) return day;

              return {
                ...day,
                exercises: [
                  ...day.exercises,
                  {
                    exerciseId: exercise.id,
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup ?? null,
                    difficulty: exercise.difficulty,
                    sets: 2,
                    reps: "12-15",
                    restSeconds: 90,
                    dayNumber,
                  },
                ],
              };
            }),
          },
        };
      })
    );
  }

  async function handleSaveModificationChanges(requestId: number) {
    const request = modificationRequests.find((item) => item.id === requestId);
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
              schedule: request.modifiedPlan.schedule.map((day) => ({
                day: day.day,
                exercises: day.exercises.map((exercise) => ({
                  name: exercise.name,
                  reps: exercise.reps,
                  sets: exercise.sets,
                  difficulty: exercise.difficulty,
                  exercise_id: exercise.exerciseId,
                  muscle_group: exercise.muscleGroup,
                  rest_seconds: exercise.restSeconds,
                })),
              })),
            },
          },
          recommendations: request.recommendations,
          user_feedback: {
            difficulty: modificationDetailsById[requestId]?.user_feedback?.difficulty,
            pain_areas:
              modificationDetailsById[requestId]?.user_feedback?.pain_areas ?? [],
            liked_exercises:
              modificationDetailsById[requestId]?.user_feedback?.liked_exercises ?? [],
            disliked_exercises:
              modificationDetailsById[requestId]?.user_feedback?.disliked_exercises ?? [],
            modification_request: request.userRequest,
          },
        },
      });

      setEditingModificationId(null);
      setToast({
        type: "success",
        message: "Request updated successfully.",
      });
      await refetchModificationRequests();
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        message: "Failed to update request.",
      });
    }
  }

  async function handleDeleteModification(requestId: number) {
    try {
      await deleteMutation.mutateAsync(requestId);
      setToast({
        type: "success",
        message: "Request deleted successfully.",
      });
      if (expandedRequest === requestId) {
        setExpandedRequest(null);
      }
      await refetchModificationRequests();
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        message: "Failed to delete request.",
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
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                  Training Plan Requests
                </h1>
              </div>
              <p className="text-gray-500 text-base lg:text-lg">
                Review AI-generated and modified training plans
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
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Requests"
              value={totalRequests}
              icon={<Sparkles className="w-6 h-6 text-blue-600" />}
            />
            <StatCard
              title="Pending Review"
              value={pendingReviewCount}
              valueClassName="text-amber-600"
              icon={<Clock className="w-6 h-6 text-amber-600" />}
            />
            <StatCard
              title="Generated Plans"
              value={generatedCount}
              valueClassName="text-[#111827]"
              icon={<GitBranch className="w-6 h-6 text-cyan-600" />}
            />
            <StatCard
              title="Modification Requests"
              value={modificationCount}
              valueClassName="text-[#111827]"
              icon={<RefreshCw className="w-6 h-6 text-violet-600" />}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by member name, request ID, plan reference, goal, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-gray-200 text-[#111827] placeholder:text-gray-400 rounded-xl text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex items-center justify-center text-gray-600">
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
            Loading plan requests...
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((modRequest) => {
              const status =
                statusConfig[modRequest.status as keyof typeof statusConfig] ??
                statusConfig.pending;

              const source =
                sourceConfig[modRequest.source as keyof typeof sourceConfig] ??
                sourceConfig.modification;

              const isExpanded = expandedRequest === modRequest.id;
              const hasModifiedPlan = modRequest.modifiedPlan.schedule.length > 0;
              const isEditing = editingModificationId === modRequest.id;
              const detail = modificationDetailsById[modRequest.id];
              const feedback = detail?.user_feedback;

              return (
                <div
                  key={modRequest.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                          {modRequest.userAvatar}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827] break-words">
                              {modRequest.userName}
                            </h3>

                            <div
                              className={`px-3 py-1 rounded-lg border ${status.bg} ${status.border}`}
                            >
                              <span className={`text-sm font-bold ${status.text}`}>
                                {status.label}
                              </span>
                            </div>

                            <div
                              className={`px-3 py-1 rounded-lg border ${source.bg} ${source.border}`}
                            >
                              <span className={`text-sm font-bold ${source.text}`}>
                                {source.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="w-4 h-4" />
                              Request ID:{" "}
                              <strong className="text-[#111827]">
                                {modRequest.id}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              Plan Ref:{" "}
                              <strong className="text-[#111827]">
                                {modRequest.planId || "Generated request"}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              Version:{" "}
                              <strong className="text-[#111827]">
                                {modRequest.version}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              Goal:{" "}
                              <strong className="text-[#111827]">
                                {modRequest.displayGoal}
                              </strong>
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {formatRequestDate(modRequest.requestDate)}
                            </span>
                          </div>

                          {modRequest.displayTargetWeight ? (
                            <div className="mt-2 text-sm text-gray-500">
                              Target Weight:{" "}
                              <strong className="text-[#111827]">
                                {modRequest.displayTargetWeight}
                              </strong>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          isExpanded
                            ? toggleExpand(modRequest.id)
                            : handleViewModificationDetails(modRequest.id)
                        }
                        className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 h-10 px-4 self-start"
                      >
                        {loadingDetailsId === modRequest.id ? (
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
                      <SectionCard
                        icon={<Send className="w-5 h-5 text-amber-600" />}
                        title="User Request"
                        titleClassName="text-[#111827]"
                      >
                        <p className="text-gray-600 leading-relaxed break-words">
                          "{modRequest.userRequest}"
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
                                {detail?.user?.name ?? modRequest.userName}
                              </div>
                            </div>

                            <div className="flex items-start gap-2 break-all">
                              <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-semibold text-[#111827]">
                                  Email:
                                </span>{" "}
                                {detail?.user?.email ?? "N/A"}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-semibold text-[#111827]">
                                  Goal:
                                </span>{" "}
                                {modRequest.displayGoal}
                              </div>
                            </div>

                            {modRequest.displayTargetWeight ? (
                              <div className="flex items-start gap-2">
                                <HeartPulse className="w-4 h-4 mt-0.5 text-gray-500" />
                                <div>
                                  <span className="font-semibold text-[#111827]">
                                    Target Weight:
                                  </span>{" "}
                                  {modRequest.displayTargetWeight}
                                </div>
                              </div>
                            ) : null}

                            <div className="flex items-start gap-2">
                              <Dumbbell className="w-4 h-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-semibold text-[#111827]">
                                  Program:
                                </span>{" "}
                                {detail?.program_version?.name ??
                                  (modRequest.source === "generated"
                                    ? "Generated training plan"
                                    : modRequest.planId
                                      ? `Plan ${modRequest.planId}`
                                      : "N/A")}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-semibold text-[#111827]">
                                  Level:
                                </span>{" "}
                                {detail?.program_version?.level ?? "N/A"}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <ShieldAlert className="w-4 h-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-semibold text-[#111827]">
                                  Difficulty:
                                </span>{" "}
                                {feedback?.difficulty ?? "N/A"}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <HeartPulse className="w-4 h-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-semibold text-[#111827]">
                                  Pain Areas:
                                </span>{" "}
                                {feedback?.pain_areas?.length
                                  ? feedback.pain_areas.join(", ")
                                  : "None"}
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
                                {feedback?.liked_exercises?.length ? (
                                  feedback.liked_exercises.map((item, idx) => (
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
                                {feedback?.disliked_exercises?.length ? (
                                  feedback.disliked_exercises.map((item, idx) => (
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
                        {modRequest.changesSummary.length > 0 ? (
                          <ul className="space-y-2">
                            {modRequest.changesSummary.map((change, index) => (
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

                      {hasModifiedPlan ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5 text-[#0D7D6D]" />
                            <h4 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827]">
                              Updated Plan Preview
                            </h4>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                Duration:
                              </span>
                              <span className="text-sm font-bold text-[#111827]">
                                {modRequest.modifiedPlan.duration}
                              </span>
                            </div>
                          </div>

                          {modRequest.modifiedPlan.schedule.map((daySchedule) => (
                            <div
                              key={daySchedule.day}
                              className="bg-white rounded-2xl p-6 border border-gray-200"
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center flex-shrink-0">
                                  <Dumbbell className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#111827]">
                                    Day {daySchedule.day}
                                  </h5>
                                  <p className="text-sm text-gray-500 break-words">
                                    {daySchedule.title}
                                  </p>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px]">
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
                                      {isEditing ? (
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                          Actions
                                        </th>
                                      ) : null}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {daySchedule.exercises.map((exercise) => (
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
                                          {isEditing ? (
                                            <Input
                                              type="number"
                                              value={exercise.sets}
                                              onChange={(e) =>
                                                handleModificationExerciseFieldChange(
                                                  modRequest.id,
                                                  daySchedule.day,
                                                  exercise.exerciseId,
                                                  "sets",
                                                  e.target.value
                                                )
                                              }
                                              className="w-20 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                            />
                                          ) : (
                                            <span className="text-[#111827] font-bold">
                                              {exercise.sets}
                                            </span>
                                          )}
                                        </td>

                                        <td className="py-4 px-4 text-center">
                                          {isEditing ? (
                                            <Input
                                              value={exercise.reps}
                                              onChange={(e) =>
                                                handleModificationExerciseFieldChange(
                                                  modRequest.id,
                                                  daySchedule.day,
                                                  exercise.exerciseId,
                                                  "reps",
                                                  e.target.value
                                                )
                                              }
                                              className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                            />
                                          ) : (
                                            <span className="text-[#111827] font-bold">
                                              {exercise.reps}
                                            </span>
                                          )}
                                        </td>

                                        <td className="py-4 px-4 text-center">
                                          {isEditing ? (
                                            <Input
                                              type="number"
                                              value={exercise.restSeconds}
                                              onChange={(e) =>
                                                handleModificationExerciseFieldChange(
                                                  modRequest.id,
                                                  daySchedule.day,
                                                  exercise.exerciseId,
                                                  "restSeconds",
                                                  e.target.value
                                                )
                                              }
                                              className="w-24 mx-auto text-center bg-white border-gray-200 text-[#111827]"
                                            />
                                          ) : (
                                            <span className="text-gray-600">
                                              {exercise.restSeconds}
                                            </span>
                                          )}
                                        </td>

                                        {isEditing ? (
                                          <td className="py-4 px-4 text-center">
                                            <button
                                              onClick={() =>
                                                handleModificationDeleteExercise(
                                                  modRequest.id,
                                                  daySchedule.day,
                                                  exercise.exerciseId
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
                                    const dayKey = `mod-${modRequest.id}-${daySchedule.day}`;
                                    const searchResults =
                                      modExerciseResultsByDay[dayKey] ?? [];

                                    return (
                                      <>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          <Input
                                            value={modExerciseSearchByDay[dayKey] ?? ""}
                                            onChange={(e) =>
                                              setModExerciseSearchByDay((current) => ({
                                                ...current,
                                                [dayKey]: e.target.value,
                                              }))
                                            }
                                            placeholder="Search exercises to add..."
                                            className="bg-white border-gray-200 text-[#111827]"
                                          />
                                          <Button
                                            onClick={() =>
                                              handleModificationSearchExercises(
                                                modRequest.id,
                                                daySchedule.day
                                              )
                                            }
                                            className="bg-[#0D7D6D]/10 hover:bg-[#0D7D6D]/15 border border-[#0D7D6D]/20 text-[#0D7D6D] sm:w-auto w-full"
                                          >
                                            {modExerciseSearchLoadingKey === dayKey ? (
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
                                                    handleModificationAddExercise(
                                                      modRequest.id,
                                                      daySchedule.day,
                                                      item
                                                    )
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
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <SectionCard
                          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                          title="Updated Plan Preview"
                          titleClassName="text-amber-700"
                          wrapperClassName="bg-amber-50 border-amber-200"
                        >
                          <p className="text-sm text-amber-700">
                            This request does not have a valid plan preview yet.
                          </p>
                        </SectionCard>
                      )}

                      <SectionCard
                        icon={<Sparkles className="w-5 h-5 text-blue-600" />}
                        title="AI Recommendations"
                        titleClassName="text-blue-700"
                        wrapperClassName="bg-blue-50 border-blue-200"
                      >
                        {modRequest.recommendations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {modRequest.recommendations.map((rec, idx) => (
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

                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 -mx-6 -mb-6 px-6 py-5">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                          {isEditing ? (
                            <Button
                              onClick={() =>
                                handleSaveModificationChanges(modRequest.id)
                              }
                              disabled={updateMutation.isPending}
                              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              ) : (
                                <Save className="mr-2 w-5 h-5" />
                              )}
                              Save Changes
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setEditingModificationId(modRequest.id)}
                              className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold"
                            >
                              <Edit2 className="mr-2 w-5 h-5" />
                              Edit Request
                            </Button>
                          )}

                          <Button
                            onClick={() => handleApprove(modRequest.id)}
                            disabled={!hasModifiedPlan || approveMutation.isPending}
                            className="flex-1 h-14 bg-[#0D7D6D] hover:bg-[#0b6b5e] text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            ) : (
                              <Check className="mr-2 w-5 h-5" />
                            )}
                            Approve & Save Plan
                          </Button>

                          <Button
                            onClick={() => handleDeleteModification(modRequest.id)}
                            disabled={deleteMutation.isPending}
                            variant="outline"
                            className="h-14 px-6 border-rose-200 text-rose-600 hover:bg-rose-50 text-base font-semibold"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 w-5 h-5" />
                            )}
                            Delete
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingModificationId(null);
                              setExpandedRequest(null);
                            }}
                            className="h-14 px-6 border-gray-200 text-gray-600 hover:bg-gray-50 text-base font-semibold"
                          >
                            <X className="mr-2 w-5 h-5" />
                            Close
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
                title="No training plan requests found"
                description="There are no generated or modification training requests right now."
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