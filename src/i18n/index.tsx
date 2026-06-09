import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en";
import ar from "./ar";

export type Language = "en" | "ar";
export type TranslationKey = keyof typeof en;

const STORAGE_KEY = "fitmind_language";

const dictionaries: Record<Language, typeof en> = {
  en,
  ar,
};

type TranslationContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  direction: "ltr" | "rtl";
  isRtl: boolean;
  t: (key: TranslationKey) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return storedLanguage === "ar" ? "ar" : "en";
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const direction = language === "ar" ? "rtl" : "ltr";
  const isRtl = direction === "rtl";

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.dataset.language = language;
  }, [direction, language]);

  const value = useMemo<TranslationContextValue>(() => {
    const dictionary = dictionaries[language] ?? dictionaries.en;

    return {
      language,
      setLanguage: setLanguageState,
      direction,
      isRtl,
      t: (key) => dictionary[key] ?? dictionaries.en[key] ?? key,
    };
  }, [direction, isRtl, language]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }

  return context;
}
