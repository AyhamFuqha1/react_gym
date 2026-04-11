import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Plus,
  Ban,
  PlayCircle,
  User,
  CreditCard,
  Utensils,
  Ruler,
  Weight,
  Target,
  Mail,
  Pencil,
  Trash2,
  BadgePlus,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  freezeMemberSubscription,
  getMemberNutrition,
  getMemberOverview,
  getMembers,
  getPlanOptions,
  renewMemberSubscription,
  resumeMemberSubscription,
  getSubscriptionRemainingDays,
  getDisplaySubscriptionStatus,
  getLocalDateString,
  type MemberItem,
  type MemberNutritionResponse,
  type MemberOverviewResponse,
  type PlanOption,
} from "../../services/members";
import { createPlan, updatePlan, deletePlan } from "../../services/plans";
import { getRole } from "../../services/auth";
import {
  capitalizeWords,
  createInitialPlanForm,
  formatDate,
  getInitials,
  type PlanFormState,
  type TabKey,
} from "../../utils/memberDetails";

export function MemberDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberId } = useParams();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const currentUserRole = getRole();
  const canManagePlans = currentUserRole === "admin";

  const memberIdNumber = Number(memberId);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [planActionLoading, setPlanActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState<MemberOverviewResponse | null>(null);
  const [nutrition, setNutrition] = useState<MemberNutritionResponse | null>(null);
  const [memberRow, setMemberRow] = useState<MemberItem | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [subscriptionStatusOverride, setSubscriptionStatusOverride] = useState<string | null>(null);

  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const [selectedManagePlanId, setSelectedManagePlanId] = useState<number | null>(null);

  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [isDeletePlanDialogOpen, setIsDeletePlanDialogOpen] = useState(false);

  const [createPlanForm, setCreatePlanForm] = useState<PlanFormState>(
    createInitialPlanForm(memberIdNumber || 1)
  );
  const [editPlanForm, setEditPlanForm] = useState<PlanFormState>(
    createInitialPlanForm(memberIdNumber || 1)
  );

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [overviewData, nutritionData, membersData, plansData] = await Promise.all([
        getMemberOverview(memberIdNumber),
        getMemberNutrition(memberIdNumber),
        getMembers(),
        getPlanOptions(),
      ]);

      setOverview(overviewData);
      setNutrition(nutritionData);

      const foundMember =
        membersData.members?.find((member) => member.id === memberIdNumber) || null;

      setMemberRow(foundMember);

      const activePlans = (plansData || []).filter(
        (plan) => Number(plan.is_active) === 1 || plan.is_active === true
      );

      setPlans(activePlans);

      if (
        selectedManagePlanId &&
        !activePlans.some((plan) => plan.id === selectedManagePlanId)
      ) {
        setSelectedManagePlanId(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load member details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!memberIdNumber) return;
    loadPageData();
  }, [memberIdNumber]);

  useEffect(() => {
    setCreatePlanForm(createInitialPlanForm(memberIdNumber || 1));
    setEditPlanForm(createInitialPlanForm(memberIdNumber || 1));
  }, [memberIdNumber]);

  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) || null,
    [plans, selectedPlan]
  );

  const selectedManagePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedManagePlanId) || null,
    [plans, selectedManagePlanId]
  );

  const currentPlanName = memberRow?.plan_name || "No Plan";
  const rawStatus = (
    subscriptionStatusOverride ??
    memberRow?.status ??
    "unknown"
  ).toLowerCase();

  const currentEndDate = memberRow?.end_date || null;

  const remainingDays = useMemo(() => {
    return getSubscriptionRemainingDays(currentEndDate);
  }, [currentEndDate]);

  const displayStatus = useMemo(() => {
    return getDisplaySubscriptionStatus(rawStatus, currentEndDate);
  }, [rawStatus, currentEndDate]);

  const hasActiveSubscription = displayStatus === "active" && remainingDays > 0;
  const canRenew = !hasActiveSubscription && !actionLoading;
  const canFreeze = displayStatus === "active" && remainingDays > 0 && !actionLoading;
  const canResume = displayStatus === "frozen" && !actionLoading;

  const progressValue = useMemo(() => {
    if (!overview?.weight || !overview?.target_weight) return 0;

    const currentWeight = Number(overview.weight);
    const targetWeight = Number(overview.target_weight);

    if (Number.isNaN(currentWeight) || Number.isNaN(targetWeight)) return 0;
    if (currentWeight === targetWeight) return 100;

    const difference = Math.abs(currentWeight - targetWeight);
    const baseline = Math.max(currentWeight, targetWeight);

    if (baseline === 0) return 0;

    const progress = 100 - (difference / baseline) * 100;
    return Math.max(0, Math.min(100, progress));
  }, [overview]);

  const openRenewDialog = () => {
    if (hasActiveSubscription) {
      setError("This member already has an active subscription and cannot be renewed yet.");
      return;
    }

    setError("");
    setIsRenewDialogOpen(true);
  };

  const handleRenew = async () => {
    if (!selectedPlan) return;

    if (hasActiveSubscription) {
      setError("This member already has an active subscription and cannot be renewed yet.");
      setIsRenewDialogOpen(false);
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const today = getLocalDateString();

      await renewMemberSubscription({
        user_id: memberIdNumber,
        plan_id: selectedPlan,
        discount: 0,
        start_date: today,
      });

      setSubscriptionStatusOverride("active");
      setIsRenewDialogOpen(false);
      setSelectedPlan(null);

      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to renew subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreeze = async () => {
    try {
      setActionLoading(true);
      setError("");

      await freezeMemberSubscription(memberIdNumber);
      setSubscriptionStatusOverride("frozen");

      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to freeze subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      setError("");

      await resumeMemberSubscription(memberIdNumber);
      setSubscriptionStatusOverride("active");

      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resume subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const openCreatePlanDialog = () => {
    if (!canManagePlans) return;
    setCreatePlanForm(createInitialPlanForm(memberIdNumber || 1));
    setIsCreatePlanDialogOpen(true);
  };

  const openEditPlanDialog = () => {
    if (!canManagePlans || !selectedManagePlan) return;

    setEditPlanForm({
      user_id: Number(selectedManagePlan.user_id ?? memberIdNumber ?? 1),
      name: selectedManagePlan.name ?? "",
      duration_days: String(selectedManagePlan.duration_days ?? ""),
      price: String(selectedManagePlan.price ?? ""),
      is_active:
        Number(selectedManagePlan.is_active) === 1 ||
        selectedManagePlan.is_active === true,
    });

    setIsEditPlanDialogOpen(true);
  };

  const handleCreatePlan = async () => {
    if (!canManagePlans) return;

    try {
      setPlanActionLoading(true);
      setError("");

      await createPlan({
        user_id: Number(createPlanForm.user_id),
        name: createPlanForm.name,
        duration_days: Number(createPlanForm.duration_days),
        price: Number(createPlanForm.price),
        is_active: createPlanForm.is_active,
      });

      setIsCreatePlanDialogOpen(false);
      setCreatePlanForm(createInitialPlanForm(memberIdNumber || 1));
      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create plan");
    } finally {
      setPlanActionLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!canManagePlans || !selectedManagePlanId) return;

    try {
      setPlanActionLoading(true);
      setError("");

      await updatePlan(selectedManagePlanId, {
        user_id: Number(editPlanForm.user_id),
        name: editPlanForm.name,
        duration_days: Number(editPlanForm.duration_days),
        price: Number(editPlanForm.price),
        is_active: editPlanForm.is_active,
      });

      setIsEditPlanDialogOpen(false);
      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update plan");
    } finally {
      setPlanActionLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!canManagePlans || !selectedManagePlanId) return;

    try {
      setPlanActionLoading(true);
      setError("");

      await deletePlan(selectedManagePlanId);

      setIsDeletePlanDialogOpen(false);
      setSelectedManagePlanId(null);
      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete plan");
    } finally {
      setPlanActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading member details...
      </div>
    );
  }

  const displayName =
    overview?.name || nutrition?.user?.name || memberRow?.user_name || "Member";
  const displayEmail = overview?.email || nutrition?.user?.email || "No email";
  const displayInitials = getInitials(displayName);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`${dashboardBase}/members`)}
        className="text-gray-600 hover:text-gray-900 -ml-2"
      >
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to Members
      </Button>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-2xl font-bold">
              {displayInitials}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  {displayName}
                </h2>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    displayStatus === "active"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : displayStatus === "frozen"
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : displayStatus === "expired"
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : "bg-gray-50 text-gray-600 border border-gray-100"
                  }`}
                >
                  {capitalizeWords(displayStatus)}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {currentPlanName}
                </span>
              </div>

              <p className="text-gray-500 text-sm mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {displayEmail}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                <span>Member ID: {memberIdNumber}</span>
                <span>End Date: {formatDate(currentEndDate)}</span>
              </div>
            </div>
          </div>

          <div className="text-right min-w-[180px]">
            <p className="text-sm text-gray-500 mb-1">Progress to Target</p>
            <p className="text-3xl font-bold text-[#0D7D6D]">
              {Math.round(progressValue)}%
            </p>
            <p className="text-xs text-gray-400">
              Goal: {capitalizeWords(overview?.goal_type)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Overview", icon: User },
          { key: "subscription", label: "Subscription", icon: CreditCard },
          { key: "nutrition", label: "Nutrition", icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex-1 min-w-[160px] h-12 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-transparent"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#0D7D6D]/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-5">
              Member Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: displayName },
                { label: "Email", value: displayEmail },
                { label: "Gender", value: capitalizeWords(overview?.gender) },
                { label: "Age", value: overview?.age ?? "N/A" },
                { label: "Height", value: overview?.height ? `${overview.height} cm` : "N/A" },
                { label: "Weight", value: overview?.weight ? `${overview.weight} kg` : "N/A" },
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="font-semibold text-gray-900">{String(item.value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-rose-500" />
                <p className="font-semibold text-gray-900">Fitness Goal</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-semibold">
                  {capitalizeWords(overview?.goal_type)}
                </span>
                <span className="text-sm text-gray-500">
                  Target Weight: {overview?.target_weight ?? "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-gray-500">Height</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {overview?.height ? `${overview.height} cm` : "N/A"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Weight className="w-4 h-4 text-emerald-500" />
                <p className="text-sm text-gray-500">Weight</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {overview?.weight ? `${overview.weight} kg` : "N/A"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Progress to Target</p>
              <p className="text-4xl font-bold text-[#0D7D6D] mb-3">
                {Math.round(progressValue)}%
              </p>
              <Progress value={progressValue} className="h-3" />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "subscription" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <p className="text-sm text-white/80 mb-2">Current Plan</p>
                  <h3 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700">
                    {currentPlanName}
                  </h3>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                  <p className="text-2xl font-bold">{capitalizeWords(displayStatus)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm mb-1">Start Date</p>
                  <p className="font-semibold">From renew action</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm mb-1">End Date</p>
                  <p className="font-semibold">{formatDate(currentEndDate)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm mb-1">Days Left</p>
                  <p className="font-semibold">{remainingDays}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/80">Remaining Days</span>
                  <span className="text-lg font-bold">{remainingDays} days</span>
                </div>
                <Progress
                  value={Math.min((remainingDays / 180) * 100, 100)}
                  className="h-3 bg-white/20"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                  Available Plans
                </h3>

                {canManagePlans ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={openCreatePlanDialog}
                      className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
                    >
                      <BadgePlus className="mr-2 w-4 h-4" />
                      Create Plan
                    </Button>

                    <Button
                      variant="outline"
                      onClick={openEditPlanDialog}
                      disabled={!selectedManagePlan}
                    >
                      <Pencil className="mr-2 w-4 h-4" />
                      Update Plan
                    </Button>

                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setIsDeletePlanDialogOpen(true)}
                      disabled={!selectedManagePlan}
                    >
                      <Trash2 className="mr-2 w-4 h-4" />
                      Delete Plan
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.length === 0 ? (
                  <div className="text-sm text-gray-400">No plans available</div>
                ) : (
                  plans.map((plan) => {
                    const isSelected = selectedManagePlanId === plan.id;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          if (canManagePlans) {
                            setSelectedManagePlanId(plan.id);
                          }
                        }}
                        className={`rounded-2xl border p-5 transition-all ${
                          canManagePlans ? "cursor-pointer" : "cursor-default"
                        } ${
                          isSelected
                            ? "border-[#0D7D6D] bg-[#E6F4F1] shadow-md"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm text-gray-500">Plan</p>
                          <span
                            className={`text-[11px] px-2 py-1 rounded-full border font-semibold ${
                              Number(plan.is_active) === 1 || plan.is_active === true
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            {Number(plan.is_active) === 1 || plan.is_active === true
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <h4 className="text-xl font-bold text-gray-900 mb-2 break-words">
                          {plan.name}
                        </h4>
                        <p className="text-2xl font-bold text-[#0D7D6D] mb-1">
                          {plan.price}
                        </p>
                        <p className="text-xs text-gray-400">
                          {plan.duration_days} days
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <Button
                  onClick={openRenewDialog}
                  className="w-full bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
                  disabled={!canRenew}
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Renew Subscription
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleFreeze}
                  disabled={!canFreeze}
                >
                  <Ban className="mr-2 w-4 h-4" />
                  Freeze Subscription
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  onClick={handleResume}
                  disabled={!canResume}
                >
                  <PlayCircle className="mr-2 w-4 h-4" />
                  Resume Subscription
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {hasActiveSubscription ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    This member already has an active subscription. Renewal is disabled until the current subscription ends.
                  </p>
                ) : null}

                {displayStatus === "frozen" ? (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    This subscription is currently frozen. You can resume it.
                  </p>
                ) : null}

                {displayStatus === "expired" ? (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    This subscription has expired. Renewal is available.
                  </p>
                ) : null}

                {displayStatus !== "active" &&
                displayStatus !== "frozen" &&
                displayStatus !== "expired" ? (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    This member does not currently have an active subscription.
                  </p>
                ) : null}
              </div>
            </div>

            {canManagePlans ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-4">
                  Selected Plan
                </h3>

                {selectedManagePlan ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400 mb-1">Name</p>
                      <p className="font-semibold text-gray-900 break-words">
                        {selectedManagePlan.name}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400 mb-1">Price</p>
                      <p className="font-semibold text-gray-900">{selectedManagePlan.price}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400 mb-1">Duration</p>
                      <p className="font-semibold text-gray-900">
                        {selectedManagePlan.duration_days} days
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Select a plan first to update or delete it.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "nutrition" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm text-white/80 mb-2">Nutrition Goal</p>
              <h3 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-700 mb-4">
                {capitalizeWords(overview?.goal_type)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm mb-1">Liked Foods</p>
                  <p className="text-3xl font-bold">
                    {nutrition?.user?.liked_foods?.length || 0}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm mb-1">Disliked Foods</p>
                  <p className="text-3xl font-bold">
                    {nutrition?.user?.disliked_foods?.length || 0}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-sm mb-1">Available Foods</p>
                  <p className="text-3xl font-bold">
                    {nutrition?.available_foods?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-5">
                Available Foods
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nutrition?.available_foods?.length ? (
                  nutrition.available_foods.map((food) => (
                    <div
                      key={food.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{food.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Serving Size: {food.serving_size || "N/A"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#0D7D6D]">
                          {food.calories} cal
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                        <div className="bg-white rounded-xl p-3">
                          <p className="text-gray-400 text-xs">Protein</p>
                          <p className="font-semibold text-gray-900">{food.protein}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3">
                          <p className="text-gray-400 text-xs">Carbs</p>
                          <p className="font-semibold text-gray-900">{food.carbs}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3">
                          <p className="text-gray-400 text-xs">Fat</p>
                          <p className="font-semibold text-gray-900">{food.fat}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-400">No foods available</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-4">
                Goal
              </h3>
              <span className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-semibold inline-block">
                {capitalizeWords(overview?.goal_type)}
              </span>
              <p className="text-sm text-gray-500 mt-4">
                Target Weight: {overview?.target_weight ?? "N/A"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900 mb-4">
                Active Nutrition Plans
              </h3>
              {nutrition?.user?.user_nutrition_plan_active?.length ? (
                <div className="space-y-3">
                  {nutrition.user.user_nutrition_plan_active.map((plan: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700 break-words"
                    >
                      {JSON.stringify(plan)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No active nutrition plans</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl rounded-2xl max-h-[85vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl">
                Renew Subscription
              </DialogTitle>
              <DialogDescription>
                {hasActiveSubscription
                  ? "This member already has an active subscription, so renewal is currently disabled."
                  : "Choose a plan and renew this member subscription using the backend API"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.length === 0 ? (
                  <div className="text-sm text-gray-400">No plans available</div>
                ) : (
                  plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => {
                        if (!hasActiveSubscription) {
                          setSelectedPlan(plan.id);
                        }
                      }}
                      className={`rounded-2xl p-5 border-2 transition-all min-w-0 ${
                        hasActiveSubscription
                          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                          : selectedPlan === plan.id
                          ? "cursor-pointer border-[#0D7D6D] bg-[#E6F4F1] shadow-md"
                          : "cursor-pointer border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <p className="text-sm text-gray-500 mb-2">Plan</p>
                      <h4 className="text-xl font-bold text-gray-900 mb-3 break-words">
                        {plan.name}
                      </h4>
                      <p className="text-3xl font-bold text-[#0D7D6D] mb-2 break-words">
                        {plan.price}
                      </p>
                      <p className="text-xs text-gray-400">{plan.duration_days} days</p>
                    </div>
                  ))
                )}
              </div>

              {selectedPlanData && !hasActiveSubscription ? (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Preview</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-600">Current End Date</span>
                      <span className="font-semibold text-gray-900 text-right break-words">
                        {formatDate(currentEndDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-600">Added Duration</span>
                      <span className="font-semibold text-blue-600 text-right">
                        +{selectedPlanData.duration_days} days
                      </span>
                    </div>

                    <div className="pt-3 border-t border-blue-200 flex items-center justify-between gap-4">
                      <span className="font-semibold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-[#0D7D6D] text-right break-words">
                        {selectedPlanData.price}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {hasActiveSubscription ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Renewal is blocked because this member still has {remainingDays} day(s) left in the current active subscription.
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRenewDialogOpen(false);
                    setSelectedPlan(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleRenew}
                  disabled={!selectedPlan || actionLoading || hasActiveSubscription}
                  className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
                >
                  {actionLoading ? "Processing..." : "Confirm Renewal"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {canManagePlans ? (
        <>
          <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
            <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl">
                  Create Plan
                </DialogTitle>
                <DialogDescription>
                  Create a new subscription plan using the plans API
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>User ID</Label>
                    <Input
                      type="number"
                      value={createPlanForm.user_id}
                      onChange={(e) =>
                        setCreatePlanForm((prev) => ({
                          ...prev,
                          user_id: Number(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Plan Name</Label>
                    <Input
                      value={createPlanForm.name}
                      onChange={(e) =>
                        setCreatePlanForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Duration Days</Label>
                    <Input
                      type="number"
                      value={createPlanForm.duration_days}
                      onChange={(e) =>
                        setCreatePlanForm((prev) => ({
                          ...prev,
                          duration_days: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={createPlanForm.price}
                      onChange={(e) =>
                        setCreatePlanForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={createPlanForm.is_active}
                    onChange={(e) =>
                      setCreatePlanForm((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                  Active Plan
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatePlanDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleCreatePlan}
                    disabled={planActionLoading}
                    className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
                  >
                    {planActionLoading ? "Processing..." : "Create Plan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
            <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl">
                  Update Plan
                </DialogTitle>
                <DialogDescription>
                  Edit the selected plan using the plans API
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>User ID</Label>
                    <Input
                      type="number"
                      value={editPlanForm.user_id}
                      onChange={(e) =>
                        setEditPlanForm((prev) => ({
                          ...prev,
                          user_id: Number(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Plan Name</Label>
                    <Input
                      value={editPlanForm.name}
                      onChange={(e) =>
                        setEditPlanForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Duration Days</Label>
                    <Input
                      type="number"
                      value={editPlanForm.duration_days}
                      onChange={(e) =>
                        setEditPlanForm((prev) => ({
                          ...prev,
                          duration_days: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPlanForm.price}
                      onChange={(e) =>
                        setEditPlanForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={editPlanForm.is_active}
                    onChange={(e) =>
                      setEditPlanForm((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                  Active Plan
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditPlanDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleUpdatePlan}
                    disabled={planActionLoading}
                    className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
                  >
                    {planActionLoading ? "Processing..." : "Update Plan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeletePlanDialogOpen} onOpenChange={setIsDeletePlanDialogOpen}>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl">
                  Delete Plan
                </DialogTitle>
                <DialogDescription>
                  This action will delete the selected plan permanently.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">{selectedManagePlan?.name || "this plan"}</span>?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeletePlanDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleDeletePlan}
                    disabled={planActionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {planActionLoading ? "Deleting..." : "Delete Plan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}