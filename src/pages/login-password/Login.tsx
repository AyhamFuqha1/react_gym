import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Dumbbell,
  Eye,
  EyeOff,
  Users,
  Brain,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { login, saveAuth, type UserRole } from "../../services/auth";

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const goToRoleDashboard = (role: UserRole) => {
    if (role === "admin") navigate("/dashboard/admin");
    else if (role === "manager") navigate("/dashboard/manager");
    else if (role === "coach") navigate("/dashboard/coach");
    else navigate("/dashboard/user");
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await login(formData.email, formData.password);
      saveAuth(
      data.token,
      data.role,
      data.email ?? formData.email,
      data.user_id,
      data.user_name
    );
      goToRoleDashboard(data.role);
    } catch (error: any) {
      setError(
        error?.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Users, label: "Smart member management & performance tracking" },
    { icon: Brain, label: "AI-powered health and coaching insights" },
    { icon: Shield, label: "Secure role-based access for all staff" },
    { icon: CheckCircle, label: "Personalized fitness system for every user" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0F2420] via-[#0D7D6D]/30 to-[#0F2420] relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D7D6D]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#14B8A6]/10 rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle, #7FD4C9 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#0D7D6D]/30">
            <Dumbbell className="text-white" size={38} />
          </div>

          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white mb-3 tracking-tight">
            FitMind
          </h1>

          <p className="text-[#CFFAF3] text-lg mb-12 max-w-xs mx-auto leading-relaxed">
            Smart fitness, nutrition, and gym management in one intelligent system
          </p>

          <div className="space-y-3 text-left">
            {features.map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
              >
                <div className="w-8 h-8 bg-[#0D7D6D]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#7FD4C9]" />
                </div>
                <span className="text-[#E8FFFB] text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-12 text-white/25 text-xs">
          &copy; 2026 FitMind. All rights reserved.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F9FB]">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0D7D6D] to-[#14B8A6] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#0D7D6D]/25">
              <Dumbbell className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900">
              FitMind
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
                Welcome to FitMind
              </h2>
              <p className="text-gray-500 text-sm">
                Your smart fitness journey starts here
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-600 text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 rounded-xl h-12 border-gray-200 bg-gray-50 focus:border-[#0D7D6D]"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-600 text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 rounded-xl h-12 border-gray-200 bg-gray-50 focus:border-[#0D7D6D]"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#0D7D6D] hover:text-[#0a6259] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white font-semibold hover:shadow-lg hover:shadow-[#0D7D6D]/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Need help?{" "}
            <span className="text-[#0D7D6D] cursor-pointer hover:text-[#0a6259] transition-colors">
              Contact support
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}