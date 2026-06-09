import { Languages } from "lucide-react";
import { useTranslation, type Language } from "../i18n";

const languages: Array<{ value: Language; labelKey: "common.language.english" | "common.language.arabic" }> = [
  { value: "en", labelKey: "common.language.english" },
  { value: "ar", labelKey: "common.language.arabic" },
];

export function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { language, setLanguage, t } = useTranslation();
  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border p-1 ${
        isDark
          ? "border-white/10 bg-white/5 text-[#7FD4C9]"
          : "border-gray-200 bg-white text-gray-600 shadow-sm"
      }`}
      aria-label={t("layout.language")}
    >
      <Languages
        size={16}
        className={isDark ? "ml-2 text-[#7FD4C9]/70" : "ml-2 text-gray-400"}
      />

      {languages.map((item) => {
        const active = language === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setLanguage(item.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              active
                ? isDark
                  ? "bg-[#0D7D6D] text-white"
                  : "bg-[#0D7D6D] text-white shadow-sm"
                : isDark
                  ? "text-[#7FD4C9]/70 hover:bg-white/5 hover:text-[#7FD4C9]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {t(item.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
