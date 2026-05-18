import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Wrench, Star, Filter, Loader2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { type FeedbackItem } from "../../../services/feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  formatDate,
  formatStatusLabel,
  getInitials,
} from "../../../utils/feedback";
import { useFeedbackDashboard } from "../../../hooks/feedback/queries/useFeedbackDashboard";
import { useUpdateFeedback } from "../../../hooks/feedback/mutations/useUpdateFeedback";
import { useDeleteFeedback } from "../../../hooks/feedback/mutations/useDeleteFeedback";

type TabType = "equipment" | "ratings" | "suggestions";
type FilterType = "all" | "pending" | "in_progress" | "resolved";
type ToastState = { type: "success" | "error"; message: string } | null;

function getErrorMessage(error: unknown) {
  if (!error) return "Something went wrong. Please try again.";
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;

  const responseData = (
    error as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
          errors?: Record<string, unknown>;
        };
      };
    }
  )?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.error === "string") {
    return responseData.error;
  }

  if (responseData?.errors && typeof responseData.errors === "object") {
    const firstError = Object.values(responseData.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => typeof value === "string");

    if (typeof firstError === "string") return firstError;
  }

  return "Something went wrong. Please try again.";
}

export function AdminFeedback() {
  const [activeTab, setActiveTab] = useState<TabType>("equipment");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const {
    data: response,
    isLoading: loading,
    error,
  } = useFeedbackDashboard();
  const updateFeedbackMutation = useUpdateFeedback();
  const deleteFeedbackMutation = useDeleteFeedback();

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const items = Array.isArray(response?.data) ? response.data : [];

  const equipmentReports = useMemo(() => {
    return items
      .filter((item) => item.type === "equipment")
      .filter((item) => {
        if (statusFilter === "all") return true;
        return item.details?.status === statusFilter;
      });
  }, [items, statusFilter]);

  const trainerRatings = useMemo(() => {
    return items.filter(
      (item) => item.type === "trainer" || item.type === "rating"
    );
  }, [items]);

  const suggestions = useMemo(() => {
    return items.filter((item) => item.type === "suggestion");
  }, [items]);

  const tabs = [
    {
      id: "equipment" as TabType,
      label: "Equipment Issues",
      count: equipmentReports.filter((r) => r.details?.status === "pending").length,
    },
    {
      id: "ratings" as TabType,
      label: "Trainer Ratings",
      count: null,
    },
    {
      id: "suggestions" as TabType,
      label: "Suggestions",
      count: suggestions.length,
    },
  ];

  const errorMessage = getErrorMessage(error);

  async function handleStatusChange(item: FeedbackItem, status: string) {
    try {
      await updateFeedbackMutation.mutateAsync({
        id: item.id,
        payload: { status },
      });
      setToast({ type: "success", message: "Feedback status updated." });
    } catch (mutationError) {
      setToast({
        type: "error",
        message: getErrorMessage(mutationError),
      });
    }
  }

  async function handleDeleteFeedback() {
    if (!deleteTarget) return;

    try {
      await deleteFeedbackMutation.mutateAsync(deleteTarget.id);
      setToast({ type: "success", message: "Feedback deleted." });
      setDeleteTarget(null);
    } catch (mutationError) {
      setToast({
        type: "error",
        message: getErrorMessage(mutationError),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
          Feedback & Reports
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage member feedback and equipment reports
        </p>
      </div>

      {toast ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1 max-w-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-center text-gray-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">
          {errorMessage}
        </div>
      ) : (
        <>
          {activeTab === "equipment" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
                  Equipment Reports
                </h3>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as FilterType)}
                >
                  <SelectTrigger className="w-44 rounded-xl border-gray-200 bg-white">
                    <Filter size={14} className="mr-1.5 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-5 space-y-3">
                {equipmentReports.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-8">
                    No equipment reports found.
                  </div>
                ) : (
                  equipmentReports.map((report) => {
                    const priority = report.details?.priority || "medium";
                    const status = report.details?.status || "pending";

                    return (
                      <div
                        key={report.id}
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl ${
                                priority === "high"
                                  ? "bg-red-100"
                                  : "bg-orange-100"
                              }`}
                            >
                              <Wrench
                                className={
                                  priority === "high"
                                    ? "text-red-600"
                                    : "text-orange-600"
                                }
                                size={18}
                              />
                            </div>

                            <div>
                              <p className="font-semibold text-gray-800">
                                {report.details?.equipment_name ||
                                  report.details?.name ||
                                  "Equipment report"}
                              </p>
                              <p className="text-xs text-gray-400">
                                Reported by {report.user_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                                priority === "high"
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                              }`}
                            >
                              {priority}
                            </span>

                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                status === "resolved"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : status === "in_progress"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              {formatStatusLabel(status)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 pl-11">
                          {report.content}
                        </p>

                        <div className="flex flex-col gap-3 pl-11 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-gray-400">
                            {formatDate(report.created_at)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Select
                              value={status}
                              onValueChange={(value) =>
                                void handleStatusChange(report, value)
                              }
                              disabled={updateFeedbackMutation.isPending}
                            >
                              <SelectTrigger className="h-9 w-36 rounded-xl border-gray-200 bg-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(report)}
                              disabled={deleteFeedbackMutation.isPending}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "ratings" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
                  Trainer Feedback
                </h3>
              </div>

              <div className="p-5 space-y-3">
                {trainerRatings.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-8">
                    No trainer ratings found.
                  </div>
                ) : (
                  trainerRatings.map((rating) => {
                    const stars = Number(rating.details?.rating || 0);
                    const trainerName =
                      rating.details?.trainer_name || "Trainer not assigned";
                    const trainerEmail = rating.details?.trainer_email;

                    return (
                      <div
                        key={rating.id}
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center text-white text-sm font-600">
                              {getInitials(rating.user_name)}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-800">
                                {rating.user_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                Rated {trainerName}
                                {trainerEmail ? ` (${trainerEmail})` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={
                                    star <= stars
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-200"
                                  }
                                />
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(rating)}
                              disabled={deleteFeedbackMutation.isPending}
                              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 italic mb-2 pl-13">
                          "{rating.content}"
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(rating.created_at)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
                  Member Suggestions
                </h3>
              </div>

              <div className="p-5 space-y-3">
                {suggestions.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-8">
                    No suggestions found.
                  </div>
                ) : (
                  suggestions.map((item) => {
                    const status = item.details?.status || "pending";

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#E6F4F1] rounded-xl flex items-center justify-center">
                              <MessageSquare
                                className="text-[#0D7D6D]"
                                size={18}
                              />
                            </div>

                            <div>
                              <p className="font-semibold text-gray-800">
                                {item.user_name}
                              </p>
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                Suggestion
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              status === "implemented" || status === "resolved"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : status === "reviewed" ||
                                  status === "under_review"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            {formatStatusLabel(status)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 pl-13">
                          {item.content}
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-gray-400">
                            {formatDate(item.created_at)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Select
                              value={status}
                              onValueChange={(value) =>
                                void handleStatusChange(item, value)
                              }
                              disabled={updateFeedbackMutation.isPending}
                            >
                              <SelectTrigger className="h-9 w-40 rounded-xl border-gray-200 bg-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">
                                  Under Review
                                </SelectItem>
                                <SelectItem value="implemented">
                                  Resolved
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              disabled={deleteFeedbackMutation.isPending}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteFeedbackMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              Delete feedback
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              This removes the selected feedback and its related details.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">
                {deleteTarget.user_name}
              </p>
              <p className="mt-1 line-clamp-3">{deleteTarget.content}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteFeedbackMutation.isPending}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteFeedback()}
              disabled={deleteFeedbackMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteFeedbackMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
