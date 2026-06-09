import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
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
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { getUserId } from "../../../services/auth";
import {
  getCoachSessionDetails,
  type CoachSession,
  type CreateCoachSessionPayload,
  type UpdateCoachSessionPayload,
} from "../../../services/coachSessions";
import { useCoachSessions } from "../../../hooks/coachSessions/queries/useCoachSessions";
import { useCreateCoachSession } from "../../../hooks/coachSessions/mutations/useCreateCoachSession";
import { useUpdateCoachSession } from "../../../hooks/coachSessions/mutations/useUpdateCoachSession";
import { useCancelCoachSession } from "../../../hooks/coachSessions/mutations/useCancelCoachSession";
import { useDeleteCoachSession } from "../../../hooks/coachSessions/mutations/useDeleteCoachSession";
import { useTranslation, type TranslationKey } from "../../../i18n";

type SessionDisplayStatus = "available" | "full" | "cancelled";
type SessionFormStatus = "available" | "cancelled";

type SessionFormState = {
  session_date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  capacity: string;
  status: SessionFormStatus;
  is_recurring: boolean;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type StatusMeta = {
  label: string;
  className: string;
  blockClassName: string;
  icon: LucideIcon;
};

type GridDay = {
  label: string;
  shortLabel: string;
  value: number;
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

const gridDays: GridDay[] = [
  { label: "Sunday", shortLabel: "Sun", value: 0 },
  { label: "Monday", shortLabel: "Mon", value: 1 },
  { label: "Tuesday", shortLabel: "Tue", value: 2 },
  { label: "Wednesday", shortLabel: "Wed", value: 3 },
  { label: "Thursday", shortLabel: "Thu", value: 4 },
  { label: "Friday", shortLabel: "Fri", value: 5 },
  { label: "Saturday", shortLabel: "Sat", value: 6 },
];

const weekdayTranslationKeys: Record<number, TranslationKey> = {
  0: "sessions.weekday.sunday",
  1: "sessions.weekday.monday",
  2: "sessions.weekday.tuesday",
  3: "sessions.weekday.wednesday",
  4: "sessions.weekday.thursday",
  5: "sessions.weekday.friday",
  6: "sessions.weekday.saturday",
};

const timeSlotHours = Array.from({ length: 16 }, (_, index) => index + 6);
const SCHEDULE_SLOT_HEIGHT = 104;
const SCHEDULE_START_HOUR = timeSlotHours[0] ?? 0;
const SCHEDULE_END_HOUR =
  (timeSlotHours[timeSlotHours.length - 1] ?? SCHEDULE_START_HOUR) + 1;
const SCHEDULE_START_MINUTES = SCHEDULE_START_HOUR * 60;
const SCHEDULE_END_MINUTES = SCHEDULE_END_HOUR * 60;
const SCHEDULE_TOTAL_HEIGHT = timeSlotHours.length * SCHEDULE_SLOT_HEIGHT;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const emptyForm: SessionFormState = {
  session_date: "",
  day_of_week: "none",
  start_time: "",
  end_time: "",
  capacity: "12",
  status: "available",
  is_recurring: false,
};

const statusMeta: Record<SessionDisplayStatus, StatusMeta> = {
  available: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blockClassName:
      "bg-[#E6F4F1] text-[#0F2420] border-[#0D7D6D]/20 hover:border-[#0D7D6D]/50",
    icon: CheckCircle,
  },
  full: {
    label: "Full",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    blockClassName:
      "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400",
    icon: Users,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    blockClassName:
      "bg-rose-50 text-rose-900 border-rose-200 hover:border-rose-400 opacity-80",
    icon: XCircle,
  },
};

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

  if (stringMessage) return stringMessage;

  if (Array.isArray(errors)) {
    for (const item of errors) {
      const message = getValidationMessage(item);
      if (message) return message;
    }

    return null;
  }

  if (isRecord(errors)) {
    for (const value of Object.values(errors)) {
      const message = getValidationMessage(value);
      if (message) return message;
    }
  }

  return null;
}

function getPayloadMessage(payload: unknown) {
  const stringMessage = getStringMessage(payload);

  if (stringMessage) return stringMessage;
  if (!isRecord(payload)) return null;

  return (
    getValidationMessage(payload?.message) ??
    getValidationMessage(payload?.error) ??
    getValidationMessage(payload?.errors)
  );
}

