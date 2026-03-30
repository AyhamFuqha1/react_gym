import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Loader2, ChevronDown, ArrowUpDown } from "lucide-react";
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
import {
  createMember,
  getMembers,
  type MemberItem,
  type MembersStats,
} from "../../services/members";

const avatarColors = [
  "from-[#0D7D6D] to-[#14B8A6]",
  "from-purple-500 to-purple-400",
  "from-blue-500 to-blue-400",
  "from-rose-500 to-rose-400",
  "from-amber-500 to-amber-400",
];

const emptyStats: MembersStats = {
  total: 0,
  active: 0,
  not_active: 0,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(date: string | null) {
  if (!date) return "No end date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString();
}

export function MembersManagement() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [stats, setStats] = useState<MembersStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reloadFlag, setReloadFlag] = useState(0);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMembers();
        setMembers(Array.isArray(data.members) ? data.members : []);
        setStats(data.stats || emptyStats);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [reloadFlag]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return members
      .filter((member) => {
        const matchesSearch = member.user_name.toLowerCase().includes(normalizedSearch);

        const normalizedStatus = (member.status || "").toLowerCase();

        const matchesFilter =
          statusFilter === "all"
            ? true
            : statusFilter === "active"
            ? normalizedStatus === "active"
            : normalizedStatus !== "active";

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name-desc":
            return b.user_name.localeCompare(a.user_name);
          case "id-desc":
            return b.id - a.id;
          case "id-asc":
            return a.id - b.id;
          case "name-asc":
          default:
            return a.user_name.localeCompare(b.user_name);
        }
      });
  }, [members, searchTerm, statusFilter, sortBy]);

  const handleCreateMember = async () => {
    try {
      setSubmitting(true);
      setError("");

      await createMember({
        name: formData.name,
        email: formData.email,
        role_id: 4,
      });

      setFormData({
        name: "",
        email: "",
      });

      setOpenCreateDialog(false);
      setReloadFlag((prev) => prev + 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create member");
    } finally {
      setSubmitting(false);
    }
  };

  const openMemberDetails = (id: number) => {
    navigate(`/dashboard/admin/members/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            Members Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all gym members and their progress
          </p>
        </div>

        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] hover:shadow-lg hover:shadow-[#0D7D6D]/25 text-white rounded-xl border-0 h-11 px-5">
              <Plus className="mr-2" size={18} />
              Add Member
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-2xl border-gray-100">
            <DialogHeader>
              <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif]">
                Add New Member
              </DialogTitle>
              <DialogDescription>
                Create a new member account using the current backend API
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-gray-600 text-sm">Full Name</Label>
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
                <Label className="text-gray-600 text-sm">Email</Label>
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
                disabled={submitting || !formData.name || !formData.email}
                className="w-full bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md hover:shadow-[#0D7D6D]/20"
              >
                {submitting ? "Creating..." : "Create Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search members by name or email..."
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
              <option value="all">All Members</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
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
              <option value="name-asc">Sort: A-Z</option>
              <option value="name-desc">Sort: Z-A</option>
              <option value="id-desc">Sort: Newest ID</option>
              <option value="id-asc">Sort: Oldest ID</option>
            </select>
            <ArrowUpDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Members",
            value: stats.total,
            color: "text-[#0D7D6D]",
            bg: "bg-[#E6F4F1]",
          },
          {
            label: "Active Members",
            value: stats.active,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Inactive",
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-700 text-gray-900">
            All Members ({filteredMembers.length})
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Loading...
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60">
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  Member
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  Plan
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  End Date
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loading && filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                    No members found
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