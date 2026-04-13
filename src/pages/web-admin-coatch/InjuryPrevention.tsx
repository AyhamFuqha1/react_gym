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
import type { InjuryDashboardItem } from "../../services/injuries";
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

type StatusFilter = "all" | "active" | "inactive";
type SeverityFilter = "all" | "low" | "medium" | "high";

const severityStyles: Record<
  string,
  {
    card: string;
    chip: string;
    chipText: string;
  }
> = {
  high: {
    card: "bg-red-50 border-red-200",
    chip: "bg-red-100",
    chipText: "text-red-700",
  },
  medium: {
    card: "bg-orange-50 border-orange-200",
    chip: "bg-orange-100",
    chipText: "text-orange-700",
  },
  low: {
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
  inactive: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Inactive",
  },
};

export function InjuryPrevention() {
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
    severity: "low" as "low" | "medium" | "high",
    status: "active" as "active" | "inactive",
    notes: "",
  });

  const [createForm, setCreateForm] = useState({
    user_id: "",
    injury_type: "",
    severity: "low" as "low" | "medium" | "high",
    status: "active" as "active" | "inactive",
    notes: "",
  });

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
      severity: "low",
      status: "active",
      notes: "",
    });
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

    const inactiveCases = items.filter(
      (item) => normalizeStatus(item.status) === "inactive"
    ).length;

    const highSeverityCases = items.filter(
      (item) => normalizeSeverity(item.severity) === "high"
    ).length;

    return {
      totalCases: pagination.total,
      activeCases,
      inactiveCases,
      highSeverityCases,
    };
  }, [items, pagination.total]);

  const attentionCount = useMemo(() => {
    return items.filter((item) => normalizeStatus(item.status) === "active")
      .length;
  }, [items]);

  async function handleCreateInjury() {
    if (!createForm.user_id.trim() || !createForm.injury_type.trim()) {
      alert("User ID and injury type are required.");
      return;
    }

    try {
      await createInjuryMutation.mutateAsync({
        user_id: Number(createForm.user_id),
        injury_type: createForm.injury_type.trim(),
        severity: createForm.severity,
        status: createForm.status,
        notes: createForm.notes.trim(),
      });

      setIsCreateOpen(false);
      resetCreateForm();
      setPage(1);
    } catch (error) {
      console.error("Failed to create injury:", error);
      alert("Failed to create injury.");
    }
  }

  function handleOpenEdit(id: number) {
    setSelectedId(id);
    setIsEditOpen(true);
  }

  async function handleSaveUpdate() {
    if (!selectedId) return;

    if (!form.user_id.trim() || !form.injury_type.trim()) {
      alert("User ID and injury type are required.");
      return;
    }

    try {
      await updateInjuryMutation.mutateAsync({
        id: selectedId,
        payload: {
          user_id: Number(form.user_id),
          injury_type: form.injury_type.trim(),
          severity: form.severity,
          status: form.status,
          notes: form.notes.trim(),
        },
      });

      setIsEditOpen(false);
      setSelectedId(null);
    } catch (error) {
      console.error("Failed to update injury:", error);
      alert("Failed to update injury.");
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this injury record?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteInjuryMutation.mutateAsync(id);

      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to delete injury:", error);
      alert("Failed to delete injury.");
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
            Injury & Risk Prevention
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor member health conditions from the injury dashboard.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0"
        >
          <Plus size={16} className="mr-2" />
          Add Injury
        </Button>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl flex-shrink-0">
            <AlertTriangle className="text-orange-500" size={20} />
          </div>

          <div>
            <p className="font-semibold text-gray-800 mb-1">Attention Required</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {attentionCount} active case{attentionCount === 1 ? "" : "s"} on
              this page currently need safe exercise monitoring.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Total Cases",
            value: String(stats.totalCases),
            icon: UserRound,
            iconBg: "bg-[#E6F4F1]",
            iconColor: "text-[#0D7D6D]",
          },
          {
            label: "Active Cases",
            value: String(stats.activeCases),
            icon: ShieldAlert,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
          },
          {
            label: "Inactive Cases",
            value: String(stats.inactiveCases),
            icon: ShieldCheck,
            iconBg: "bg-gray-100",
            iconColor: "text-gray-600",
          },
          {
            label: "High Severity",
            value: String(stats.highSeverityCases),
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
              Member Health Conditions
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {pagination.total > 0 &&
              pagination.from !== null &&
              pagination.to !== null
                ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total}`
                : "No injury cases available"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-40 rounded-xl border-gray-200 bg-white">
                <Filter size={14} className="mr-1.5 text-gray-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No injury cases found.
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              {filteredItems.map((item) => {
                const severity = normalizeSeverity(item.severity);
                const status = normalizeStatus(item.status);
                const severityStyle = severityStyles[severity];
                const statusStyle = statusStyles[status];
                const restrictions = getSafeArray(item.exercise_restrictions);
                const alternatives = getSafeArray(item.ai_alternatives);

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
                          {severity.charAt(0).toUpperCase() + severity.slice(1)} Severity
                        </span>

                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle.badge}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/70 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <XCircle size={14} className="text-red-600" />
                          <p className="text-xs font-700 text-red-700 uppercase tracking-wider">
                            Exercise Restrictions
                          </p>
                        </div>

                        {restrictions.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No restrictions listed.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {restrictions.map((restriction, index) => (
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
                            AI Alternatives
                          </p>
                        </div>

                        {alternatives.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No alternatives available.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {alternatives.map((alternative, index) => (
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
                        Update Injury
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
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <strong>{pagination.from ?? 0}</strong> to{" "}
                <strong>{pagination.to ?? 0}</strong> of{" "}
                <strong>{pagination.total}</strong> injury cases
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={!pagination.prev_page_url || loading || isFetching}
                  className="h-9 px-3 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
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
                  <ChevronRight className="w-4 h-4" />
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
            <DialogTitle>Create Injury Record</DialogTitle>
            <DialogDescription>
              Add a new member injury record using the injury API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>User ID</Label>
              <Input
                value={createForm.user_id}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    user_id: e.target.value,
                  }))
                }
                placeholder="User ID"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Injury Type</Label>
              <Input
                value={createForm.injury_type}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    injury_type: e.target.value,
                  }))
                }
                placeholder="Knee pain"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select
                  value={createForm.severity}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      severity: value as "low" | "medium" | "high",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: value as "active" | "inactive",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Avoid deep squats"
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>

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
                    Creating...
                  </>
                ) : (
                  "Create Injury"
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
                Cancel
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
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Injury Record</DialogTitle>
            <DialogDescription>
              Update injury type, severity, status, and notes using the injury API.
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-10 flex items-center justify-center text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Loading details...
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>User ID</Label>
                <Input
                  value={form.user_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, user_id: e.target.value }))
                  }
                  placeholder="User ID"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Injury Type</Label>
                <Input
                  value={form.injury_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      injury_type: e.target.value,
                    }))
                  }
                  placeholder="Knee pain"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Severity</Label>
                  <Select
                    value={form.severity}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        severity: value as "low" | "medium" | "high",
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        status: value as "active" | "inactive",
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Avoid deep squats"
                  rows={5}
                  className="rounded-xl resize-none"
                />
              </div>

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
                    "Save Changes"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateInjuryMutation.isPending}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}