import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Loader2,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { getRole } from "../../services/auth";
import { type MemberItem } from "../../services/members";
import { useMembers } from "../../hooks/members/queries/useMembers";
import { useCreateMember } from "../../hooks/members/mutations/useCreateMember";
import {
  avatarColors,
  emptyStats,
  filterAndSortMembers,
  formatDate,
  getInitials,
} from "../../utils/members";
import { useTranslation } from "../../i18n";

export function MembersManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const role = getRole();
  const isCoach = role === "coach";
  const canAddMember = role === "admin" || role === "manager";

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const { data, isLoading: loading } = useMembers();
  const createMemberMutation = useCreateMember();

  const members: MemberItem[] = Array.isArray(data?.members) ? data.members : [];
  const stats = data?.stats || emptyStats;

  const filteredMembers = useMemo(() => {
    return filterAndSortMembers(members, searchTerm, statusFilter, sortBy);
  }, [members, searchTerm, statusFilter, sortBy]);

  const handleCreateMember = async () => {
    if (!canAddMember) return;

    try {
      setError("");

      await createMemberMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        role_id: 4,
      });

      setFormData({
        name: "",
        email: "",
      });

      setOpenCreateDialog(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("members.createFailed"));
    }
  };

  const openMemberDetails = (id: number) => {
    navigate(`${dashboardBase}/members/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            {isCoach ? t("members.coachTitle") : t("members.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isCoach
              ? t("members.coachSubtitle")
              : t("members.subtitle")}
          </p>
        </div>

        {canAddMember && (
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] hover:shadow-lg hover:shadow-[#0D7D6D]/25 text-white rounded-xl border-0 h-11 px-5">
                <Plus className="mr-2" size={18} />
                {t("members.addMember")}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md rounded-2xl border-gray-100">
              <DialogHeader>
                <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif]">
                  {t("members.addNewMember")}
                </DialogTitle>
                <DialogDescription>
                  {t("members.createMember")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-gray-600 text-sm">
                    {t("members.memberName")}
                  </Label>
                  <Input
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    className="rounded-xl border-gray-200 bg-gray-50"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <Button
                  onClick={handleCreateMember}
                  disabled={
                    createMemberMutation.isPending ||
                    !formData.name ||
                    !formData.email
                  }
                  className="w-full bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md hover:shadow-[#0D7D6D]/20"
                >
                  {createMemberMutation.isPending
                    ? t("members.creating")
                    : t("members.createMember")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: t("members.totalMembers"),
            value: stats.total,
            color: "text-[#0D7D6D]",
            bg: "bg-[#E6F4F1]",
          },
          {
            label: t("members.activeMembers"),
            value: stats.active,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: t("members.inactiveMembers"),
            value: stats.not_active,
            color: "text-gray-500",
            bg: "bg-gray-100",
          },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <p
              className={`text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-700 ${s.color}`}
            >
              {s.value}
            </p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder={t("members.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 bg-gray-50 focus:border-[#0D7D6D] h-11"
            />
          </div>

          <div className="relative min-w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm text-gray-700 outline-none focus:border-[#0D7D6D]"
            >
              <option value="all">{t("members.allMembers")}</option>
              <option value="active">{t("members.active")}</option>
              <option value="inactive">{t("members.inactive")}</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <div className="relative min-w-[170px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm text-gray-700 outline-none focus:border-[#0D7D6D]"
            >
              <option value="name-asc">{t("members.sortByNameAsc")}</option>
              <option value="name-desc">{t("members.sortByNameDesc")}</option>
              <option value="id-desc">{t("members.sortByNewest")}</option>
              <option value="id-asc">{t("members.sortByOldest")}</option>
            </select>
            <ArrowUpDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-700 text-gray-900">
            {t("members.allMembers")} ({filteredMembers.length})
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
                  {t("members.member")}
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("members.plan")}
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("common.status")}
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("members.endDate")}
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loading && filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                    {t("members.noMembers")}
                  </TableCell>
                </TableRow>
              ) : null}

              {filteredMembers.map((member, i) => (
                <TableRow
                  key={member.id}
                  onClick={() => openMemberDetails(member.id)}
                  className="hover:bg-gray-50/60 transition-colors border-gray-50 cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                          avatarColors[i % avatarColors.length]
                        } flex items-center justify-center text-white text-xs font-600 flex-shrink-0`}
                      >
                        {getInitials(member.user_name)}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {member.user_name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Member ID: {member.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-[#E6F4F1] text-[#0D7D6D] border-[#0D7D6D]/20">
                      {member.plan_name || "No Plan"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        member.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-gray-100 text-gray-400 border-gray-200"
                      } capitalize`}
                    >
                      {member.status || "unknown"}
                    </span>
                  </TableCell>

                  <TableCell className="text-gray-500 text-sm">
                    {formatDate(member.end_date)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMemberDetails(member.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#E6F4F1] text-[#0D7D6D] hover:bg-[#0D7D6D] hover:text-white flex items-center justify-center transition-all"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
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
