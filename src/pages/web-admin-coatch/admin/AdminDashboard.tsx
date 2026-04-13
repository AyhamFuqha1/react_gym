import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Activity,
  AlertCircle,
  ArrowUpRight,
  Brain,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "../../../components/ui/button";
import { getRole } from "../../../services/auth";
import { type SyncAllResponse } from "../../../services/aiSync";
import {
  buildDashboardStatCards,
  buildMemberActivityItems,
  buildSubscriptionsChartData,
  buildWeeklySubscriptionsChartData,
  capitalizeStatus,
  formatCurrency,
  formatLastUpdated,
} from "../../../utils/dashboard";
import { useAdminDashboard } from "../../../hooks/dashboard/queries/useAdminDashboard";
import { useSmartSync } from "../../../hooks/dashboard/mutations/useSmartSync";
import { useFullSync } from "../../../hooks/dashboard/mutations/useFullSync";

type PersistedSyncResult = {
  result: SyncAllResponse;
  syncedAt: string;
};

const SYNC_RESULT_STORAGE_KEY = "fitmind_last_sync_result";

function formatSyncTime(value?: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminDashboard() {
  const [role, setRole] = useState("");
  const [syncResult, setSyncResult] = useState<SyncAllResponse | null>(null);
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  const {
    data: dashboardStats = null,
    isLoading: loading,
    error,
  } = useAdminDashboard();

  const smartSyncMutation = useSmartSync();
  const fullSyncMutation = useFullSync();

  function saveSyncResultToStorage(result: SyncAllResponse) {
    const payload: PersistedSyncResult = {
      result,
      syncedAt: new Date().toISOString(),
    };

    localStorage.setItem(SYNC_RESULT_STORAGE_KEY, JSON.stringify(payload));
    setSyncResult(result);
    setLastSyncedAt(payload.syncedAt);
  }

  function loadSyncResultFromStorage() {
    try {
      const raw = localStorage.getItem(SYNC_RESULT_STORAGE_KEY);
      if (!raw) return;

      const parsed: PersistedSyncResult = JSON.parse(raw);

      if (parsed?.result) {
        setSyncResult(parsed.result);
      }

      if (parsed?.syncedAt) {
        setLastSyncedAt(parsed.syncedAt);
      }
    } catch (err) {
      console.error("Failed to load persisted sync result:", err);
    }
  }

  async function handleSmartSync() {
    try {
      setSyncError("");
      const result = await smartSyncMutation.mutateAsync();
      saveSyncResultToStorage(result);
    } catch (err) {
      console.error("Smart sync failed:", err);
      setSyncError("Smart sync failed.");
    }
  }

  async function handleFullSync() {
    const confirmed = window.confirm(
      "This will run a full sync for all exercises and nutrition data and may consume higher API usage. Do you want to continue?"
    );

    if (!confirmed) return;

    try {
      setSyncError("");
      const result = await fullSyncMutation.mutateAsync();
      saveSyncResultToStorage(result);
    } catch (err) {
      console.error("Full sync failed:", err);
      setSyncError("Full sync failed.");
    }
  }

  useEffect(() => {
    setRole((getRole() ?? "").toLowerCase());
    loadSyncResultFromStorage();
  }, []);

  const statCards = useMemo(() => {
    return buildDashboardStatCards(dashboardStats);
  }, [dashboardStats]);

  const subscriptionsChartData = useMemo(() => {
    return buildSubscriptionsChartData(dashboardStats);
  }, [dashboardStats]);

  const weeklySubscriptionsChartData = useMemo(() => {
    return buildWeeklySubscriptionsChartData(dashboardStats);
  }, [dashboardStats]);

  const recentIssuesData = dashboardStats?.recentIssues ?? [];

  const memberActivityItems = useMemo(() => {
    return buildMemberActivityItems(dashboardStats);
  }, [dashboardStats]);

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load dashboard data.";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {formatLastUpdated(dashboardStats?.lastUpdated)} — Here&apos;s what&apos;s
            happening today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSmartSync}
            disabled={smartSyncMutation.isPending || fullSyncMutation.isPending}
            className="bg-[#0D7D6D] hover:bg-[#0b6b5d] text-white rounded-xl"
          >
            {smartSyncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Syncing...
              </>
            ) : (
              "Smart Sync"
            )}
          </Button>

          {role === "admin" && (
            <Button
              onClick={handleFullSync}
              disabled={smartSyncMutation.isPending || fullSyncMutation.isPending}
              variant="outline"
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              {fullSyncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Full Sync...
                </>
              ) : (
                "Full Sync"
              )}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">
          {errorMessage}
        </div>
      ) : null}

      {syncError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">
          {syncError}
        </div>
      ) : null}

      {syncResult ? (
        <div className="bg-[#E6F4F1] border border-[#0D7D6D]/15 rounded-2xl p-4 text-sm text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-[#0D7D6D]" />
            <span className="font-semibold text-[#0D7D6D]">Last Sync Result</span>
          </div>

          <p className="mb-1">
            Exercises — Added: {syncResult.stats.exercises.added}, Updated:{" "}
            {syncResult.stats.exercises.updated}, Deleted:{" "}
            {syncResult.stats.exercises.deleted}
          </p>

          <p className="mb-1">
            Nutrition — Added: {syncResult.stats.nutrition.added}, Updated:{" "}
            {syncResult.stats.nutrition.updated}, Deleted:{" "}
            {syncResult.stats.nutrition.deleted}
          </p>

          <p className="mb-1 text-xs text-gray-600">
            Last Sync Time: {formatSyncTime(lastSyncedAt)}
          </p>

          <p className="text-xs text-gray-500">
            Elapsed: {syncResult.stats.elapsed_seconds.toFixed(2)}s
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} p-3 rounded-xl`}>
                  <Icon className={card.iconColor} size={22} />
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-1">{card.label}</p>
              <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-2">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <ArrowUpRight size={12} className="text-emerald-500" />
                {card.trend}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
                Membership Growth
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Recent subscription activity
              </p>
            </div>

            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold px-2.5 py-1 rounded-full">
              Live
            </span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={subscriptionsChartData}>
              <defs>
                <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7D6D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D7D6D" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}
                formatter={(value: string | number) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0);
                  return [numericValue, "Subscriptions"];
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.fullDate ?? "";
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0D7D6D"
                strokeWidth={2.5}
                fill="url(#memberGrad)"
                dot={{ fill: "#0D7D6D", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
                Weekly Subscriptions
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Latest subscription totals by week
              </p>
            </div>

            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold px-2.5 py-1 rounded-full">
              Live
            </span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklySubscriptionsChartData} barSize={28}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D7D6D" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}
                formatter={(value: string | number) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0);
                  return [numericValue, "Subscriptions"];
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.week ? `Week ${item.week}` : "";
                }}
              />
              <Bar
                dataKey="total"
                fill="url(#barGrad)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
              Recent Issues
            </h3>
            <span className="text-xs bg-red-50 text-red-500 border border-red-100 font-semibold px-2.5 py-1 rounded-full">
              {recentIssuesData.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {recentIssuesData.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                No recent issues found.
              </div>
            ) : (
              recentIssuesData.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        issue.priority === "high"
                          ? "bg-red-100"
                          : issue.priority === "medium"
                          ? "bg-orange-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <Wrench
                        className={
                          issue.priority === "high"
                            ? "text-red-600"
                            : issue.priority === "medium"
                            ? "text-orange-600"
                            : "text-blue-600"
                        }
                        size={18}
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {issue.equipment_name}
                      </p>
                      <p className="text-xs text-gray-400">Equipment</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                        issue.priority === "high"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : issue.priority === "medium"
                          ? "bg-orange-50 text-orange-600 border-orange-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      } capitalize`}
                    >
                      {issue.priority}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border capitalize ${
                        issue.status === "resolved"
                          ? "bg-[#E6F4F1] text-[#0D7D6D] border-[#0D7D6D]/20"
                          : issue.status === "in_progress"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {capitalizeStatus(issue.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-xl flex-shrink-0">
                <AlertCircle className="text-orange-500" size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  System Alert
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {recentIssuesData.length > 0
                    ? `${recentIssuesData.length} recent equipment issues need attention.`
                    : "No recent system alerts right now."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 mb-4 text-sm">
              Member Activity
            </h4>
            <div className="space-y-3">
              {memberActivityItems.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-semibold text-gray-700">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{
                        width: `${Math.min(
                          (item.value / Math.max(item.max, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0D7D6D] to-[#085249] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-[#7FD4C9]" />
              <p className="font-semibold text-sm">AI Daily Summary</p>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              {dashboardStats
                ? `${dashboardStats.totalMembers} members, ${dashboardStats.activeSubscriptions} active subscriptions, ${dashboardStats.equipmentIssues} equipment issues, and ${formatCurrency(
                    dashboardStats.monthlyRevenue
                  )} collected this month.`
                : "Dashboard summary unavailable."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}