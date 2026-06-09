import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Shield,
  MessageSquare,
  Newspaper,
  LogOut,
  Dumbbell,
  ChevronRight,
  Apple,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useTranslation } from "../i18n";
import { clearAuth, getEmail, getRole, logout } from "../services/auth";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, direction, isRtl } = useTranslation();

  const role = getRole();
  const email = getEmail();

  const displayRole =
    role === "admin"
      ? t("role.admin")
      : role === "manager"
      ? t("role.manager")
      : role === "coach"
      ? t("role.coach")
      : t("role.user");

  const displayInitial = displayRole.charAt(0).toUpperCase();

  const navItems = [
    { path: "/dashboard/admin", icon: LayoutDashboard, label: t("nav.dashboard") },
    { path: "/dashboard/admin/members", icon: Users, label: t("nav.members") },
    { path: "/dashboard/admin/coaches", icon: Dumbbell, label: t("nav.coaches") },
    {
      path: "/dashboard/admin/subscriptions",
      icon: CreditCard,
      label: t("nav.subscriptions"),
    },
    {
      path: "/dashboard/admin/coach-sessions",
      icon: CalendarDays,
      label: t("nav.coachSessions"),
    },
    { path: "/dashboard/admin/content", icon: BookOpen, label: t("nav.content") },
    {
      path: "/dashboard/admin/nutrition",
      icon: Apple,
      label: t("nav.nutritionLibrary"),
    },
    {
      path: "/dashboard/admin/injury-prevention",
      icon: Shield,
      label: t("nav.injuryPrevention"),
    },
    {
      path: "/dashboard/admin/feedback",
      icon: MessageSquare,
      label: t("nav.feedback"),
    },
    { path: "/dashboard/admin/news", icon: Newspaper, label: t("nav.news") },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard/admin") {
      return location.pathname === "/dashboard/admin";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuth();
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FB]" dir={direction}>
      <aside className="w-64 bg-[#0F2420] flex flex-col shadow-2xl flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] p-2 rounded-xl shadow-lg shadow-[#0D7D6D]/30">
              <Dumbbell className="text-white" size={18} />
            </div>
            <div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-700 text-white text-base tracking-tight">
                FitMind
              </h1>
              <p className="text-[#7FD4C9]/60 text-xs">{t("layout.adminPortal")}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] flex items-center justify-center text-white text-sm font-600">
              {displayInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {displayRole}
              </p>
              <p className="text-[#7FD4C9]/50 text-xs truncate ltr-content">
                {email || t("common.noEmail")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[#7FD4C9]/30 text-xs font-medium uppercase tracking-wider px-3 mb-3">
            {t("layout.management")}
          </p>

          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    active
                      ? `${
                          isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"
                        } from-[#0D7D6D]/30 to-[#14B8A6]/10 border border-[#0D7D6D]/30`
                      : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      active
                        ? "bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] shadow-md shadow-[#0D7D6D]/30"
                        : "bg-white/5 group-hover:bg-white/10"
                    }`}
                  >
                    <item.icon
                      size={16}
                      className={
                        active
                          ? "text-white"
                          : "text-[#7FD4C9]/60 group-hover:text-[#7FD4C9]"
                      }
                    />
                  </div>

                  <span
                    className={`text-sm font-medium transition-colors ${
                      active
                        ? "text-white"
                        : "text-[#7FD4C9]/70 group-hover:text-[#7FD4C9]"
                    }`}
                  >
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={14}
                      className="ml-auto text-[#7FD4C9]/50 rtl-flip"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center flex-shrink-0 transition-all">
              <LogOut size={16} className="text-red-400" />
            </div>
            <span className="text-sm font-medium">{t("common.logout")}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium ltr-content">
              {location.pathname.split("/").filter(Boolean).join(" / ") ||
                t("common.dashboard")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="w-2 h-2 rounded-full bg-[#0D7D6D] animate-pulse" />
            <span className="text-sm text-gray-500">{t("layout.systemActive")}</span>
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
