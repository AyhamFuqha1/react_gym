import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Wrench, Star, Filter, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  getFeedbackDashboard,
  type FeedbackItem,
} from "../../services/feedback";

type TabType = "equipment" | "ratings" | "suggestions";
type FilterType = "all" | "pending" | "in_progress" | "resolved";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatStatusLabel(status: string) {
  if (status === "in_progress") return "In Progress";
  if (status === "pending") return "Pending";
  if (status === "resolved") return "Resolved";
  return status.replace(/_/g, " ");
}

export function AdminFeedback() {
  const [activeTab, setActiveTab] = useState<TabType>("equipment");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    async function loadFeedback() {
      setLoading(true);
      try {
        const response = await getFeedbackDashboard();
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load feedback dashboard:", error);
        alert("Failed to load feedback dashboard.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadFeedback();
  }, []);

  const equipmentReports = useMemo(() => {
    return items
      .filter((item) => item.type === "equipment")
      .filter((item) => {
        if (statusFilter === "all") return true;
        return item.details?.status === statusFilter;
      });
  }, [items, statusFilter]);

  const trainerRatings = useMemo(() => {
    return items.filter((item) => item.type === "trainer");
  }, [items]);

  const suggestions = useMemo(() => {
    return items.filter((item) => item.type === "suggestion");
  }, [items]);

  const tabs = [
    {
      id: "equipment" as TabType,
      label: "Equipment Issues",
      count: equipmentReports.filter((r) => r.details?.status === "pending")
        .length,
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            Feedback & Reports
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage member feedback and equipment reports
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as FilterType)}
        >
          <SelectTrigger className="w-40 rounded-xl border-gray-200 bg-white">
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
      ) : (
        <>
          {activeTab === "equipment" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
                  Equipment Reports
                </h3>
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
                                {report.details?.name || "Equipment report"}
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

                        <div className="flex items-center justify-between pl-11">
                          <p className="text-xs text-gray-400">
                            {formatDate(report.created_at)}
                          </p>
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
                                Trainer rating
                              </p>
                            </div>
                          </div>

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
                  suggestions.map((item) => (
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

                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-100 capitalize">
                          under review
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 pl-13">
                        {item.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}