function getErrorMessage(error: unknown) {
  const stringError = getStringMessage(error);

  if (stringError) return stringError;

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

  return (
    getPayloadMessage(maybeError?.response?.data) ??
    getPayloadMessage(maybeError?.data) ??
    getPayloadMessage(maybeError) ??
    (error instanceof Error ? getStringMessage(error.message) : null) ??
    SAFE_ERROR_MESSAGE
  );
}

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

function normalizeStatus(value?: string | null): SessionDisplayStatus {
  const status = String(value ?? "available").toLowerCase();

  if (status === "full" || status === "cancelled") {
    return status;
  }

  return "available";
}

function getStatusMeta(value?: string | null): StatusMeta {
  return statusMeta[normalizeStatus(value)];
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

function getWeekdayLabel(dayValue: number, t: (key: TranslationKey) => string) {
  return t(weekdayTranslationKeys[dayValue] ?? "sessions.weekday.sunday");
}

function parseDateKey(value: string) {
  const match = value.match(DATE_ONLY_PATTERN);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function toDateInputFromDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getSessionDateKey(value?: string | null) {
  if (!value) return "";

  const trimmed = String(value).trim();

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {
    return toDateInputFromDate(parsed);
  }

  return trimmed.match(DATE_PREFIX_PATTERN)?.[0] ?? "";
}

function parseSessionDate(value?: string | null) {
  const dateKey = getSessionDateKey(value);
  return dateKey ? parseDateKey(dateKey) : null;
}

function getWeekStart(date: Date) {
  return startOfDay(addDays(date, -date.getDay()));
}

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDateForWeekday(weekStart: Date, dayValue: number) {
  return addDays(weekStart, dayValue);
}

function getWeekEnd(weekStart: Date) {
  return addDays(weekStart, 7);
}

function isSameDate(first: Date, second: Date) {
  return toDateInputFromDate(first) === toDateInputFromDate(second);
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  const startLabel = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} - ${endLabel}`;
}

function getSessionCalendarDate(session: CoachSession) {
  const parsedDate = parseSessionDate(session.session_date);
  return parsedDate ? startOfDay(parsedDate) : null;
}

function isSessionInVisibleWeek(session: CoachSession, weekStart: Date) {
  const sessionDate = getSessionCalendarDate(session);

  if (!sessionDate) {
    return false;
  }

  return sessionDate >= weekStart && sessionDate < getWeekEnd(weekStart);
}

function isSessionAfterVisibleWeek(session: CoachSession, weekStart: Date) {
  const sessionDate = getSessionCalendarDate(session);

  if (!sessionDate) {
    return false;
  }

  return sessionDate >= getWeekEnd(weekStart);
}

function getDayValueFromDate(value: string) {
  const parsed = parseSessionDate(value);
  return parsed ? String(parsed.getDay()) : "none";
}

function formatGridDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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

function formatHourLabel(hour: number) {
  const normalizedHour = hour % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const displayHour = normalizedHour % 12 || 12;

  return `${displayHour}:00 ${period}`;
}

function hourToTime(hour: number) {
  const normalizedHour = Math.min(Math.max(hour, 0), 23);
  return `${String(normalizedHour).padStart(2, "0")}:00`;
}

function getSlotStartDateTime(slotDate: Date, slotStartTime: string) {
  const [hourPart, minutePart = "0"] = slotStartTime.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const slotStart = new Date(slotDate);
  slotStart.setHours(hours, minutes, 0, 0);
  return slotStart;
}

function isPastSlot(slotDate: Date, slotStartTime: string) {
  const slotStart = getSlotStartDateTime(slotDate, slotStartTime);

  if (!slotStart) {
    return true;
  }

  return slotStart <= new Date();
}

function timeToMinutes(value?: string | null) {
  if (!value) return null;

  const formatted = formatTime(value);
  const parts = formatted.split(":").map(Number);

  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  return parts[0] * 60 + parts[1];
}

function getDurationMinutes(session: CoachSession) {
  const start = timeToMinutes(session.start_time);
  const end = timeToMinutes(session.end_time);

  if (start === null || end === null || end <= start) {
    return null;
  }

  return end - start;
}

function getScheduleBlockPosition(session: CoachSession): CSSProperties | null {
  const start = timeToMinutes(session.start_time);
  const end = timeToMinutes(session.end_time);

  if (start === null || end === null || end <= start) {
    return null;
  }

  const visibleStart = Math.max(start, SCHEDULE_START_MINUTES);
  const visibleEnd = Math.min(end, SCHEDULE_END_MINUTES);

  if (visibleEnd <= visibleStart) {
    return null;
  }

  const top =
    ((visibleStart - SCHEDULE_START_MINUTES) / 60) * SCHEDULE_SLOT_HEIGHT;
  const height =
    ((visibleEnd - visibleStart) / 60) * SCHEDULE_SLOT_HEIGHT;

  return {
    top,
    height: Math.max(height, 1),
  };
}

function formatDayOfWeek(session: CoachSession) {
  const parsedDate = parseSessionDate(session.session_date);

  if (parsedDate) {
    return dayNames[parsedDate.getDay()];
  }

  const value = session.day_of_week;

  if (value !== null && value !== undefined && String(value).trim() !== "") {
    const numeric = Number(value);

    if (Number.isInteger(numeric)) {
      if (numeric >= 0 && numeric <= 6) return dayNames[numeric];
      if (numeric === 7) return dayNames[0];
    }

    return toTitleCase(String(value));
  }

  return "";
}

function getSessionDayValue(session: CoachSession) {
  const parsedDate = parseSessionDate(session.session_date);

  if (parsedDate) {
    return parsedDate.getDay();
  }

  const value = session.day_of_week;

  if (value !== null && value !== undefined && String(value).trim() !== "") {
    const numeric = Number(value);

    if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 6) {
      return numeric;
    }
  }

  return null;
}

function isRecurring(value: CoachSession["is_recurring"]) {
  return value === true || value === 1 || value === "1" || value === "true";
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

function isSessionCancelled(session: CoachSession) {
  return normalizeStatus(session.status) === "cancelled";
}

function getSessionLabel(session: CoachSession) {
  return session.coach?.name?.trim() || "Session";
}

function toDateInput(value?: string | null) {
  return getSessionDateKey(value);
}

function toTimeInput(value?: string | null) {
  if (!value) return "";
  return formatTime(value);
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

function buildFormFromSession(session: CoachSession): SessionFormState {
  const sessionDate = toDateInput(session.session_date);

  return {
    session_date: sessionDate,
    day_of_week: sessionDate
      ? getDayValueFromDate(sessionDate)
      : session.day_of_week === null || session.day_of_week === undefined
        ? "none"
        : String(session.day_of_week),
    start_time: toTimeInput(session.start_time),
    end_time: toTimeInput(session.end_time),
    capacity: String(getCapacity(session) || 12),
    status: normalizeStatus(session.status) === "cancelled" ? "cancelled" : "available",
    is_recurring: isRecurring(session.is_recurring),
  };
}

function buildSessionPayload(
  form: SessionFormState,
  coachId: number
): CreateCoachSessionPayload {
  const sessionDate = toDateInput(form.session_date);
  const dayOfWeek = sessionDate
    ? getDayValueFromDate(sessionDate)
    : form.day_of_week;

  return {
    coach_id: coachId,
    day_of_week: dayOfWeek === "none" ? null : Number(dayOfWeek),
    session_date: sessionDate || null,
    start_time: form.start_time,
    end_time: form.end_time,
    capacity: Number(form.capacity),
    status: form.status,
    is_recurring: form.is_recurring,
  };
}

function validateForm(
  form: SessionFormState,
  requireSessionDate: boolean,
  t: (key: TranslationKey) => string
) {
  if (requireSessionDate && !form.session_date) {
    return t("sessions.validationDateRequired");
  }

  if (!form.start_time || !form.end_time) {
    return t("sessions.validationTimesRequired");
  }

  if (form.start_time >= form.end_time) {
    return t("sessions.validationEndAfterStart");
  }

  if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
    return t("sessions.validationCapacity");
  }

  return "";
}

export function CoachSessions() {
  const { t } = useTranslation();
  const coachUserId = useMemo(() => {
    const userId = getUserId();
    return Number.isFinite(userId) ? userId : null;
  }, []);

  const [toast, setToast] = useState<ToastState>(null);
  const [formError, setFormError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState<CoachSession | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CoachSession | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<CoachSession | null>(
    null
  );
  const [sessionToDelete, setSessionToDelete] = useState<CoachSession | null>(
    null
  );
  const [form, setForm] = useState<SessionFormState>(emptyForm);
  const [visibleWeekStart, setVisibleWeekStart] = useState(() =>
    getWeekStart(new Date())
  );

  const sessionsQuery = useCoachSessions(coachUserId);
  const createMutation = useCreateCoachSession();
  const updateMutation = useUpdateCoachSession();
  const cancelMutation = useCancelCoachSession();
  const deleteMutation = useDeleteCoachSession();

  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const isViewingCurrentWeek = isSameDate(
    visibleWeekStart,
    getWeekStart(new Date())
  );

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter((session) => isSessionAfterVisibleWeek(session, visibleWeekStart))
      .sort((first, second) => {
        const firstDate = getSessionCalendarDate(first)?.getTime() ?? 0;
        const secondDate = getSessionCalendarDate(second)?.getTime() ?? 0;
        const firstTime = timeToMinutes(first.start_time) ?? 0;
        const secondTime = timeToMinutes(second.start_time) ?? 0;

        return firstDate - secondDate || firstTime - secondTime;
      });
  }, [sessions, visibleWeekStart]);

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError("");
    setCreateOpen(true);
  }

  function showPreviousWeek() {
    setVisibleWeekStart((current) => getWeekStart(addDays(current, -7)));
  }

  function showCurrentWeek() {
    setVisibleWeekStart(getWeekStart(new Date()));
  }

  function showNextWeek() {
    setVisibleWeekStart((current) => getWeekStart(addDays(current, 7)));
  }

  function openCreateDialogForSlot(dayValue: number, hour: number) {
    const selectedDate = getDateForWeekday(visibleWeekStart, dayValue);
    const sessionDate = toDateInputFromDate(selectedDate);
    const startTime = hourToTime(hour);

    if (isPastSlot(selectedDate, startTime)) {
      return;
    }

    setForm({
      ...emptyForm,
      session_date: sessionDate,
      day_of_week: getDayValueFromDate(sessionDate),
      start_time: startTime,
      end_time: hourToTime(hour + 1),
    });
    setFormError("");
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setForm(emptyForm);
    setFormError("");
  }

  function openEditDialog(session: CoachSession) {
    setEditSession(session);
    setForm(buildFormFromSession(session));
    setFormError("");
  }

  function closeEditDialog() {
    setEditSession(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function openDetailsDialog(session: CoachSession) {
    setSelectedSession(session);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const details = await getCoachSessionDetails(session.id);
      setSelectedSession(details);
    } catch (error) {
      console.error("Failed to load session details:", error);
      setToast({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleCreateSession() {
    const validationMessage = validateForm(form, true, t);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const sessionDate = parseSessionDate(form.session_date);

    if (!sessionDate || isPastSlot(sessionDate, form.start_time)) {
      setFormError(t("sessions.validationPast"));
      return;
    }

    if (coachUserId === null) {
      setFormError(t("sessions.userIdMissingDescription"));
      return;
    }

    try {
      setFormError("");
      await createMutation.mutateAsync(buildSessionPayload(form, coachUserId));
      setToast({ type: "success", message: t("sessions.created") });
      closeCreateDialog();
    } catch (error) {
      console.error("Failed to create session:", error);
      setFormError(getErrorMessage(error));
    }
  }

  async function handleUpdateSession() {
    if (!editSession) return;

    const validationMessage = validateForm(form, false, t);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    if (coachUserId === null) {
      setFormError(t("sessions.userIdMissingDescription"));
      return;
    }

    try {
      setFormError("");
      const payload: UpdateCoachSessionPayload = buildSessionPayload(
        form,
        coachUserId
      );

      await updateMutation.mutateAsync({
        sessionId: editSession.id,
        payload,
      });
      setToast({ type: "success", message: t("sessions.updated") });
      closeEditDialog();
    } catch (error) {
      console.error("Failed to update session:", error);
      setFormError(getErrorMessage(error));
    }
  }

  async function confirmCancelSession() {
    if (!sessionToCancel) return;

    try {
      await cancelMutation.mutateAsync(sessionToCancel.id);
      setToast({ type: "success", message: t("sessions.cancelled") });
      setSessionToCancel(null);
      if (selectedSession?.id === sessionToCancel.id) {
        setDetailsOpen(false);
        setSelectedSession(null);
      }
    } catch (error) {
      console.error("Failed to cancel session:", error);
      setToast({ type: "error", message: getErrorMessage(error) });
    }
  }

  async function confirmDeleteSession() {
    if (!sessionToDelete) return;

    try {
      await deleteMutation.mutateAsync(sessionToDelete.id);
      setToast({ type: "success", message: t("sessions.deleted") });
      setSessionToDelete(null);
      if (selectedSession?.id === sessionToDelete.id) {
        setDetailsOpen(false);
        setSelectedSession(null);
      }
      if (editSession?.id === sessionToDelete.id) {
        closeEditDialog();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      setToast({ type: "error", message: getErrorMessage(error) });
    }
  }

  if (coachUserId === null) {
    return (
      <div className="space-y-6">
        <Header onCreate={openCreateDialog} createDisabled />
        <StateCard
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          title={t("sessions.userIdMissingTitle")}
          description={t("sessions.userIdMissingDescription")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onCreate={openCreateDialog} />

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
          description={t("sessions.loadingDescription")}
        />
      ) : sessionsQuery.error ? (
        <StateCard
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          title={t("sessions.unableToLoad")}
          description={getErrorMessage(sessionsQuery.error)}
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

          <ScheduleGrid
            sessions={sessions}
            visibleWeekStart={visibleWeekStart}
            isViewingCurrentWeek={isViewingCurrentWeek}
            onPreviousWeek={showPreviousWeek}
            onCurrentWeek={showCurrentWeek}
            onNextWeek={showNextWeek}
            onEmptySlotClick={openCreateDialogForSlot}
            onSessionClick={(session) => void openDetailsDialog(session)}
          />

          {upcomingSessions.length > 0 ? (
            <UpcomingSessions
              sessions={upcomingSessions}
              onSessionClick={(session) => void openDetailsDialog(session)}
            />
          ) : null}
        </>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (createMutation.isPending) return;
          if (open) {
            setCreateOpen(true);
          } else {
            closeCreateDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("sessions.createSession")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("sessions.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <SessionForm
            form={form}
            setForm={setForm}
            formError={formError}
            submitLabel={t("sessions.createSession")}
            submittingLabel={t("common.creating")}
            isSubmitting={createMutation.isPending}
            onSubmit={handleCreateSession}
            onCancel={closeCreateDialog}
            requireDate
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editSession !== null}
        onOpenChange={(open) => {
          if (updateMutation.isPending) return;
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("sessions.editSession")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("sessions.editDescription")}
            </DialogDescription>
          </DialogHeader>

          <SessionForm
            form={form}
            setForm={setForm}
            formError={formError}
            submitLabel={t("aiRequests.saveChanges")}
            submittingLabel={t("common.saving")}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleUpdateSession}
            onCancel={closeEditDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedSession(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[880px] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("sessions.detailsTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("sessions.detailsDescription")}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("sessions.loadingDetails")}
            </div>
          ) : null}

          {selectedSession ? (
            <>
              <SessionDetailsContent session={selectedSession} />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDetailsOpen(false);
                    openEditDialog(selectedSession);
                  }}
                  className="flex-1 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  <Pencil className="w-4 h-4" />
                  {t("common.edit")}
                </Button>

                {!isSessionCancelled(selectedSession) ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDetailsOpen(false);
                      setSessionToCancel(selectedSession);
                    }}
                    className="flex-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {t("common.cancel")}
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDetailsOpen(false);
                    setSessionToDelete(selectedSession);
                  }}
                  className="flex-1 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("common.delete")}
                </Button>
              </div>
            </>
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
              {t("sessions.cancelDescription")}
            </DialogDescription>
          </DialogHeader>

          {sessionToCancel ? (
            <div className="mt-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold text-rose-800">
                {formatDate(sessionToCancel.session_date)}
              </p>
              <p className="mt-1">
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

      <Dialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          if (!open) setSessionToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("sessions.deleteSession")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("sessions.deleteDescription")}
            </DialogDescription>
          </DialogHeader>

          {sessionToDelete ? (
            <div className="mt-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold text-rose-800">
                {formatDate(sessionToDelete.session_date)}
              </p>
              <p className="mt-1">
                {formatTime(sessionToDelete.start_time)} -{" "}
                {formatTime(sessionToDelete.end_time)}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSessionToDelete(null)}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {t("sessions.keepSession")}
            </Button>

            <Button
              type="button"
              onClick={confirmDeleteSession}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.deleting")}
                </>
              ) : (
                t("sessions.deleteSession")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header({
  onCreate,
  createDisabled = false,
}: {
  onCreate: () => void;
  createDisabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
          {t("sessions.title")}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {t("sessions.subtitle")}
        </p>
      </div>

      <Button
        type="button"
        onClick={onCreate}
        disabled={createDisabled}
        className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md"
      >
        <Plus className="w-4 h-4" />
        {t("sessions.createSession")}
      </Button>
    </div>
  );
}

function ScheduleGrid({
  sessions,
  visibleWeekStart,
  isViewingCurrentWeek,
  onPreviousWeek,
  onCurrentWeek,
  onNextWeek,
  onEmptySlotClick,
  onSessionClick,
}: {
  sessions: CoachSession[];
  visibleWeekStart: Date;
  isViewingCurrentWeek: boolean;
  onPreviousWeek: () => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
  onEmptySlotClick: (dayValue: number, hour: number) => void;
  onSessionClick: (session: CoachSession) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
            {t("sessions.weeklySchedule")}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {t("sessions.weeklyDescription")}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
            <CalendarDays className="w-4 h-4 text-[#0D7D6D]" />
            {formatWeekRange(visibleWeekStart)}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onPreviousWeek}
              aria-label={t("sessions.weeklySchedule")}
              className="h-8 w-8 rounded-lg border-gray-200 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 rtl-flip" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCurrentWeek}
              disabled={isViewingCurrentWeek}
              className="h-8 rounded-lg border-gray-200 text-gray-600 disabled:bg-gray-50"
            >
              {t("sessions.today")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onNextWeek}
              aria-label={t("sessions.weeklySchedule")}
              className="h-8 w-8 rounded-lg border-gray-200 text-gray-600"
            >
              <ChevronRight className="w-4 h-4 rtl-flip" />
            </Button>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4 text-gray-400" />
            6:00 AM - 9:00 PM
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1120px]">
          <div
            className="grid bg-gray-100"
            style={{
              gridTemplateColumns: "88px repeat(7, minmax(145px, 1fr))",
            }}
          >
            <div className="bg-gray-50 border-r border-b border-gray-200 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("sessions.time")}
            </div>

            {gridDays.map((day) => {
              const date = getDateForWeekday(visibleWeekStart, day.value);

              return (
                <div
                  key={day.value}
                  className="bg-gray-50 border-r border-b border-gray-200 px-3 py-3 text-center"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {getWeekdayLabel(day.value, t)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatGridDate(date)}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className="grid bg-gray-100"
            style={{
              gridTemplateColumns: "88px repeat(7, minmax(145px, 1fr))",
            }}
          >
            <div className="bg-white border-r border-gray-100">
              {timeSlotHours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-gray-100 px-3 py-4 text-xs font-semibold text-gray-500"
                  style={{ height: SCHEDULE_SLOT_HEIGHT }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {gridDays.map((day) => (
              <ScheduleDayColumn
                key={day.value}
                day={day}
                sessions={sessions}
                visibleWeekStart={visibleWeekStart}
                onEmptySlotClick={onEmptySlotClick}
                onSessionClick={onSessionClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleDayColumn({
  day,
  sessions,
  visibleWeekStart,
  onEmptySlotClick,
  onSessionClick,
}: {
  day: GridDay;
  sessions: CoachSession[];
  visibleWeekStart: Date;
  onEmptySlotClick: (dayValue: number, hour: number) => void;
  onSessionClick: (session: CoachSession) => void;
}) {
  const { t } = useTranslation();
  const sessionsForDay = sessions
    .filter(
      (session) =>
        isSessionInVisibleWeek(session, visibleWeekStart) &&
        getSessionDayValue(session) === day.value
    )
    .sort(
      (first, second) =>
        (timeToMinutes(first.start_time) ?? 0) -
        (timeToMinutes(second.start_time) ?? 0)
    );

  return (
    <div
      className="relative bg-white"
      style={{ height: SCHEDULE_TOTAL_HEIGHT }}
    >
      {timeSlotHours.map((hour) => {
        const slotDate = getDateForWeekday(visibleWeekStart, day.value);
        const slotIsPast = isPastSlot(slotDate, hourToTime(hour));
        const canCreateInSlot = !slotIsPast;

        return (
          <div
            key={hour}
            role={canCreateInSlot ? "button" : undefined}
            tabIndex={canCreateInSlot ? 0 : undefined}
            onClick={() => {
              if (!canCreateInSlot) return;
              onEmptySlotClick(day.value, hour);
            }}
            onKeyDown={(event) => {
              if (!canCreateInSlot) return;
              if (event.key === "Enter" || event.key === " ") {
                onEmptySlotClick(day.value, hour);
              }
            }}
            className={`border-r border-b border-gray-100 p-2 transition-colors ${
              canCreateInSlot
                ? "bg-white cursor-pointer hover:bg-[#E6F4F1]/40 focus:outline-none focus:ring-2 focus:ring-[#0D7D6D]/30 focus:ring-inset"
                : "bg-gray-50 cursor-default"
            }`}
            style={{ height: SCHEDULE_SLOT_HEIGHT }}
          >
            {canCreateInSlot ? (
              <div className="h-full rounded-xl border border-dashed border-transparent flex items-center justify-center text-xs text-transparent hover:text-[#0D7D6D] hover:border-[#0D7D6D]/20">
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t("common.add")}
              </div>
            ) : (
              <div className="h-full rounded-xl border border-transparent" />
            )}
          </div>
        );
      })}

      {sessionsForDay.map((session) => {
        const position = getScheduleBlockPosition(session);

        if (!position) {
          return null;
        }

        return (
          <SessionBlock
            key={session.id}
            session={session}
            onClick={() => onSessionClick(session)}
            className="absolute left-2 right-2 z-10"
            style={position}
          />
        );
      })}
    </div>
  );
}

function SessionBlock({
  session,
  onClick,
  className = "",
  style,
}: {
  session: CoachSession;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const { t } = useTranslation();
  const bookedCount = getBookedCount(session);
  const capacity = getCapacity(session);
  const duration = getDurationMinutes(session);
  const status = getSessionDisplayStatus(session);
  const meta = getStatusMeta(status);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`block text-left rounded-xl border px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md overflow-hidden ${meta.blockClassName} ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{getSessionLabel(session)}</p>
          <p className="text-xs opacity-75 mt-0.5">
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </p>
        </div>
        {isRecurring(session.is_recurring) ? (
          <Repeat2 className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] font-semibold">
        <span className="rounded-full bg-white/70 px-2 py-0.5">
          {bookedCount}/{capacity} {t("sessions.spots")}
        </span>
        {duration !== null ? (
          <span className="rounded-full bg-white/70 px-2 py-0.5">
          {duration} {t("sessions.minutes")}
          </span>
        ) : null}
        <span className="rounded-full bg-white/70 px-2 py-0.5">
          {getSessionStatusLabel(status, t)}
        </span>
      </div>
    </button>
  );
}

function UpcomingSessions({
  sessions,
  onSessionClick,
}: {
  sessions: CoachSession[];
  onSessionClick: (session: CoachSession) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
        {t("sessions.upcomingSessions")}
      </h3>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        {t("sessions.upcomingDescription")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sessions.map((session) => (
          <UpcomingSessionCard
            key={session.id}
            session={session}
            onClick={() => onSessionClick(session)}
          />
        ))}
      </div>
    </div>
  );
}

function UpcomingSessionCard({
  session,
  onClick,
}: {
  session: CoachSession;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const bookedCount = getBookedCount(session);
  const capacity = getCapacity(session);
  const status = getSessionDisplayStatus(session);
  const meta = getStatusMeta(status);
  const StatusIcon = meta.icon;
  const dayValue = getSessionDayValue(session);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0D7D6D]/30 hover:bg-[#E6F4F1]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {getSessionLabel(session)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(session.session_date)} -{" "}
            {dayValue !== null ? getWeekdayLabel(dayValue, t) : formatDayOfWeek(session) || "-"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </p>
        </div>

        {isRecurring(session.is_recurring) ? (
          <Repeat2 className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 mt-1" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] font-semibold">
        <span className="rounded-full bg-white px-2 py-0.5 text-gray-700 border border-gray-100">
          {bookedCount}/{capacity} {t("sessions.spots")}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${meta.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {getSessionStatusLabel(status, t)}
        </span>
        <span className="ml-auto text-[#0D7D6D]">{t("sessions.manage")}</span>
      </div>
    </button>
  );
}

function SessionForm({
  form,
  setForm,
  formError,
  submitLabel,
  submittingLabel,
  isSubmitting,
  onSubmit,
  onCancel,
  requireDate = false,
}: {
  form: SessionFormState;
  setForm: Dispatch<SetStateAction<SessionFormState>>;
  formError: string;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  requireDate?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 mt-2">
      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-gray-600 text-sm">
            {t("sessions.sessionDate")}
            {requireDate ? " *" : ""}
          </Label>
          <Input
            type="date"
            value={form.session_date}
            onChange={(event) => {
              const sessionDate = event.target.value;

              setForm((current) => ({
                ...current,
                session_date: sessionDate,
                day_of_week: getDayValueFromDate(sessionDate),
              }));
            }}
            className="rounded-xl border-gray-200 bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-gray-600 text-sm">{t("sessions.dayOfWeek")}</Label>
          <Select
            value={form.day_of_week}
            disabled={Boolean(form.session_date)}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, day_of_week: value }))
            }
          >
            <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
              <SelectValue placeholder={t("sessions.optionalDay")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("sessions.noDay")}</SelectItem>
              {gridDays.map((day) => (
                <SelectItem key={day.value} value={String(day.value)}>
                  {getWeekdayLabel(day.value, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-gray-600 text-sm">{t("sessions.startTime")}</Label>
          <Input
            type="time"
            value={form.start_time}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                start_time: event.target.value,
              }))
            }
            className="rounded-xl border-gray-200 bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-gray-600 text-sm">{t("sessions.endTime")}</Label>
          <Input
            type="time"
            value={form.end_time}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                end_time: event.target.value,
              }))
            }
            className="rounded-xl border-gray-200 bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-gray-600 text-sm">{t("sessions.capacity")}</Label>
          <Input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                capacity: event.target.value,
              }))
            }
            className="rounded-xl border-gray-200 bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-gray-600 text-sm">{t("sessions.status")}</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as SessionFormStatus,
              }))
            }
          >
            <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">{t("common.available")}</SelectItem>
              <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-gray-900">
            {t("sessions.recurringSession")}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {t("sessions.recurringDescription")}
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.is_recurring}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              is_recurring: event.target.checked,
            }))
          }
          className="h-5 w-5 rounded border-gray-300 accent-[#0D7D6D]"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-xl"
        >
          {t("common.cancel")}
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}

