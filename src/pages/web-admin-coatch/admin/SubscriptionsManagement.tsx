import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { mapSubscriptionToRow, type SubscriptionRow } from "../../../utils/subscriptions";
import { useSubscriptionsForAdmin } from "../../../hooks/subscriptions/queries/useSubscriptionsForAdmin";

const statusConfig: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    icon: typeof CheckCircle;
    label: string;
  }
> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle,
    label: "Active",
  },
  expired: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
    label: "Expired",
  },
  frozen: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: Clock,
    label: "Frozen",
  },
};

function getCreatorRoleLabel(item: SubscriptionRow): string | null {
  const roleName = item.raw.creator?.role?.name?.toLowerCase();

  if (roleName === "admin") return "Admin";
  if (roleName === "coach") return "Coach";
  return null;
}

export function SubscriptionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creatorRoleFilter, setCreatorRoleFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const {
    data,
    isLoading: loading,
    error,
  } = useSubscriptionsForAdmin();

  const subscriptions = useMemo(() => {
    return Array.isArray(data) ? data.map(mapSubscriptionToRow) : [];
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, creatorRoleFilter]);

  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active"
  ).length;
  const expiredSubscriptions = subscriptions.filter(
    (s) => s.status === "expired"
  ).length;

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const creatorRole = getCreatorRoleLabel(sub)?.toLowerCase() ?? "";

      const matchesSearch =
        sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(sub.id).includes(searchQuery) ||
        (sub.createdBy ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || sub.status.toLowerCase() === statusFilter;

      const matchesCreatorRole =
        creatorRoleFilter === "all" ||
        creatorRole === creatorRoleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCreatorRole;
    });
  }, [subscriptions, searchQuery, statusFilter, creatorRoleFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubscriptions.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleViewDetails = (subscription: SubscriptionRow) => {
    setSelectedSubscription(subscription);
  };

  const handleCloseDrawer = () => {
    setSelectedSubscription(null);
  };

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load subscriptions";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 -m-8 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading subscriptions...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 -m-8 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-red-600">
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <div className="mb-2">
            <div>
              <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-2">
                Subscriptions
              </h1>
              <p className="text-gray-500 text-lg">
                Review subscription records, assigned plans, and subscription status for members.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Subscriptions</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalSubscriptions}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold text-gray-900">
              {activeSubscriptions}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Expired Subscriptions</p>
            <p className="text-3xl font-bold text-gray-900">
              {expiredSubscriptions}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by member, plan, creator, or subscription ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            <Select value={creatorRoleFilter} onValueChange={setCreatorRoleFilter}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                <SelectValue placeholder="Filter by creator role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Creator Role
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedSubscriptions.map((subscription) => {
                  const status =
                    statusConfig[subscription.status] ?? statusConfig.active;
                  const StatusIcon = status.icon;
                  const creatorRole = getCreatorRoleLabel(subscription);

                  return (
                    <tr
                      key={subscription.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
                            {subscription.userAvatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {subscription.userName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {subscription.createdBy ?? (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {creatorRole ?? <span className="text-gray-400">—</span>}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                          {subscription.planName}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {subscription.durationDays} days
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {subscription.discount}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {subscription.startDate}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-700">
                        {subscription.endDate}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(subscription)}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedSubscriptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-10 px-6 text-center text-gray-500"
                    >
                      No subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <strong>{filteredSubscriptions.length ? startIndex + 1 : 0}</strong>{" "}
                to{" "}
                <strong>
                  {Math.min(startIndex + itemsPerPage, filteredSubscriptions.length)}
                </strong>{" "}
                of <strong>{filteredSubscriptions.length}</strong> subscriptions
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#0D7D6D] text-white"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedSubscription && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleCloseDrawer}
          />

          <div className="relative w-[460px] bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {selectedSubscription.userAvatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-1">
                      {selectedSubscription.userName}
                    </h2>
                    <p className="text-gray-500">
                      Subscription #{selectedSubscription.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {(() => {
                const status =
                  statusConfig[selectedSubscription.status] ??
                  statusConfig.active;
                const StatusIcon = status.icon;

                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border ${status.bg} ${status.text} ${status.border}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </span>
                );
              })()}
            </div>

            <div className="px-8 py-6 space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">User</span>
                <span className="font-semibold text-gray-900">
                  {selectedSubscription.userName}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Created By</span>
                <span className="text-gray-900">
                  {selectedSubscription.createdBy ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Creator Role</span>
                <span className="text-gray-900">
                  {getCreatorRoleLabel(selectedSubscription) ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">
                  {selectedSubscription.planName}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Duration</span>
                <span className="text-gray-900">
                  {selectedSubscription.durationDays} days
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Discount</span>
                <span className="text-gray-900">{selectedSubscription.discount}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Start Date</span>
                <span className="text-gray-900">{selectedSubscription.startDate}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">End Date</span>
                <span className="text-gray-900">{selectedSubscription.endDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}