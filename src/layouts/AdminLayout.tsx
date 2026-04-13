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
} from "lucide-react";
import { clearAuth, getEmail, getRole, logout } from "../services/auth";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = getRole();
  const email = getEmail();

  const displayRole =
    role === "admin"
      ? "Admin"
      : role === "manager"
      ? "Manager"
      : role === "coach"
      ? "Coach"
      : "User";

  const displayInitial = displayRole.charAt(0).toUpperCase();

  const navItems = [
    { path: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/dashboard/admin/members", icon: Users, label: "Members" },
    {
      path: "/dashboard/admin/subscriptions",
      icon: CreditCard,
      label: "Subscriptions",
    },
    {
      label: "Pending Plans",
      path: "/dashboard/admin/pending-training-plans",
      icon: Dumbbell,
    },
    { path: "/dashboard/admin/content", icon: BookOpen, label: "Content" },
    {
      path: "/dashboard/admin/nutrition",
      icon: Apple,
      label: "Nutrition Library",
    },
    {
      path: "/dashboard/admin/injury-prevention",
      icon: Shield,
      label: "Injury Prevention",
    },
    {
      path: "/dashboard/admin/feedback",
      icon: MessageSquare,
      label: "Feedback",
    },
    { path: "/dashboard/admin/news", icon: Newspaper, label: "News" },
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
    <div className="flex min-h-screen bg-[#F7F9FB]">
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
              <p className="text-[#7FD4C9]/60 text-xs">Admin Portal</p>
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
              <p className="text-[#7FD4C9]/50 text-xs truncate">
                {email || "No email"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[#7FD4C9]/30 text-xs font-medium uppercase tracking-wider px-3 mb-3">
            Management
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
                      ? "bg-gradient-to-r from-[#0D7D6D]/30 to-[#14B8A6]/10 border border-[#0D7D6D]/30"
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
                      className="ml-auto text-[#7FD4C9]/50"
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
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              {location.pathname.split("/").filter(Boolean).join(" / ") ||
                "dashboard"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#0D7D6D] animate-pulse" />
            <span className="text-sm text-gray-500">System Active</span>
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}