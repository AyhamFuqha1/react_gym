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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { useTranslation } from "../../../i18n";

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
  const { t } = useTranslation();
  const [role, setRole] = useState("");
  const [syncResult, setSyncResult] = useState<SyncAllResponse | null>(null);
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [confirmFullSyncOpen, setConfirmFullSyncOpen] = useState(false);

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
      setSyncError(t("dashboard.smartSyncFailed"));
    }
  }

  function handleFullSync() {
    setConfirmFullSyncOpen(true);
  }

  async function confirmFullSync() {
    try {
      setSyncError("");
      const result = await fullSyncMutation.mutateAsync();
      saveSyncResultToStorage(result);
      setConfirmFullSyncOpen(false);
    } catch (err) {
      console.error("Full sync failed:", err);
      setSyncError(t("dashboard.fullSyncFailed"));
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
    error instanceof Error ? error.message : t("dashboard.failedToLoadData");

  function localizeDashboardLabel(label: string) {
    if (label === "Total Members") return t("dashboard.totalMembers");
    if (label === "Equipment Issues") return t("dashboard.equipmentIssues");
    if (label === "Active Subscriptions") return t("dashboard.activeSubscriptions");
    if (label === "Monthly Revenue") return t("dashboard.monthlyRevenue");
    return label;
  }

  function localizeDashboardBadge(label: string, badge: string) {
    const totalMembers = dashboardStats?.totalMembers ?? 0;
    const equipmentIssues = dashboardStats?.equipmentIssues ?? 0;
    const activeSubscriptions = dashboardStats?.activeSubscriptions ?? 0;

    if (label === "Total Members") {
      return `${activeSubscriptions} ${t("common.active")}`;
    }

    if (label === "Equipment Issues") {
      return equipmentIssues > 0
        ? `${equipmentIssues} ${t("common.pending")}`
        : t("dashboard.allClear");
    }

    if (label === "Monthly Revenue") return t("dashboard.thisMonth");
    if (label === "Active Subscriptions" && totalMembers <= 0) return badge;

    return badge;
  }

  function localizeDashboardTrend(label: string, trend: string) {
    const totalMembers = dashboardStats?.totalMembers ?? 0;
    const equipmentIssues = dashboardStats?.equipmentIssues ?? 0;
    const activeSubscriptions = dashboardStats?.activeSubscriptions ?? 0;
    const monthlyRevenue = dashboardStats?.monthlyRevenue ?? 0;

    if (label === "Total Members") {
      return totalMembers > 0
        ? `${activeSubscriptions} ${t("dashboard.activeSubscriptionsRightNow")}`
        : t("dashboard.noMembersAvailableYet");
    }

    if (label === "Equipment Issues") {
      return equipmentIssues > 0
        ? t("dashboard.recentIssuesNeedReview")
        : t("dashboard.noOpenEquipmentIssues");
    }

    if (label === "Active Subscriptions") {
      return totalMembers > 0
        ? `${activeSubscriptions} ${t("common.of")} ${totalMembers} ${t("dashboard.membersAreActive")}`
        : t("dashboard.noActiveSubscriptionsYet");
    }

    if (label === "Monthly Revenue") {
      return monthlyRevenue > 0
        ? t("dashboard.revenueCollectedThisMonth")
        : t("dashboard.noRevenueRecordedThisMonth");
    }

    return trend;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            {t("dashboard.admin.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {formatLastUpdated(dashboardStats?.lastUpdated)} -{" "}
            {t("dashboard.whatsHappeningToday")}
          </p>
        </div>

        <Dialog
          open={confirmFullSyncOpen}
          onOpenChange={(open) => {
            if (fullSyncMutation.isPending) return;
            setConfirmFullSyncOpen(open);
          }}
        >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("dashboard.confirmFullSync")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("dashboard.fullSyncDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-600">
              {t("dashboard.fullSyncWarning")}
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmFullSyncOpen(false)}
              disabled={fullSyncMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {t("common.cancel")}
            </Button>

            <Button
              type="button"
              onClick={confirmFullSync}
              disabled={fullSyncMutation.isPending}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {fullSyncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={14} />
                  {t("common.loading")}
                </>
              ) : (
                t("dashboard.fullSync")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSmartSync}
            disabled={smartSyncMutation.isPending || fullSyncMutation.isPending}
            className="bg-[#0D7D6D] hover:bg-[#0b6b5d] text-white rounded-xl"
          >
            {smartSyncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                {t("dashboard.syncing")}
              </>
            ) : (
              t("dashboard.smartSync")
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
                  {t("dashboard.fullSyncing")}
                </>
              ) : (
                t("dashboard.fullSync")
              )}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          <span>{t("dashboard.loading")}</span>
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
            <span className="font-semibold text-[#0D7D6D]">
              {t("dashboard.lastSyncResult")}
            </span>
          </div>

          <p className="mb-1">
            {t("dashboard.exercises")} - {t("dashboard.added")}:{" "}
            {syncResult.stats.exercises.added}, {t("dashboard.updated")}:{" "}
            {syncResult.stats.exercises.updated}, {t("dashboard.deleted")}:{" "}
            {syncResult.stats.exercises.deleted}
          </p>

          <p className="mb-1">
            {t("dashboard.nutrition")} - {t("dashboard.added")}:{" "}
            {syncResult.stats.nutrition.added}, {t("dashboard.updated")}:{" "}
            {syncResult.stats.nutrition.updated}, {t("dashboard.deleted")}:{" "}
            {syncResult.stats.nutrition.deleted}
          </p>

          <p className="mb-1 text-xs text-gray-600">
            {t("dashboard.lastSyncTime")}: {formatSyncTime(lastSyncedAt)}
          </p>

          <p className="text-xs text-gray-500">
            {t("dashboard.elapsed")}: {syncResult.stats.elapsed_seconds.toFixed(2)}s
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
                  {localizeDashboardBadge(card.label, card.badge)}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-1">
                {localizeDashboardLabel(card.label)}
              </p>
              <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-2">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <ArrowUpRight size={12} className="text-emerald-500" />
                {localizeDashboardTrend(card.label, card.trend)}
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
                {t("dashboard.membershipGrowth")}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("dashboard.recentSubscriptionActivity")}
              </p>
            </div>

            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold px-2.5 py-1 rounded-full">
              {t("dashboard.live")}
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
                  return [numericValue, t("dashboard.subscriptions")];
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
                {t("dashboard.weeklySubscriptions")}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("dashboard.latestSubscriptionTotals")}
              </p>
            </div>

            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold px-2.5 py-1 rounded-full">
              {t("dashboard.live")}
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
                  return [numericValue, t("dashboard.subscriptions")];
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.week ? `${t("dashboard.week")} ${item.week}` : "";
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
              {t("dashboard.recentIssues")}
            </h3>
            <span className="text-xs bg-red-50 text-red-500 border border-red-100 font-semibold px-2.5 py-1 rounded-full">
              {recentIssuesData.length} {t("common.pending")}
            </span>
          </div>

          <div className="space-y-3">
            {recentIssuesData.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                {t("dashboard.noRecentIssues")}
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
                      <p className="text-xs text-gray-400">{t("dashboard.equipment")}</p>
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
                  {t("dashboard.systemAlert")}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {recentIssuesData.length > 0
                    ? `${recentIssuesData.length} ${t(
                        "dashboard.recentEquipmentIssuesNeedAttention"
                      )}`
                    : t("dashboard.noRecentSystemAlerts")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 mb-4 text-sm">
              {t("dashboard.memberActivity")}
            </h4>
            <div className="space-y-3">
              {memberActivityItems.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">
                      {localizeDashboardLabel(item.label)}
                    </span>
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
              <p className="font-semibold text-sm">{t("dashboard.aiDailySummary")}</p>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              {dashboardStats
                ? `${dashboardStats.totalMembers} ${t(
                    "dashboard.members"
                  )}, ${dashboardStats.activeSubscriptions} ${t(
                    "dashboard.activeSubscriptions"
                  )}, ${dashboardStats.equipmentIssues} ${t(
                    "dashboard.equipmentIssues"
                  )}, ${t("common.and")} ${formatCurrency(
                    dashboardStats.monthlyRevenue
                  )} ${t("dashboard.collectedThisMonth")}`
                : t("dashboard.summaryUnavailable")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
