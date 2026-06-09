import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Loader2,
  Repeat2,
  Search,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import type { CoachSession } from "../../../services/coachSessions";
import { useAdminCancelSession } from "../../../hooks/coachSessions/mutations/useAdminCancelSession";
import { useAdminRestoreSession } from "../../../hooks/coachSessions/mutations/useAdminRestoreSession";
import { useAdminSessionDetails } from "../../../hooks/coachSessions/queries/useAdminSessionDetails";
import { useAdminSessions } from "../../../hooks/coachSessions/queries/useAdminSessions";
import { useTranslation, type TranslationKey } from "../../../i18n";

type SessionDisplayStatus = "available" | "full" | "cancelled";
type StatusFilter = "all" | "available" | "full" | "cancelled";
type DateFilter = "all" | "today" | "week" | "upcoming";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type StatusMeta = {
  label: string;
  className: string;
  icon: LucideIcon;
};

const SAFE_ERROR_MESSAGE = "Something went wrong. Please try again.";
const EMPTY_SESSIONS: CoachSession[] = [];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const statusMeta: Record<SessionDisplayStatus, StatusMeta> = {
  available: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  full: {
    label: "Full",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Users,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

function toTitleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function parseSessionDate(value?: string | null) {
  if (!value) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(value?: string | null) {
  return String(value ?? "available").toLowerCase();
}

function getStatusMeta(value?: string | null): StatusMeta {
  const status = normalizeStatus(value);

  if (status === "available" || status === "full" || status === "cancelled") {
    return statusMeta[status];
  }

  return {
    label: toTitleCase(status) || "Unknown",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: AlertCircle,
  };
}

function getSessionStatusLabel(
  value: SessionDisplayStatus,
  t: (key: TranslationKey) => string
) {
  const labels: Record<SessionDisplayStatus, TranslationKey> = {
    available: "common.available",
    full: "common.full",
    cancelled: "common.cancelled",
  };

  return t(labels[value]);
}

function getSessionDisplayStatus(session: CoachSession): SessionDisplayStatus {
  if (normalizeStatus(session.status) === "cancelled") {
    return "cancelled";
  }

  const capacity = getCapacity(session);
  const bookedCount = getBookedCount(session);

  if (capacity > 0 && bookedCount >= capacity) {
    return "full";
  }

  return "available";
}

function getCoachName(session: CoachSession) {
  const name = session.coach?.name?.trim();
  return name || `Coach #${session.coach_id}`;
}

function getCoachEmail(session: CoachSession) {
  const email = session.coach?.email?.trim();
  return email || "";
}

function getCoachFilterKey(session: CoachSession) {
  if (session.coach?.id != null) {
    return `coach-${session.coach.id}`;
  }

  return `name-${getCoachName(session).toLowerCase()}`;
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "C";
}

function getBookedCount(session: CoachSession) {
  if (session.booked_count !== null && session.booked_count !== undefined) {
    return toNumber(session.booked_count);
  }

  return Array.isArray(session.bookings) ? session.bookings.length : 0;
}

function getCapacity(session: CoachSession) {
  return toNumber(session.capacity);
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  const parsed = parseSessionDate(value);
  if (!parsed) return value || "-";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayOfWeek(session: CoachSession) {
  const value = session.day_of_week;

  if (value !== null && value !== undefined && String(value).trim() !== "") {
    const numeric = Number(value);

    if (Number.isInteger(numeric)) {
      if (numeric >= 0 && numeric <= 6) return dayNames[numeric];
      if (numeric === 7) return dayNames[0];
    }

    return toTitleCase(String(value));
  }

  const parsedDate = parseSessionDate(session.session_date);
  return parsedDate ? dayNames[parsedDate.getDay()] : "";
}

function isRecurring(value: CoachSession["is_recurring"]) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function isSessionCancelled(session: CoachSession) {
  return normalizeStatus(session.status) === "cancelled";
}

function matchesDateFilter(session: CoachSession, filter: DateFilter) {
  if (filter === "all") return true;

  const date = parseSessionDate(session.session_date);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (filter === "today") {
    return date >= today && date < tomorrow;
  }

  if (filter === "week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return date >= today && date < nextWeek;
  }

  return date >= today;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringMessage(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function getValidationMessage(errors: unknown): string | null {
  const stringMessage = getStringMessage(errors);

  if (stringMessage) {
    return stringMessage;
  }

  if (Array.isArray(errors)) {
    for (const item of errors) {
      const message = getValidationMessage(item);

      if (message) {
        return message;
      }
    }

    return null;
  }

  if (isRecord(errors)) {
    for (const value of Object.values(errors)) {
      const message = getValidationMessage(value);

      if (message) {
        return message;
      }
    }
  }

  return null;
}

function getPayloadMessage(payload: unknown): string | null {
  const stringMessage = getStringMessage(payload);

  if (stringMessage) {
    return stringMessage;
  }

  if (!isRecord(payload)) {
    return null;
  }

  return (
    getValidationMessage(payload?.message) ??
    getValidationMessage(payload?.error) ??
    getValidationMessage(payload?.errors)
  );
}

function getErrorMessage(error: unknown) {
  const stringError = getStringMessage(error);

  if (stringError) {
    return stringError;
  }

  const maybeError = error as
    | {
        response?: { data?: unknown };
        data?: unknown;
        message?: unknown;
        error?: unknown;
        errors?: unknown;
      }
    | null
    | undefined;

  const responseMessage = getPayloadMessage(maybeError?.response?.data);

  if (responseMessage) {
    return responseMessage;
  }

  const dataMessage = getPayloadMessage(maybeError?.data);

  if (dataMessage) {
    return dataMessage;
  }

  const directMessage = getPayloadMessage(maybeError);

  if (directMessage) {
    return directMessage;
  }

  if (error instanceof Error) {
    return getStringMessage(error.message) ?? SAFE_ERROR_MESSAGE;
  }

  return SAFE_ERROR_MESSAGE;
}

function bookingStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "cancelled") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  if (normalized === "confirmed" || normalized === "booked") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-gray-100 text-gray-600 border-gray-200";
}

export function AdminCoachSessions() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<CoachSession | null>(
    null
  );
  const [toast, setToast] = useState<ToastState>(null);

  const sessionsQuery = useAdminSessions();
  const detailsQuery = useAdminSessionDetails(selectedSessionId, detailsOpen);
  const cancelMutation = useAdminCancelSession();
  const restoreMutation = useAdminRestoreSession();

  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const coachOptions = useMemo(() => {
    const options = new Map<string, string>();

    sessions.forEach((session) => {
      options.set(getCoachFilterKey(session), getCoachName(session));
    });

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sessions]);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      available: sessions.filter(
        (session) => getSessionDisplayStatus(session) === "available"
      ).length,
      full: sessions.filter(
        (session) => getSessionDisplayStatus(session) === "full"
      ).length,
      cancelled: sessions.filter(
        (session) => getSessionDisplayStatus(session) === "cancelled"
      ).length,
      bookings: sessions.reduce(
        (sum, session) => sum + getBookedCount(session),
        0
      ),
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sessions.filter((session) => {
      const coachName = getCoachName(session).toLowerCase();
      const coachEmail = getCoachEmail(session).toLowerCase();

      const matchesSearch =
        !query || coachName.includes(query) || coachEmail.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        getSessionDisplayStatus(session) === statusFilter;
      const matchesCoach =
        coachFilter === "all" || getCoachFilterKey(session) === coachFilter;
      const matchesDate = matchesDateFilter(session, dateFilter);

      return matchesSearch && matchesStatus && matchesCoach && matchesDate;
    });
  }, [coachFilter, dateFilter, searchQuery, sessions, statusFilter]);

  const selectedSessionFromList = useMemo(() => {
    if (selectedSessionId === null) return null;
    return sessions.find((session) => session.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sessions]);

  const detailSession = detailsQuery.data ?? selectedSessionFromList;
  const hasActiveFilters =
    searchQuery.trim() ||
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    coachFilter !== "all";

  function openDetails(session: CoachSession) {
    setSelectedSessionId(session.id);
    setDetailsOpen(true);
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCoachFilter("all");
  }

  async function confirmCancelSession() {
    if (!sessionToCancel) return;

    try {
      await cancelMutation.mutateAsync(sessionToCancel.id);
      setToast({
        type: "success",
        message: t("sessions.cancelled"),
      });
      setSessionToCancel(null);
    } catch (error) {
      console.error("Failed to cancel session:", error);
      setToast({
        type: "error",
        message: getErrorMessage(error),
      });
    }
  }

  async function restoreSession(session: CoachSession) {
    try {
      await restoreMutation.mutateAsync(session.id);
      setToast({
        type: "success",
        message: t("adminSessions.restored"),
      });
    } catch (error) {
      console.error("Failed to restore session:", error);
      setToast({
        type: "error",
        message: getErrorMessage(error),
      });
    }
  }

  const listErrorMessage = getErrorMessage(sessionsQuery.error);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            {t("adminSessions.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("adminSessions.subtitle")}
          </p>
        </div>
      </div>

      {toast ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {sessionsQuery.isLoading ? (
        <StateCard
          icon={<Loader2 className="w-5 h-5 animate-spin text-[#0D7D6D]" />}
          title={t("sessions.loading")}
          description={t("adminSessions.loadingDescription")}
        />
      ) : sessionsQuery.error ? (
        <StateCard
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          title={t("sessions.unableToLoad")}
          description={listErrorMessage}
          action={
            <Button
              type="button"
              onClick={() => void sessionsQuery.refetch()}
              className="rounded-xl bg-[#0D7D6D] hover:bg-[#0b6b5d] text-white"
            >
              {t("common.tryAgain")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard
              title={t("sessions.totalSessions")}
              value={stats.total}
              icon={<CalendarDays className="w-6 h-6 text-blue-600" />}
              iconClassName="bg-blue-50"
            />
            <StatCard
              title={t("common.available")}
              value={stats.available}
              icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
              iconClassName="bg-emerald-50"
            />
            <StatCard
              title={t("common.full")}
              value={stats.full}
              icon={<Users className="w-6 h-6 text-amber-600" />}
              iconClassName="bg-amber-50"
            />
            <StatCard
              title={t("common.cancelled")}
              value={stats.cancelled}
              icon={<XCircle className="w-6 h-6 text-rose-600" />}
              iconClassName="bg-rose-50"
            />
            <StatCard
              title={t("sessions.totalBookings")}
              value={stats.bookings}
              icon={<UserRound className="w-6 h-6 text-[#0D7D6D]" />}
              iconClassName="bg-[#E6F4F1]"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-400" />
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 text-sm">
                {t("adminSessions.filters")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("adminSessions.searchPlaceholder")}
                  className="pl-11 h-11 rounded-xl border-gray-200 bg-gray-50"
                />
              </div>

              <Select value={coachFilter} onValueChange={setCoachFilter}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                  <SelectValue placeholder={t("adminSessions.filterByCoach")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("coaches.allCoaches")}</SelectItem>
                  {coachOptions.map((coach) => (
                    <SelectItem key={coach.value} value={coach.value}>
                      {coach.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                  <SelectValue placeholder={t("subscriptions.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allStatus")}</SelectItem>
                  <SelectItem value="available">{t("common.available")}</SelectItem>
                  <SelectItem value="full">{t("common.full")}</SelectItem>
                  <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value as DateFilter)}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                  <SelectValue placeholder={t("sessions.date")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminSessions.allDates")}</SelectItem>
                  <SelectItem value="today">{t("sessions.today")}</SelectItem>
                  <SelectItem value="week">{t("adminSessions.thisWeek")}</SelectItem>
                  <SelectItem value="upcoming">{t("sessions.upcomingSessions")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm text-[#0D7D6D] hover:underline font-medium"
              >
                {t("adminSessions.clearFilters")}
              </button>
            ) : null}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <TableHeaderCell>{t("coaches.coach")}</TableHeaderCell>
                    <TableHeaderCell>{t("sessions.date")}</TableHeaderCell>
                    <TableHeaderCell>{t("sessions.time")}</TableHeaderCell>
                    <TableHeaderCell>{t("sessions.capacity")}</TableHeaderCell>
                    <TableHeaderCell>{t("common.status")}</TableHeaderCell>
                    <TableHeaderCell className="text-center">
                      {t("common.actions")}
                    </TableHeaderCell>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map((session) => {
                    const coachName = getCoachName(session);
                    const coachEmail = getCoachEmail(session);
                    const bookedCount = getBookedCount(session);
                    const capacity = getCapacity(session);
                    const percent =
                      capacity > 0
                        ? Math.min((bookedCount / capacity) * 100, 100)
                        : 0;
                    const displayStatus = getSessionDisplayStatus(session);
                    const meta = getStatusMeta(displayStatus);
                    const StatusIcon = meta.icon;
                    const cancelled = isSessionCancelled(session);

                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
                              {getInitial(coachName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {coachName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {coachEmail || t("coaches.coach")}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(session.session_date)}
                            </span>
                            {formatDayOfWeek(session) ? (
                              <span className="text-xs text-gray-400">
                                {formatDayOfWeek(session)}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-sm text-gray-700">
                          <div className="inline-flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatTime(session.start_time)} -{" "}
                            {formatTime(session.end_time)}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="min-w-36">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-500">
                                {bookedCount}/{capacity} {t("sessions.booked")}
                              </span>
                              <span className="font-semibold text-gray-700">
                                {Math.round(percent)}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  displayStatus === "full"
                                    ? "bg-amber-500"
                                    : cancelled
                                      ? "bg-rose-400"
                                      : "bg-[#0D7D6D]"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.className}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {getSessionStatusLabel(displayStatus, t)}
                            </span>

                            {isRecurring(session.is_recurring) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                                <Repeat2 className="w-3.5 h-3.5" />
                                {t("sessions.recurring")}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDetails(session)}
                              className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                              title={t("aiRequests.viewDetails")}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {cancelled ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void restoreSession(session)}
                                disabled={restoreMutation.isPending}
                                className="h-9 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              >
                                {restoreMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                {t("adminSessions.restore")}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSessionToCancel(session)}
                                disabled={cancelMutation.isPending}
                                className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                              >
                                <XCircle className="w-4 h-4" />
                                {t("common.cancel")}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 px-6">
                        <EmptyState
                          title={t("adminSessions.noSessions")}
                          description={t("adminSessions.adjustFilters")}
                        />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600">
                {t("common.showing")} <strong>{filteredSessions.length}</strong>{" "}
                {t("common.of")} <strong>{sessions.length}</strong>{" "}
                {t("nav.coachSessions")}
              </p>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedSessionId(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[880px] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("sessions.detailsTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("adminSessions.detailsDescription")}
            </DialogDescription>
          </DialogHeader>

          {detailsQuery.isFetching ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("adminSessions.refreshingDetails")}
            </div>
          ) : null}

          {detailsQuery.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {getErrorMessage(detailsQuery.error)}
            </div>
          ) : null}

          {detailSession ? (
            <SessionDetailsContent session={detailSession} />
          ) : (
            <div className="py-12 text-center text-gray-500">
              {t("sessions.detailsUnavailable")}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={sessionToCancel !== null}
        onOpenChange={(open) => {
          if (cancelMutation.isPending) return;
          if (!open) setSessionToCancel(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("sessions.cancelSession")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("adminSessions.cancelDescription")}
            </DialogDescription>
          </DialogHeader>

          {sessionToCancel ? (
            <div className="mt-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold text-rose-800">
                {getCoachName(sessionToCancel)}
              </p>
              <p className="mt-1">
                {formatDate(sessionToCancel.session_date)}{" "}
                {t("common.at")}{" "}
                {formatTime(sessionToCancel.start_time)} -{" "}
                {formatTime(sessionToCancel.end_time)}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSessionToCancel(null)}
              disabled={cancelMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {t("sessions.keepSession")}
            </Button>

            <Button
              type="button"
              onClick={confirmCancelSession}
              disabled={cancelMutation.isPending}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("sessions.cancelling")}
                </>
              ) : (
                t("sessions.cancelSession")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableHeaderCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconClassName}`}
      >
        {icon}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StateCard({
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
            {title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
        <CalendarDays className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function SessionDetailsContent({ session }: { session: CoachSession }) {
  const { t } = useTranslation();
  const coachName = getCoachName(session);
  const coachEmail = getCoachEmail(session);
  const bookings = Array.isArray(session.bookings) ? session.bookings : [];
  const displayStatus = getSessionDisplayStatus(session);
  const meta = getStatusMeta(displayStatus);
  const StatusIcon = meta.icon;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.className}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {getSessionStatusLabel(displayStatus, t)}
        </span>

        {isRecurring(session.is_recurring) ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
            <Repeat2 className="w-3.5 h-3.5" />
            {t("sessions.recurring")}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DetailTile label={t("sessions.date")} value={formatDate(session.session_date)} />
        <DetailTile label={t("sessions.day")} value={formatDayOfWeek(session) || "-"} />
        <DetailTile
          label={t("sessions.time")}
          value={`${formatTime(session.start_time)} - ${formatTime(
            session.end_time
          )}`}
        />
        <DetailTile
          label={t("sessions.capacity")}
          value={`${getBookedCount(session)}/${getCapacity(session)} ${t(
            "sessions.booked"
          )}`}
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white font-semibold">
            {getInitial(coachName)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{coachName}</p>
            <p className="text-sm text-gray-500 truncate">
              {coachEmail || t("sessions.noEmailAvailable")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 text-sm">
            {t("sessions.bookings")}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
            {bookings.length} {t("sessions.users")}
          </span>
        </div>

        {bookings.length > 0 ? (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <TableHeaderCell>{t("aiRequests.user")}</TableHeaderCell>
                  <TableHeaderCell>{t("common.status")}</TableHeaderCell>
                  <TableHeaderCell>{t("sessions.bookedAt")}</TableHeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => {
                  const userName =
                    booking.user?.name?.trim() || `User #${booking.user_id}`;
                  const userEmail = booking.user?.email?.trim() || "";

                  return (
                    <tr key={booking.id}>
                      <td className="py-3 px-6">
                        <p className="font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-400">
                          {userEmail || t("sessions.noEmailAvailable")}
                        </p>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${bookingStatusClass(
                            booking.status
                          )}`}
                        >
                          {toTitleCase(booking.status)}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600">
                        {formatDateTime(booking.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500">
            {t("sessions.noBookings")}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
