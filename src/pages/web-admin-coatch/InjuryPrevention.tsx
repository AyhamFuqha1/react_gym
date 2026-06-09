import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  UserRound,
  Pencil,
  Trash2,
  XCircle,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type {
  InjuryDashboardItem,
  InjurySeverity,
  InjuryStatus,
} from "../../services/injuries";
import {
  getInitials,
  getSafeArray,
  normalizeSeverity,
  normalizeStatus,
} from "../../utils/injuries";
import { useInjuriesDashboard } from "../../hooks/injuries/queries/useInjuriesDashboard";
import { useInjuryById } from "../../hooks/injuries/queries/useInjuryById";
import { useCreateInjury } from "../../hooks/injuries/mutations/useCreateInjury";
import { useUpdateInjury } from "../../hooks/injuries/mutations/useUpdateInjury";
import { useDeleteInjury } from "../../hooks/injuries/mutations/useDeleteInjury";
import { useTranslation } from "../../i18n";

type StatusFilter = "all" | InjuryStatus;
type SeverityFilter = "all" | InjurySeverity;

const severityStyles: Record<
  string,
  {
    card: string;
    chip: string;
    chipText: string;
  }
> = {
  severe: {
    card: "bg-red-50 border-red-200",
    chip: "bg-red-100",
    chipText: "text-red-700",
  },
  moderate: {
    card: "bg-orange-50 border-orange-200",
    chip: "bg-orange-100",
    chipText: "text-orange-700",
  },
  mild: {
    card: "bg-amber-50 border-amber-200",
    chip: "bg-amber-100",
    chipText: "text-amber-700",
  },
};

const statusStyles: Record<
  string,
  {
    badge: string;
    label: string;
  }
> = {
  active: {
    badge: "bg-red-50 text-red-600 border-red-100",
    label: "Active",
  },
  recovered: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Recovered",
  },
};

