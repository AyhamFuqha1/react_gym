import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  Play,
  Dumbbell,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  createExercise,
  deleteExercise,
  getExerciseById,
  getExercisesByGeneralExerciseId,
  updateExercise,
  type ExerciseItem,
} from "../../services/exercises";

type FormState = {
  name: string;
  difficulty_level: string;
  video_url: string;
  instructions: string;
  common_mistakes: string;
};

const initialForm: FormState = {
  name: "",
  difficulty_level: "beginner",
  video_url: "",
  instructions: "",
  common_mistakes: "",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-600 border-emerald-200",
  easy: "bg-emerald-50 text-emerald-600 border-emerald-200",
  intermediate: "bg-blue-50 text-blue-600 border-blue-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  advanced: "bg-rose-50 text-rose-600 border-rose-200",
  hard: "bg-rose-50 text-rose-600 border-rose-200",
};

const categoryCardStyles = [
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

function getErrorMessage(error: unknown, fallback: string) {
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

function getCategoryVisual(name: string) {
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

function normalizeDifficulty(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "easy") return "beginner";
  if (normalized === "medium") return "intermediate";
  if (normalized === "hard") return "advanced";

  return normalized;
}

export function ExercisesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const numericCategoryId = Number(categoryId);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const categoryStyle = getCategoryVisual(categoryName || "category");

  async function loadExercises() {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getExercisesByGeneralExerciseId(numericCategoryId);

      setCategoryName(data.generalExercise?.name ?? "Category");
      setCategoryDescription(data.generalExercise?.description ?? "");
      setExercises(Array.isArray(data.exercises) ? data.exercises : []);
    } catch (error) {
      console.error("Failed to load exercises:", error);
      setCategoryName("Category");
      setCategoryDescription("");
      setExercises([]);
      alert(getErrorMessage(error, "Failed to load exercises."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExercises();
  }, [numericCategoryId]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const normalizedDifficulty = normalizeDifficulty(
        exercise.difficulty_level ?? ""
      );

      const matchesDifficulty =
        difficultyFilter === "all" || normalizedDifficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [exercises, searchQuery, difficultyFilter]);

  function resetForm() {
    setForm(initialForm);
    setEditingExerciseId(null);
  }

  function handleOpenCreate() {
    resetForm();
    setIsDialogOpen(true);
  }

  async function handleOpenEdit(id: number) {
    try {
      setSubmitting(true);

      const exercise = await getExerciseById(id);

      setEditingExerciseId(exercise.id);
      setForm({
        name: exercise.name ?? "",
        difficulty_level: normalizeDifficulty(
          exercise.difficulty_level ?? "beginner"
        ),
        video_url: exercise.video_url ?? "",
        instructions: exercise.instructions ?? "",
        common_mistakes: exercise.common_mistakes ?? "",
      });

      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load exercise details:", error);
      alert(getErrorMessage(error, "Failed to load exercise details."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
      alert("Invalid category id.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.instructions.trim() ||
      !form.difficulty_level.trim()
    ) {
      alert("Name, difficulty, and instructions are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      general_exercise_id: numericCategoryId,
      difficulty_level: form.difficulty_level,
      video_url: form.video_url.trim() || null,
      instructions: form.instructions.trim(),
      common_mistakes: form.common_mistakes.trim() || null,
    };

    try {
      setSubmitting(true);

      if (editingExerciseId !== null) {
        await updateExercise(editingExerciseId, payload);
      } else {
        await createExercise(payload);
      }

      setIsDialogOpen(false);
      resetForm();
      await loadExercises();
    } catch (error) {
      console.error("Failed to save exercise:", error);
      alert(getErrorMessage(error, "Failed to save exercise."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this exercise?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteExercise(id);
      await loadExercises();
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      alert(getErrorMessage(error, "Failed to delete exercise."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center text-3xl shadow-sm`}
          >
            {categoryStyle.icon}
          </div>

          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`${dashboardBase}/content`)}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 mb-2 -ml-3"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Categories
            </Button>

            <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
              {categoryName || "Exercises"}
            </h1>
            <p className="text-gray-500 text-sm">
              {loading
                ? "Loading exercises..."
                : `${filteredExercises.length} exercises in this category`}
            </p>
            {categoryDescription ? (
              <p className="text-gray-500 text-sm mt-1">{categoryDescription}</p>
            ) : null}
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl h-11 px-5"
        >
          <Plus className="mr-2" size={18} />
          Add Exercise
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl text-gray-900 font-semibold mb-2">
            No exercises found
          </h3>
          <p className="text-gray-500 mb-6">
            {exercises.length === 0
              ? "This category does not have any exercises yet."
              : "Try adjusting your search or filter."}
          </p>
          {exercises.length === 0 ? (
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0"
            >
              <Plus className="mr-2" size={18} />
              Add Exercise
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => {
            const normalizedDifficulty = normalizeDifficulty(
              exercise.difficulty_level ?? ""
            );

            const difficultyClass =
              difficultyColors[normalizedDifficulty] ??
              "bg-gray-50 text-gray-600 border-gray-200";

            const hasVideo = Boolean(exercise.video_url);

            return (
              <div
                key={exercise.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative mb-5">
                  <div
                    className={`w-full aspect-video rounded-xl bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center text-white mb-4`}
                  >
                    <Dumbbell className="w-14 h-14" />
                  </div>

                  {hasVideo ? (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 border border-gray-200 shadow-sm">
                      <Play className="w-3 h-3 text-gray-700 fill-gray-700" />
                      <span className="text-gray-700 text-xs font-medium">Video</span>
                    </div>
                  ) : null}

                  <div
                    className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg border ${difficultyClass}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {normalizedDifficulty}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-3">
                  {exercise.name}
                </h3>

                <div className="space-y-3 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                      Instructions
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {exercise.instructions || "No instructions provided."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                      Common Mistakes
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {exercise.common_mistakes || "No common mistakes provided."}
                    </p>
                  </div>

                  {exercise.video_url ? (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                        Video URL
                      </p>
                      <a
                        href={exercise.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-cyan-600 hover:text-cyan-700 break-all"
                      >
                        {exercise.video_url}
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenEdit(exercise.id)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl h-10"
                  >
                    <Pencil className="mr-2 w-4 h-4" />
                    Edit
                  </Button>

                  <Button
                    onClick={() => handleDelete(exercise.id)}
                    disabled={deletingId === exercise.id}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl h-10 px-4"
                  >
                    {deletingId === exercise.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open && !submitting) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-gray-900">
              {editingExerciseId !== null ? "Edit Exercise" : "Add New Exercise"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingExerciseId !== null
                ? "Update exercise details"
                : "Create a new exercise for this category"}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-110px)]">
            <div className="space-y-5 mt-4">
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Exercise Name
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Barbell Bench Press"
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-2 block">
                    Category
                  </Label>
                  <Input
                    value={categoryName}
                    disabled
                    className="h-11 bg-gray-100 border-gray-200 text-gray-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-2 block">
                    Difficulty
                  </Label>
                  <Select
                    value={form.difficulty_level}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, difficulty_level: value }))
                    }
                  >
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Video URL
                </Label>
                <Input
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, video_url: e.target.value }))
                  }
                  placeholder="https://example.com/video"
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Instructions
                </Label>
                <Textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder="Describe proper form and technique..."
                  rows={4}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl resize-none"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Common Mistakes
                </Label>
                <Textarea
                  value={form.common_mistakes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      common_mistakes: e.target.value,
                    }))
                  }
                  placeholder="List common mistakes to avoid..."
                  rows={3}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-1">
                <Button
                  onClick={() => {
                    if (!submitting) {
                      setIsDialogOpen(false);
                      resetForm();
                    }
                  }}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 h-11 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingExerciseId !== null ? (
                    "Update Exercise"
                  ) : (
                    "Create Exercise"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}