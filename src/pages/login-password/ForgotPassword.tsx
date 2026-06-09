import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Logo } from "../../components/Logo";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { forgotPassword, verifyOtp } from "../../services/auth";
import { useTranslation } from "../../i18n";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await forgotPassword(email);
      setStep("otp");
    } catch (error: any) {
      setError(
        error?.response?.data?.message || t("forgotPassword.sendOtpFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await verifyOtp(email, otp);
      sessionStorage.setItem("reset_token", data.reset_token);
      sessionStorage.setItem("reset_email", email);
      navigate("/reset-password");
    } catch (error: any) {
      setError(
        error?.response?.data?.message || t("forgotPassword.verifyOtpFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo className="mb-8" />
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4 rtl-flip" />
            {t("forgotPassword.backToLogin")}
          </Link>

          {step === "email" ? (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {t("forgotPassword.title")}
              </h1>

              <p className="text-muted-foreground mb-8">
                {t("forgotPassword.subtitle")}
              </p>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-[50px] size-5 text-muted-foreground" />
                  <Input
                    label={t("login.emailLabel")}
                    type="email"
                    placeholder={t("forgotPassword.emailPlaceholder")}
                    className="pl-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" isLoading={isLoading}>
                  {t("forgotPassword.sendOtp")}
                </Button>

                <div className="pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("forgotPassword.rememberPassword")}{" "}
                    <Link
                      to="/"
                      className="text-primary hover:text-accent transition-colors font-medium"
                    >
                      {t("forgotPassword.signIn")}
                    </Link>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="bg-accent/10 size-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="size-10 text-accent" />
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4 text-center">
                {t("forgotPassword.otpSent")}
              </h1>

              <p className="text-muted-foreground mb-2 text-center">
                {t("forgotPassword.sentCodeTo")}
              </p>
              <p className="text-sm font-medium text-foreground mb-8 text-center">
                {email}
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="relative">
                  <KeyRound className="absolute left-4 top-[50px] size-5 text-muted-foreground" />
                  <Input
                    label={t("forgotPassword.otpLabel")}
                    type="text"
                    placeholder={t("forgotPassword.otpPlaceholder")}
                    className="pl-12"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" isLoading={isLoading}>
                  {t("forgotPassword.verifyOtp")}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("forgotPassword.changeEmail")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