function SessionDetailsContent({ session }: { session: CoachSession }) {
  const { t } = useTranslation();
  const bookings = Array.isArray(session.bookings) ? session.bookings : [];
  const status = getSessionDisplayStatus(session);
  const meta = getStatusMeta(status);
  const StatusIcon = meta.icon;
  const duration = getDurationMinutes(session);
  const dayValue = getSessionDayValue(session);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.className}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {getSessionStatusLabel(status, t)}
        </span>

        {isRecurring(session.is_recurring) ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
            <Repeat2 className="w-3.5 h-3.5" />
            {t("sessions.recurring")}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <DetailTile label={t("sessions.date")} value={formatDate(session.session_date)} />
        <DetailTile
          label={t("sessions.day")}
          value={dayValue !== null ? getWeekdayLabel(dayValue, t) : formatDayOfWeek(session) || "-"}
        />
        <DetailTile
          label={t("sessions.time")}
          value={`${formatTime(session.start_time)} - ${formatTime(
            session.end_time
          )}`}
        />
        <DetailTile
          label={t("sessions.capacity")}
          value={`${getBookedCount(session)}/${getCapacity(session)} ${t("sessions.booked")}`}
        />
        <DetailTile
          label={t("sessions.duration")}
          value={duration !== null ? `${duration} ${t("sessions.minutes")}` : "-"}
        />
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
                  <TableHeaderCell>{t("sessions.status")}</TableHeaderCell>
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

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
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
