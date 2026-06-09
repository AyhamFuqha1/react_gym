import { useMemo, useState } from "react";
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
  difficultyColors,
  getCategoryVisual,
  getErrorMessage,
  initialForm,
  normalizeDifficulty,
  type FormState,
} from "../../utils/exercises";
import { useExercisesByGeneralExerciseId } from "../../hooks/exercises/queries/useExercisesByGeneralExerciseId";
import { useExerciseById } from "../../hooks/exercises/queries/useExerciseById";
import { useCreateExercise } from "../../hooks/exercises/mutations/useCreateExercise";
import { useUpdateExercise } from "../../hooks/exercises/mutations/useUpdateExercise";
import { useDeleteExercise } from "../../hooks/exercises/mutations/useDeleteExercise";
import { useTranslation } from "../../i18n";

export function ExercisesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const numericCategoryId = Number(categoryId);

  const { data, isLoading: loading } =
    useExercisesByGeneralExerciseId(numericCategoryId);

  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(
    null
  );
  const [form, setForm] = useState<FormState>(initialForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const editExerciseQuery = useExerciseById(
    editingExerciseId ?? 0,
    editingExerciseId !== null
  );

  const categoryName = data?.generalExercise?.name ?? "";
  const categoryDescription = data?.generalExercise?.description ?? "";
  const exercises = Array.isArray(data?.exercises) ? data.exercises : [];

  const categoryStyle = getCategoryVisual(categoryName || "category");

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
    setFormError("");
  }

  function handleOpenCreate() {
    resetForm();
    setFormError("");
    setIsDialogOpen(true);
  }

  async function handleOpenEdit(id: number) {
    try {
      setFormError("");
      setEditingExerciseId(id);
    } catch (error) {
      console.error("Failed to load exercise details:", error);
      setFormError(getErrorMessage(error, "Failed to load exercise details."));
      setIsDialogOpen(true);
    }
  }

  async function handleSubmit() {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
      setFormError("Invalid category id.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.instructions.trim() ||
      !form.difficulty_level.trim()
    ) {
      setFormError("Name, difficulty, and instructions are required.");
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
      setFormError("");

      if (editingExerciseId !== null) {
        await updateMutation.mutateAsync({
          id: editingExerciseId,
          payload,
          generalExerciseId: numericCategoryId,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save exercise:", error);
      setFormError(getErrorMessage(error, "Failed to save exercise."));
    }
  }

  function handleDelete(id: number) {
    setPendingDeleteId(id);
    setDeleteError("");
    setConfirmDeleteOpen(true);
  }

  async function confirmDeleteExercise() {
    if (pendingDeleteId === null) return;

    try {
      setDeleteError("");
      setDeletingId(pendingDeleteId);
      await deleteMutation.mutateAsync({
        id: pendingDeleteId,
        generalExerciseId: numericCategoryId,
      });

      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      setDeleteError(getErrorMessage(error, "Failed to delete exercise."));
    } finally {
      setDeletingId(null);
    }
  }

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    editExerciseQuery.isLoading;

  const pageLoading =
    loading &&
    !Array.isArray(
      (data as { exercises?: unknown[] } | undefined)?.exercises
    );

  const dialogOpen = isDialogOpen || editingExerciseId !== null;

  if (editExerciseQuery.data && editingExerciseId !== null && !isDialogOpen) {
    const exercise = editExerciseQuery.data;

    setForm({
      name: exercise.name ?? "",
      difficulty_level: normalizeDifficulty(
        exercise.difficulty_level ?? "beginner"
      ),
      video_url: exercise.video_url ?? "",
      instructions: exercise.instructions ?? "",
      common_mistakes: exercise.common_mistakes ?? "",
    });
    setFormError("");
    setIsDialogOpen(true);
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
              <ArrowLeft className="mr-2 w-4 h-4 rtl-flip" />
              {t("dashboard.exerciseCategories")}
            </Button>

            <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
              {categoryName || t("exercises.title")}
            </h1>
            <p className="text-gray-500 text-sm">
              {pageLoading
                ? t("common.loading")
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
          {t("exercises.addExercise")}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={t("exercises.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                <SelectValue placeholder={t("exercises.allDifficulties")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("exercises.difficulty")}</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {pageLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl text-gray-900 font-semibold mb-2">
            {t("exercises.noExercises")}
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
              {t("exercises.addExercise")}
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
                      <span className="text-gray-700 text-xs font-medium">
                        Video
                      </span>
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
                      {t("exercises.instructions")}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {exercise.instructions || t("exercises.noInstructions")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                      {t("exercises.commonMistakes")}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {exercise.common_mistakes ||
                        t("exercises.noCommonMistakes")}
                    </p>
                  </div>

                  {exercise.video_url ? (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                        {t("exercises.videoUrl")}
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
                    {t("common.edit")}
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
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setIsDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-gray-900">
              {editingExerciseId !== null
                ? t("common.edit")
                : t("exercises.addExercise")}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingExerciseId !== null
                ? t("exercises.updateDescription")
                : t("exercises.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-110px)]">
            <div className="space-y-5 mt-4">
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  {t("exercises.exerciseName")}
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    if (formError) setFormError("");
                  }}
                  placeholder="e.g. Barbell Bench Press"
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-2 block">
                    {t("exercises.category")}
                  </Label>
                  <Input
                    value={categoryName}
                    disabled
                    className="h-11 bg-gray-100 border-gray-200 text-gray-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 text-sm font-medium mb-2 block">
                    {t("exercises.difficulty")}
                  </Label>
                  <Select
                    value={form.difficulty_level}
                    onValueChange={(value) => {
                      setForm((prev) => ({ ...prev, difficulty_level: value }));
                      if (formError) setFormError("");
                    }}
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
                  {t("exercises.videoUrl")}
                </Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, video_url: e.target.value }));
                    if (formError) setFormError("");
                  }}
                  placeholder="https://example.com/video"
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  {t("exercises.instructions")}
                </Label>
                <Textarea
                  value={form.instructions}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }));
                    if (formError) setFormError("");
                  }}
                  placeholder="Describe proper form and technique..."
                  rows={4}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl resize-none"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  {t("exercises.commonMistakes")}
                </Label>
                <Textarea
                  value={form.common_mistakes}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      common_mistakes: e.target.value,
                    }));
                    if (formError) setFormError("");
                  }}
                  placeholder="List common mistakes to avoid..."
                  rows={3}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl resize-none"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-1">
                <Button
                  onClick={() => {
                    if (!isSubmitting) {
                      setIsDialogOpen(false);
                      resetForm();
                    }
                  }}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                >
                  {t("common.cancel")}
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : editingExerciseId !== null ? (
                    t("common.update")
                  ) : (
                    t("exercises.addExercise")
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          setConfirmDeleteOpen(open);
          if (!open) {
            setPendingDeleteId(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {t("common.delete")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {t("exercises.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {deleteError}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDeleteOpen(false);
                setPendingDeleteId(null);
                setDeleteError("");
              }}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {t("common.cancel")}
            </Button>

            <Button
              type="button"
              onClick={confirmDeleteExercise}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.delete")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
