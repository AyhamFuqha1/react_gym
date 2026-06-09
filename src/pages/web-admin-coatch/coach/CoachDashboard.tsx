import { useMemo, useState } from "react";
import {
  Users,
  Newspaper,
  Apple,
  Dumbbell,
  Brain,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "../../../i18n";
import { useCoachDashboard } from "../../../hooks/coachDashboard/queries/useCoachDashboard";
import { useCoachSmartSync } from "../../../hooks/coachDashboard/mutations/useCoachSmartSync";
import type { SyncAllResponse } from "../../../services/aiSync";

type PersistedSyncResult = {
  result: SyncAllResponse;
  syncedAt: string;
};

const SYNC_RESULT_STORAGE_KEY = "fitmind_last_coach_sync_result";

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

export function CoachDashboard() {
  const { t } = useTranslation();
  const [syncResult, setSyncResult] = useState<SyncAllResponse | null>(() => {
    try {
      const raw = localStorage.getItem(SYNC_RESULT_STORAGE_KEY);
      if (!raw) return null;
      const parsed: PersistedSyncResult = JSON.parse(raw);
      return parsed?.result ?? null;
    } catch {
      return null;
    }
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(SYNC_RESULT_STORAGE_KEY);
      if (!raw) return "";
      const parsed: PersistedSyncResult = JSON.parse(raw);
      return parsed?.syncedAt ?? "";
    } catch {
      return "";
    }
  });

  const [syncError, setSyncError] = useState("");

  const {
    data,
    isLoading: loading,
    error,
  } = useCoachDashboard();

  const smartSyncMutation = useCoachSmartSync();

  const members = data?.members ?? [];
  const news = data?.news ?? [];
  const nutritionCategories = data?.nutritionCategories ?? [];
  const exerciseCategories = data?.exerciseCategories ?? [];
  const coachSubscriptions = data?.coachSubscriptions ?? [];

  const statCards = useMemo(
    () => [
      {
        label: t("dashboard.members"),
        value: members.length,
        icon: Users,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        label: t("dashboard.news"),
        value: news.length,
        icon: Newspaper,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        label: t("dashboard.nutritionCategories"),
        value: nutritionCategories.length,
        icon: Apple,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        label: t("dashboard.exerciseCategories"),
        value: exerciseCategories.length,
        icon: Dumbbell,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
    ],
    [
      members.length,
      news.length,
      nutritionCategories.length,
      exerciseCategories.length,
      t,
    ]
  );

  function saveSyncResultToStorage(result: SyncAllResponse) {
    const payload: PersistedSyncResult = {
      result,
      syncedAt: new Date().toISOString(),
    };

    localStorage.setItem(SYNC_RESULT_STORAGE_KEY, JSON.stringify(payload));
    setSyncResult(result);
    setLastSyncedAt(payload.syncedAt);
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

  const errorMessage =
    error instanceof Error ? error.message : t("dashboard.error");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            {t("dashboard.coach.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("dashboard.coach.subtitle")}
          </p>
        </div>

        <Button
          onClick={handleSmartSync}
          disabled={smartSyncMutation.isPending}
          className="bg-[#0D7D6D] hover:bg-[#0b6b5d] text-white rounded-xl"
        >
          {smartSyncMutation.isPending ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={16} />
              {t("dashboard.syncing")}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2" size={16} />
              {t("dashboard.smartSync")}
            </>
          )}
        </Button>
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
            {t("dashboard.lastSyncTime")}: {formatSyncTime(lastSyncedAt)}
          </p>

          <p className="text-xs text-gray-500">
            {t("dashboard.elapsed")}: {syncResult.stats.elapsed_seconds.toFixed(2)}s
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} p-3 rounded-xl`}>
                  <Icon className={card.iconColor} size={22} />
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-1">{card.label}</p>
              <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
              {t("dashboard.recentNews")}
            </h3>
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 font-semibold px-2.5 py-1 rounded-full">
              {news.length} {t("dashboard.items")}
            </span>
          </div>

          <div className="space-y-3">
            {news.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                {t("dashboard.noNews")}
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.author_name ?? t("dashboard.unknownAuthor")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 mb-4 text-sm">
              {t("dashboard.coachSubscriptions")}
            </h4>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {coachSubscriptions.length}
            </p>
            <p className="text-xs text-gray-500">
              {t("dashboard.subscriptionsCreatedByCoach")}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 mb-4 text-sm">
              {t("dashboard.contentSummary")}
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>{t("dashboard.exerciseCategories")}</span>
                <span className="font-semibold text-gray-900">
                  {exerciseCategories.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.nutritionCategories")}</span>
                <span className="font-semibold text-gray-900">
                  {nutritionCategories.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.members")}</span>
                <span className="font-semibold text-gray-900">{members.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0D7D6D] to-[#085249] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-[#7FD4C9]" />
              <p className="font-semibold text-sm">{t("dashboard.coachSummary")}</p>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              {members.length} members, {coachSubscriptions.length} coach-created
              subscriptions, {exerciseCategories.length} exercise categories, and{" "}
              {nutritionCategories.length} nutrition categories available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
