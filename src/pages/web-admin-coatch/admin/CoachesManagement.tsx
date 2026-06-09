import { useMemo, useState } from "react";
import { Loader2, Mail, Plus, RefreshCw, UserRound } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getRole } from "../../../services/auth";
import type { CoachItem } from "../../../services/coaches";
import { useCreateCoach } from "../../../hooks/coaches/mutations/useCreateCoach";
import { useCoaches } from "../../../hooks/coaches/queries/useCoaches";
import { useTranslation } from "../../../i18n";

const emptyForm = {
  name: "",
  email: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (typeof data !== "object" || data === null) {
    return fallback;
  }

  const record = data as {
    message?: unknown;
    errors?: Record<string, string[] | string>;
  };

  if (record.errors) {
    const firstError = Object.values(record.errors)[0];

    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return typeof record.message === "string" ? record.message : fallback;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sortCoaches(coaches: CoachItem[]) {
  return [...coaches].sort((a, b) => a.name.localeCompare(b.name));
}

export function CoachesManagement() {
  const { t } = useTranslation();
  const role = getRole();
  const canCreateCoach = role === "admin" || role === "manager";

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useCoaches();
  const createCoachMutation = useCreateCoach();

  const coaches = useMemo(
    () => sortCoaches(Array.isArray(data?.coaches) ? data.coaches : []),
    [data?.coaches]
  );

  const loading = isLoading || isFetching;

  async function handleCreateCoach() {
    if (!canCreateCoach || createCoachMutation.isPending) return;

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name || !email) {
      setFormError(t("coaches.nameEmailRequired"));
      return;
    }

    if (!isValidEmail(email)) {
      setFormError(t("coaches.validEmailRequired"));
      return;
    }

    try {
      setFormError("");

      await createCoachMutation.mutateAsync({
        name,
        email,
      });

      setFormData(emptyForm);
      setOpenCreateDialog(false);
    } catch (err) {
      setFormError(getErrorMessage(err, t("coaches.createFailed")));
    }
  }

  function handleDialogChange(open: boolean) {
    setOpenCreateDialog(open);

    if (!open) {
      setFormError("");
      setFormData(emptyForm);
    }
  }

  const loadErrorMessage =
    error instanceof Error ? error.message : t("coaches.unableToLoad");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            {t("coaches.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("coaches.subtitle")}
          </p>
        </div>

        {canCreateCoach ? (
          <Dialog open={openCreateDialog} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] hover:shadow-lg hover:shadow-[#0D7D6D]/25 text-white rounded-xl border-0 h-11 px-5">
                <Plus className="mr-2" size={18} />
                {t("coaches.addCoach")}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md rounded-2xl border-gray-100">
              <DialogHeader>
                <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif]">
                  {t("coaches.addNewCoach")}
                </DialogTitle>
                <DialogDescription>
                  {t("coaches.createDescription")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {formError ? (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    {formError}
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label className="text-gray-600 text-sm">{t("coaches.fullName")}</Label>
                  <Input
                    placeholder={t("coaches.coachNamePlaceholder")}
                    className="rounded-xl border-gray-200 bg-gray-50"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-600 text-sm">{t("common.email")}</Label>
                  <Input
                    type="email"
                    placeholder="coach@example.com"
                    className="rounded-xl border-gray-200 bg-gray-50"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <Button
                  onClick={handleCreateCoach}
                  disabled={
                    createCoachMutation.isPending ||
                    !formData.name.trim() ||
                    !formData.email.trim()
                  }
                  className="w-full bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md hover:shadow-[#0D7D6D]/20"
                >
                  {createCoachMutation.isPending
                    ? t("common.creating")
                    : t("coaches.createCoach")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#E6F4F1] rounded-2xl p-5 text-center">
          <p className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-[#0D7D6D]">
            {coaches.length}
          </p>
          <p className="text-gray-500 text-sm mt-1">{t("coaches.totalCoaches")}</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-5 text-center">
          <p className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-emerald-600">
            {
              coaches.filter(
                (coach) => (coach.status || "").toLowerCase() === "active"
              ).length
            }
          </p>
          <p className="text-gray-500 text-sm mt-1">{t("coaches.activeCoaches")}</p>
        </div>

        <div className="bg-gray-100 rounded-2xl p-5 text-center">
          <p className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-500">
            {
              coaches.filter(
                (coach) => (coach.status || "").toLowerCase() !== "active"
              ).length
            }
          </p>
          <p className="text-gray-500 text-sm mt-1">{t("coaches.inactiveOther")}</p>
        </div>
      </div>

      {isError ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>{loadErrorMessage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-100"
          >
            <RefreshCw size={14} className="mr-2" />
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-700 text-gray-900">
            {t("coaches.allCoaches")} ({coaches.length})
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              {t("common.loading")}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60">
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("coaches.coach")}
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("common.email")}
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("common.status")}
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("coaches.created")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loading && !isError && coaches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <UserRound size={28} />
                      <span>{t("coaches.noCoaches")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {coaches.map((coach) => (
                <TableRow
                  key={coach.id}
                  className="hover:bg-gray-50/60 transition-colors border-gray-50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-xs font-600 flex-shrink-0">
                        {getInitials(coach.name) || "C"}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {coach.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {t("coaches.coachId")}: {coach.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Mail size={14} className="text-gray-400" />
                      {coach.email}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                        (coach.status || "").toLowerCase() === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-gray-100 text-gray-400 border-gray-200"
                      }`}
                    >
                      {coach.status || "unknown"}
                    </span>
                  </TableCell>

                  <TableCell className="text-gray-500 text-sm">
                    {formatDate(coach.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