function formatLabel(value: unknown, fallback = "Unknown") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  return raw
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function InjuryPrevention() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    user_id: "",
    injury_type: "",
    severity: "mild" as InjurySeverity,
    status: "active" as InjuryStatus,
    notes: "",
  });

  const [createForm, setCreateForm] = useState({
    user_id: "",
    injury_type: "",
    severity: "mild" as InjurySeverity,
    status: "active" as InjuryStatus,
    notes: "",
  });

  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const {
    data: dashboardResponse,
    isLoading: loading,
    isFetching,
  } = useInjuriesDashboard(page);

  const {
    data: injuryDetailsResponse,
    isLoading: loadingDetails,
  } = useInjuryById(selectedId, isEditOpen);

  const createInjuryMutation = useCreateInjury();
  const updateInjuryMutation = useUpdateInjury();
  const deleteInjuryMutation = useDeleteInjury();

  const items: InjuryDashboardItem[] = Array.isArray(dashboardResponse?.data)
    ? dashboardResponse.data
    : [];

  const pagination = {
    current_page: dashboardResponse?.current_page ?? 1,
    from: dashboardResponse?.from ?? null,
    to: dashboardResponse?.to ?? null,
    total: dashboardResponse?.total ?? 0,
    last_page: dashboardResponse?.last_page ?? 1,
    prev_page_url: dashboardResponse?.prev_page_url ?? null,
    next_page_url: dashboardResponse?.next_page_url ?? null,
  };

  function resetCreateForm() {
    setCreateForm({
      user_id: "",
      injury_type: "",
      severity: "mild",
      status: "active",
      notes: "",
    });
    setCreateError("");
  }

  useEffect(() => {
    const injury = injuryDetailsResponse?.data;
    if (!injury) return;

    setForm({
      user_id: String(injury.user_id ?? ""),
      injury_type: injury.injury_type ?? "",
      severity: normalizeSeverity(injury.severity),
      status: normalizeStatus(injury.status),
      notes: injury.notes ?? "",
    });
    setEditError("");
  }, [injuryDetailsResponse]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const normalizedStatus = normalizeStatus(item.status);
      const normalizedSeverity = normalizeSeverity(item.severity);

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      const matchesSeverity =
        severityFilter === "all" || normalizedSeverity === severityFilter;

      return matchesStatus && matchesSeverity;
    });
  }, [items, statusFilter, severityFilter]);

  const stats = useMemo(() => {
    const activeCases = items.filter(
      (item) => normalizeStatus(item.status) === "active"
    ).length;

    const recoveredCases = items.filter(
      (item) => normalizeStatus(item.status) === "recovered"
    ).length;

    const severeSeverityCases = items.filter(
      (item) => normalizeSeverity(item.severity) === "severe"
    ).length;

    return {
      totalCases: pagination.total,
      activeCases,
      recoveredCases,
      severeSeverityCases,
    };
  }, [items, pagination.total]);

  const attentionCount = useMemo(() => {
    return items.filter((item) => normalizeStatus(item.status) === "active")
      .length;
  }, [items]);

  async function handleCreateInjury() {
    if (!createForm.user_id.trim() || !createForm.injury_type.trim()) {
      setCreateError(t("injuries.requiredError"));
      return;
    }

    try {
      setCreateError("");

      await createInjuryMutation.mutateAsync({
        user_id: Number(createForm.user_id),
        injury_type: createForm.injury_type.trim(),
        severity: normalizeSeverity(createForm.severity),
        status: normalizeStatus(createForm.status),
        notes: createForm.notes.trim(),
      });

      setIsCreateOpen(false);
      resetCreateForm();
      setPage(1);
    } catch (error) {
      console.error("Failed to create injury:", error);
      setCreateError(t("injuries.createFailed"));
    }
  }

  function handleOpenEdit(id: number) {
    setSelectedId(id);
    setEditError("");
    setIsEditOpen(true);
  }

  async function handleSaveUpdate() {
    if (!selectedId) return;

    if (!form.user_id.trim() || !form.injury_type.trim()) {
      setEditError(t("injuries.requiredError"));
      return;
    }

    try {
      setEditError("");

      await updateInjuryMutation.mutateAsync({
        id: selectedId,
        payload: {
          user_id: Number(form.user_id),
          injury_type: form.injury_type.trim(),
          severity: normalizeSeverity(form.severity),
          status: normalizeStatus(form.status),
          notes: form.notes.trim(),
        },
      });

      setIsEditOpen(false);
      setSelectedId(null);
    } catch (error) {
      console.error("Failed to update injury:", error);
      setEditError(t("injuries.updateFailed"));
    }
  }

  function handleDelete(id: number) {
    setPendingDeleteId(id);
    setDeleteError("");
    setConfirmDeleteOpen(true);
  }

  async function confirmDeleteInjury() {
    if (!pendingDeleteId) return;

    try {
      setDeleteError("");
      setDeletingId(pendingDeleteId);
      await deleteInjuryMutation.mutateAsync(pendingDeleteId);

      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }

      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (error) {
      console.error("Failed to delete injury:", error);
      setDeleteError(t("injuries.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePreviousPage() {
    if (!pagination.prev_page_url || loading || isFetching) return;
    setPage((prev) => Math.max(prev - 1, 1));
  }

  async function handleNextPage() {
    if (!pagination.next_page_url || loading || isFetching) return;
    setPage((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            {t("injuries.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("injuries.subtitle")}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setCreateError("");
            setIsCreateOpen(true);
          }}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0"
        >
          <Plus size={16} className="mr-2" />
          {t("injuries.addInjury")}
        </Button>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl flex-shrink-0">
            <AlertTriangle className="text-orange-500" size={20} />
          </div>

          <div>
            <p className="font-semibold text-gray-800 mb-1">
              {t("injuries.attentionRequired")}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {attentionCount} {t("injuries.attentionSuffix")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: t("injuries.totalCases"),
            value: String(stats.totalCases),
            icon: UserRound,
            iconBg: "bg-[#E6F4F1]",
            iconColor: "text-[#0D7D6D]",
          },
          {
            label: t("injuries.activeCases"),
            value: String(stats.activeCases),
            icon: ShieldAlert,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
          },
          {
            label: t("injuries.recoveredCases"),
            value: String(stats.recoveredCases),
            icon: ShieldCheck,
            iconBg: "bg-gray-100",
            iconColor: "text-gray-600",
          },
          {
            label: t("injuries.severeCases"),
            value: String(stats.severeSeverityCases),
            icon: AlertTriangle,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div
                className={`${stat.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center mb-3`}
              >
                <Icon className={stat.iconColor} size={22} />
              </div>

              <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
              {t("injuries.memberHealthConditions")}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {pagination.total > 0 &&
              pagination.from !== null &&
              pagination.to !== null
                ? `${t("common.showing")} ${pagination.from}-${pagination.to} ${t(
                    "common.of"
                  )} ${pagination.total}`
                : t("injuries.noCasesAvailable")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-40 rounded-xl border-gray-200 bg-white">
                <Filter size={14} className="mr-1.5 text-gray-400" />
                <SelectValue placeholder={t("sessions.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatus")}</SelectItem>
                <SelectItem value="active">{t("common.active")}</SelectItem>
                <SelectItem value="recovered">{t("common.recovered")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(value) =>
                setSeverityFilter(value as SeverityFilter)
              }
            >
              <SelectTrigger className="w-40 rounded-xl border-gray-200 bg-white">
                <Filter size={14} className="mr-1.5 text-gray-400" />
                <SelectValue placeholder={t("injuries.severity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("injuries.allSeverity")}</SelectItem>
                <SelectItem value="mild">{t("injuries.mild")}</SelectItem>
                <SelectItem value="moderate">{t("injuries.moderate")}</SelectItem>
                <SelectItem value="severe">{t("injuries.severe")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={18} />
            {t("common.loading")}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {t("injuries.noCasesFound")}
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              {filteredItems.map((item) => {
                const severity = normalizeSeverity(item.severity);
                const status = normalizeStatus(item.status);
                const severityStyle = severityStyles[severity];
                const statusStyle = statusStyles[status];
                const severityLabel =
                  severity === "mild"
                    ? t("injuries.mild")
                    : severity === "moderate"
                      ? t("injuries.moderate")
                      : t("injuries.severe");
                const restrictions = getSafeArray(item.exercise_restrictions);
                const alternatives = getSafeArray(item.ai_alternatives);
                const aiRequest = item.modification_request ?? null;
                const aiChangesSummary = getSafeArray(
                  aiRequest?.changes_summary
                );
                const aiRecommendations = getSafeArray(
                  aiRequest?.recommendations
                );
                const restrictionItems =
                  restrictions.length > 0 ? restrictions : aiChangesSummary;
                const alternativeItems =
                  alternatives.length > 0 ? alternatives : aiRecommendations;
                const restrictionMessage = aiRequest
                  ? t("injuries.aiRestrictionsPending")
                  : t("injuries.noRestrictions");
                const alternativeMessage = aiRequest
                  ? t("injuries.aiAlternativesPending")
                  : t("injuries.noAlternatives");
                const showAiChangesSummary =
                  aiRequest !== null &&
                  restrictions.length > 0 &&
                  aiChangesSummary.length > 0;
                const showAiRecommendations =
                  aiRequest !== null &&
                  alternatives.length > 0 &&
                  aiRecommendations.length > 0;

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border ${severityStyle.card}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl ${severityStyle.chip} flex items-center justify-center text-sm font-700 ${severityStyle.chipText} shadow-sm flex-shrink-0`}
                        >
                          {getInitials(item.user_name)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 truncate">
                            {item.user_name}
                          </p>
                          <p className="text-sm text-gray-500">{item.injury_type}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-end">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityStyle.chip} ${severityStyle.chipText}`}
                        >
                          {severityLabel} {t("injuries.severity")}
                        </span>

                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle.badge}`}
                        >
                          {status === "active"
                            ? t("common.active")
                            : t("common.recovered")}
                        </span>
                      </div>
                    </div>

                    {aiRequest ? (
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                          Linked AI Request #{aiRequest.id} -{" "}
                          {formatLabel(aiRequest.status)}
                        </span>
                      </div>
                    ) : null}

                    {showAiChangesSummary || showAiRecommendations ? (
                      <div className="bg-white/70 rounded-xl p-4 border border-blue-100 mb-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <ShieldCheck size={14} className="text-blue-600" />
                          <p className="text-xs font-700 text-blue-700 uppercase tracking-wider">
                            {t("injuries.aiRequestContext")}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {showAiChangesSummary ? (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                {t("injuries.changesSummary")}
                              </p>
                              <ul className="space-y-1.5">
                                {aiChangesSummary.map((change, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-gray-700 flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                                    {change}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {showAiRecommendations ? (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                {t("injuries.recommendations")}
                              </p>
                              <ul className="space-y-1.5">
                                {aiRecommendations.map((recommendation, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-gray-700 flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                                    {recommendation}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/70 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <XCircle size={14} className="text-red-600" />
                          <p className="text-xs font-700 text-red-700 uppercase tracking-wider">
                            {t("injuries.exerciseRestrictions")}
                          </p>
                        </div>

                        {restrictionItems.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            {restrictionMessage}
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {restrictionItems.map((restriction, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                                {restriction}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="bg-white/70 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle size={14} className="text-emerald-600" />
                          <p className="text-xs font-700 text-emerald-700 uppercase tracking-wider">
                            {t("injuries.aiAlternatives")}
                          </p>
                        </div>

                        {alternativeItems.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            {alternativeMessage}
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {alternativeItems.map((alternative, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                                {alternative}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenEdit(item.id)}
                        className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 text-xs hover:shadow-md"
                      >
                        <Pencil size={14} className="mr-1.5" />
                        {t("injuries.updateInjury")}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        disabled={
                          deleteInjuryMutation.isPending && deletingId === item.id
                        }
                        className="rounded-xl border-red-200 text-red-600 text-xs hover:bg-red-50"
                      >
                        {deleteInjuryMutation.isPending && deletingId === item.id ? (
                          <Loader2 size={14} className="mr-1.5 animate-spin" />
                        ) : (
                          <Trash2 size={14} className="mr-1.5" />
                        )}
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {t("common.showing")} <strong>{pagination.from ?? 0}</strong>{" "}
                {t("common.to")}{" "}
                <strong>{pagination.to ?? 0}</strong> of{" "}
                <strong>{pagination.total}</strong> {t("injuries.totalCases")}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={!pagination.prev_page_url || loading || isFetching}
                  className="h-9 px-3 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 rtl-flip" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(
                    (pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => {
                          if (loading || isFetching) return;
                          if (pageNumber === pagination.current_page) return;
                          setPage(pageNumber);
                        }}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          pagination.current_page === pageNumber
                            ? "bg-[#0D7D6D] text-white"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.next_page_url || loading || isFetching}
                  className="h-9 px-3 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4 rtl-flip" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("injuries.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("injuries.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("injuries.userId")}</Label>
              <Input
                value={createForm.user_id}
                onChange={(e) => {
                  setCreateForm((prev) => ({
                    ...prev,
                    user_id: e.target.value,
                  }));
                  if (createError) setCreateError("");
                }}
                placeholder={t("injuries.userId")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("injuries.injuryType")}</Label>
              <Input
                value={createForm.injury_type}
                onChange={(e) => {
                  setCreateForm((prev) => ({
                    ...prev,
                    injury_type: e.target.value,
                  }));
                  if (createError) setCreateError("");
                }}
                placeholder={t("injuries.injuryTypePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("injuries.severity")}</Label>
                <Select
                  value={createForm.severity}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      severity: value as InjurySeverity,
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">{t("injuries.mild")}</SelectItem>
                    <SelectItem value="moderate">{t("injuries.moderate")}</SelectItem>
                    <SelectItem value="severe">{t("injuries.severe")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("sessions.status")}</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: value as InjuryStatus,
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("common.active")}</SelectItem>
                    <SelectItem value="recovered">{t("common.recovered")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("injuries.notes")}</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => {
                  setCreateForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                  if (createError) setCreateError("");
                }}
                placeholder={t("injuries.notesPlaceholder")}
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>

            {createError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {createError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleCreateInjury}
                disabled={createInjuryMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0"
              >
                {createInjuryMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t("common.creating")}
                  </>
                ) : (
                  t("injuries.createInjury")
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetCreateForm();
                }}
                disabled={createInjuryMutation.isPending}
                className="flex-1 rounded-xl"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedId(null);
            setEditError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("injuries.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("injuries.editDescription")}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-10 flex items-center justify-center text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              {t("injuries.loadingDetails")}
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>{t("injuries.userId")}</Label>
                <Input
                  value={form.user_id}
                  placeholder={t("injuries.userId")}
                  readOnly
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("injuries.injuryType")}</Label>
                <Input
                  value={form.injury_type}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      injury_type: e.target.value,
                    }));
                    if (editError) setEditError("");
                  }}
                  placeholder={t("injuries.injuryTypePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("injuries.severity")}</Label>
                  <Select
                    value={form.severity}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        severity: value as InjurySeverity,
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">{t("injuries.mild")}</SelectItem>
                      <SelectItem value="moderate">{t("injuries.moderate")}</SelectItem>
                      <SelectItem value="severe">{t("injuries.severe")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("sessions.status")}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        status: value as InjuryStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("common.active")}</SelectItem>
                      <SelectItem value="recovered">{t("common.recovered")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("injuries.notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, notes: e.target.value }));
                    if (editError) setEditError("");
                  }}
                  placeholder={t("injuries.notesPlaceholder")}
                  rows={5}
                  className="rounded-xl resize-none"
                />
              </div>

              {editError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {editError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleSaveUpdate}
                  disabled={updateInjuryMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0"
                >
                  {updateInjuryMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    t("aiRequests.saveChanges")
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateInjuryMutation.isPending}
                  className="flex-1 rounded-xl"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (deleteInjuryMutation.isPending) return;
          setConfirmDeleteOpen(open);
          if (!open) {
            setPendingDeleteId(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              {t("injuries.deleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("injuries.deleteDescription")}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {deleteError}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDeleteOpen(false);
                setPendingDeleteId(null);
                setDeleteError("");
              }}
              disabled={deleteInjuryMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {t("common.cancel")}
            </Button>

            <Button
              type="button"
              onClick={confirmDeleteInjury}
              disabled={deleteInjuryMutation.isPending}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteInjuryMutation.isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                t("common.delete")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
