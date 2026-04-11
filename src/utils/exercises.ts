import axios from "axios";

export type FormState = {
  name: string;
  difficulty_level: string;
  video_url: string;
  instructions: string;
  common_mistakes: string;
};

export const initialForm: FormState = {
  name: "",
  difficulty_level: "beginner",
  video_url: "",
  instructions: "",
  common_mistakes: "",
};

export const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-600 border-emerald-200",
  easy: "bg-emerald-50 text-emerald-600 border-emerald-200",
  intermediate: "bg-blue-50 text-blue-600 border-blue-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  advanced: "bg-rose-50 text-rose-600 border-rose-200",
  hard: "bg-rose-50 text-rose-600 border-rose-200",
};

export const categoryCardStyles = [
  {
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-100",
    bgSoft: "bg-blue-50",
    icon: "💪",
  },
  {
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-100",
    bgSoft: "bg-purple-50",
    icon: "🏋️",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-100",
    bgSoft: "bg-amber-50",
    icon: "🦵",
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-100",
    bgSoft: "bg-emerald-50",
    icon: "💪",
  },
  {
    gradient: "from-rose-500 to-red-500",
    borderColor: "border-rose-100",
    bgSoft: "bg-rose-50",
    icon: "💪",
  },
  {
    gradient: "from-indigo-500 to-purple-500",
    borderColor: "border-indigo-100",
    bgSoft: "bg-indigo-50",
    icon: "🔥",
  },
];

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const maybeMessage =
        (data as { message?: string }).message ||
        (data as { error?: string }).error;

      if (maybeMessage) return maybeMessage;

      const validationErrors = (data as { errors?: Record<string, string[]> })
        .errors;

      if (validationErrors) {
        const firstKey = Object.keys(validationErrors)[0];
        const firstMessage = validationErrors[firstKey]?.[0];
        if (firstMessage) return firstMessage;
      }
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getCategoryVisual(name: string) {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("chest") || normalized.includes("pec")) {
    return categoryCardStyles[0];
  }

  if (
    normalized.includes("back") ||
    normalized.includes("lat") ||
    normalized.includes("row")
  ) {
    return categoryCardStyles[1];
  }

  if (
    normalized.includes("leg") ||
    normalized.includes("quad") ||
    normalized.includes("hamstring") ||
    normalized.includes("glute") ||
    normalized.includes("calf")
  ) {
    return categoryCardStyles[2];
  }

  if (normalized.includes("shoulder") || normalized.includes("delt")) {
    return categoryCardStyles[3];
  }

  if (
    normalized.includes("arm") ||
    normalized.includes("bicep") ||
    normalized.includes("tricep") ||
    normalized.includes("forearm")
  ) {
    return categoryCardStyles[4];
  }

  if (
    normalized.includes("core") ||
    normalized.includes("abs") ||
    normalized.includes("abdominal")
  ) {
    return categoryCardStyles[5];
  }

  return categoryCardStyles[0];
}

export function normalizeDifficulty(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "easy") return "beginner";
  if (normalized === "medium") return "intermediate";
  if (normalized === "hard") return "advanced";

  return normalized;
}