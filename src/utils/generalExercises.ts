import axios from "axios";

export type FormState = {
  name: string;
  description: string;
  categoryType: string;
};

export const initialForm: FormState = {
  name: "",
  description: "",
  categoryType: "",
};

export const FIXED_MUSCLE_GROUP = "General";

export const cardStyles = [
  {
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-100",
    bgSoft: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-100",
    bgSoft: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-100",
    bgSoft: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-100",
    bgSoft: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    gradient: "from-rose-500 to-red-500",
    borderColor: "border-rose-100",
    bgSoft: "bg-rose-50",
    textColor: "text-rose-600",
  },
  {
    gradient: "from-indigo-500 to-purple-500",
    borderColor: "border-indigo-100",
    bgSoft: "bg-indigo-50",
    textColor: "text-indigo-600",
  },
];

export const categoryOptions = [
  { value: "chest", label: "Chest", icon: "💪" },
  { value: "back", label: "Back", icon: "🏋️" },
  { value: "shoulders", label: "Shoulders", icon: "🔷" },
  { value: "arms", label: "Arms", icon: "💪" },
  { value: "legs", label: "Legs", icon: "🦵" },
  { value: "core", label: "Core", icon: "🔥" },
  { value: "full_body", label: "Full Body", icon: "⚡" },
  { value: "glutes", label: "Glutes", icon: "🍑" },
  { value: "cardio", label: "Cardio", icon: "❤️" },
  { value: "mobility", label: "Mobility", icon: "🌀" },
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

export function getCategoryIcon(name: string) {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("chest") || normalized.includes("pec")) {
    return "💪";
  }

  if (
    normalized.includes("back") ||
    normalized.includes("upper back") ||
    normalized.includes("lower back") ||
    normalized.includes("lat") ||
    normalized.includes("lats") ||
    normalized.includes("row")
  ) {
    return "🏋️";
  }

  if (
    normalized.includes("leg") ||
    normalized.includes("legs") ||
    normalized.includes("lower body") ||
    normalized.includes("quad") ||
    normalized.includes("quads") ||
    normalized.includes("hamstring") ||
    normalized.includes("calf") ||
    normalized.includes("calves")
  ) {
    return "🦵";
  }

  if (
    normalized.includes("shoulder") ||
    normalized.includes("shoulders") ||
    normalized.includes("delt") ||
    normalized.includes("deltoid")
  ) {
    return "🔷";
  }

  if (
    normalized.includes("arm") ||
    normalized.includes("arms") ||
    normalized.includes("bicep") ||
    normalized.includes("biceps") ||
    normalized.includes("tricep") ||
    normalized.includes("triceps") ||
    normalized.includes("forearm") ||
    normalized.includes("forearms")
  ) {
    return "💪";
  }

  if (
    normalized.includes("core") ||
    normalized.includes("abs") ||
    normalized.includes("ab") ||
    normalized.includes("abdominal")
  ) {
    return "🔥";
  }

  if (normalized.includes("full body")) {
    return "⚡";
  }

  if (normalized.includes("glute")) {
    return "🍑";
  }

  if (normalized.includes("cardio")) {
    return "❤️";
  }

  if (normalized.includes("mobility")) {
    return "🌀";
  }

  return "🏋️";
}

export function getCategoryTypeFromName(name: string) {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("chest") || normalized.includes("pec")) return "chest";
  if (
    normalized.includes("back") ||
    normalized.includes("lat") ||
    normalized.includes("row")
  ) {
    return "back";
  }
  if (normalized.includes("shoulder") || normalized.includes("delt")) {
    return "shoulders";
  }
  if (
    normalized.includes("arm") ||
    normalized.includes("bicep") ||
    normalized.includes("tricep") ||
    normalized.includes("forearm")
  ) {
    return "arms";
  }
  if (
    normalized.includes("leg") ||
    normalized.includes("quad") ||
    normalized.includes("hamstring") ||
    normalized.includes("calf")
  ) {
    return "legs";
  }
  if (
    normalized.includes("core") ||
    normalized.includes("abs") ||
    normalized.includes("abdominal")
  ) {
    return "core";
  }
  if (normalized.includes("full body")) return "full_body";
  if (normalized.includes("glute")) return "glutes";
  if (normalized.includes("cardio")) return "cardio";
  if (normalized.includes("mobility")) return "mobility";

  return "";
}

export function getDefaultDescription(type: string) {
  switch (type) {
    case "chest":
      return "Chest exercises category";
    case "back":
      return "Back exercises category";
    case "shoulders":
      return "Shoulders exercises category";
    case "arms":
      return "Arms exercises category";
    case "legs":
      return "Legs exercises category";
    case "core":
      return "Core exercises category";
    case "full_body":
      return "Full body exercises category";
    case "glutes":
      return "Glutes exercises category";
    case "cardio":
      return "Cardio exercises category";
    case "mobility":
      return "Mobility exercises category";
    default:
      return "";
  }
}