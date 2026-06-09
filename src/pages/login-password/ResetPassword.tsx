import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { Logo } from "../../components/Logo";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { resetPassword } from "../../services/auth";
import { useTranslation } from "../../i18n";

export function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const resetToken = sessionStorage.getItem("reset_token");

    if (!resetToken) {
      navigate("/forgot-password");
    }
  }, [navigate]);

  const passwordChecks = useMemo(() => {
    const password = formData.password;

    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [formData.password]);

  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasNumber;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError(t("resetPassword.passwordInvalid"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const resetToken = sessionStorage.getItem("reset_token");

      if (!resetToken) {
        navigate("/forgot-password");
        return;
      }

      await resetPassword(
        resetToken,
        formData.password,
        formData.confirmPassword
      );

      sessionStorage.removeItem("reset_token");
      sessionStorage.removeItem("reset_email");
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      setError(
        error?.response?.data?.message || t("resetPassword.resetFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl p-8 text-center">
            <div className="bg-accent/10 size-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="size-10 text-accent" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
              {t("resetPassword.successTitle")}
            </h1>

            <p className="text-muted-foreground mb-6">
              {t("resetPassword.successSubtitle")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const showPasswordValidation = formData.password.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo className="mb-8" />
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {t("resetPassword.title")}
          </h1>

          <p className="text-muted-foreground mb-8">
            {t("resetPassword.subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-[50px] size-5 text-muted-foreground" />
              <Input
                label={t("resetPassword.newPasswordLabel")}
                type={showPassword ? "text" : "password"}
                placeholder={t("resetPassword.newPasswordPlaceholder")}
                className="pl-12 pr-12"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (error) setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[50px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-[50px] size-5 text-muted-foreground" />
              <Input
                label={t("resetPassword.confirmPasswordLabel")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                className="pl-12 pr-12"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  });
                  if (error) setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[50px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground font-medium mb-2">
                {t("resetPassword.requirementsTitle")}
              </p>

              <ul className="text-xs space-y-1 list-disc list-inside">
                <li
                  className={
                    showPasswordValidation
                      ? passwordChecks.minLength
                        ? "text-green-600"
                        : "text-red-500"
                      : "text-muted-foreground"
                  }
                >
                  {t("resetPassword.requirementMinLength")}
                </li>
                <li
                  className={
                    showPasswordValidation
                      ? passwordChecks.hasUppercase
                        ? "text-green-600"
                        : "text-red-500"
                      : "text-muted-foreground"
                  }
                >
                  {t("resetPassword.requirementUppercase")}
                </li>
                <li
                  className={
                    showPasswordValidation
                      ? passwordChecks.hasLowercase
                        ? "text-green-600"
                        : "text-red-500"
                      : "text-muted-foreground"
                  }
                >
                  {t("resetPassword.requirementLowercase")}
                </li>
                <li
                  className={
                    showPasswordValidation
                      ? passwordChecks.hasNumber
                        ? "text-green-600"
                        : "text-red-500"
                      : "text-muted-foreground"
                  }
                >
                  {t("resetPassword.requirementNumber")}
                </li>
              </ul>
            </div>

            <Button type="submit" isLoading={isLoading}>
              {t("resetPassword.submit")}
            </Button>

            <div className="pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                {t("resetPassword.rememberPassword")}{" "}
                <Link
                  to="/"
                  className="text-primary hover:text-accent transition-colors font-medium"
                >
                  {t("resetPassword.backToLogin")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
