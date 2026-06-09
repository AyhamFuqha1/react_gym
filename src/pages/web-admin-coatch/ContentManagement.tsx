import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  Dumbbell,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { GeneralExerciseItem } from "../../services/generalExercises";
import {
  categoryOptions,
  cardStyles,
  FIXED_MUSCLE_GROUP,
  getCategoryIcon,
  getCategoryTypeFromName,
  getErrorMessage,
  initialForm,
  type FormState,
} from "../../utils/generalExercises";
import { useGeneralExercises } from "../../hooks/generalExercises/queries/useGeneralExercises";
import { useCreateGeneralExercise } from "../../hooks/generalExercises/mutations/useCreateGeneralExercise";
import { useUpdateGeneralExercise } from "../../hooks/generalExercises/mutations/useUpdateGeneralExercise";
import { useDeleteGeneralExercise } from "../../hooks/generalExercises/mutations/useDeleteGeneralExercise";
import { useTranslation } from "../../i18n";

export function ContentManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const {
    data,
    isLoading: loading,
    error,
  } = useGeneralExercises();

  const createMutation = useCreateGeneralExercise();
  const updateMutation = useUpdateGeneralExercise();
  const deleteMutation = useDeleteGeneralExercise();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<GeneralExerciseItem | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<GeneralExerciseItem | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const categories = data?.categories ?? [];
  const categoriesCount = data?.categories_count ?? 0;
  const exercisesCount = data?.exercises_count ?? 0;

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.muscle_group.toLowerCase().includes(query)
      );
    });
  }, [categories, searchQuery]);

  function resetForm() {
    setForm(initialForm);
    setEditingCategory(null);
    setFormError("");
  }

  function handleOpenCreate() {
    resetForm();
    setFormError("");
    setIsDialogOpen(true);
  }

  function handleOpenEdit(category: GeneralExerciseItem) {
    setEditingCategory(category);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      categoryType: getCategoryTypeFromName(category.name ?? ""),
    });
    setFormError("");
    setIsDialogOpen(true);
  }
  function handleOpenDelete(category: GeneralExerciseItem) {
    setDeletingCategory(category);
    setDeleteError("");
    setIsDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.description.trim()) {
      setFormError(t("content.nameDescriptionRequired"));
      return;
    }

    const payload = {
      name: form.name.trim(),
      muscle_group: FIXED_MUSCLE_GROUP,
      description: form.description.trim(),
    };

    setFormError("");
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
        setFormError(
        getErrorMessage(
          error,
          editingCategory
            ? t("content.updateCategoryFailed")
            : t("content.createCategoryFailed")
        )
      );
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;
    setDeleteError("");
    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Failed to delete category."));
    }
  }

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load categories.";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
            {t("content.title")}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("content.subtitle")}
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl h-11 px-5"
        >
          <Plus className="mr-2" size={18} />
          {t("content.addCategory")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">
            {t("dashboard.exerciseCategories")}
          </p>
          <p className="text-3xl font-bold text-gray-900">{categoriesCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">{t("content.exercises")}</p>
          <p className="text-3xl font-bold text-gray-900">{exercisesCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={t("content.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">
          {errorMessage}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl text-gray-900 font-semibold mb-2">
            {t("content.noCategories")}
          </h3>
          <p className="text-gray-500 mb-6">
            {categories.length === 0
              ? t("content.noExerciseCategories")
              : "Try adjusting your search."}
          </p>
          {categories.length === 0 ? (
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0"
            >
              <Plus className="mr-2" size={18} />
              {t("content.addCategory")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => {
            const style = cardStyles[index % cardStyles.length];

            return (
              <div
                key={category.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${style.borderColor}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-2xl text-white shadow-sm`}
                  >
                    {getCategoryIcon(category.name)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        navigate(`${dashboardBase}/exercises/${category.id}`, {
                          state: { category },
                        })
                      }
                      variant="outline"
                      className="h-10 rounded-xl"
                    >
                      <Eye className="mr-2 w-4 h-4" />
                      {t("content.exercises")}
                    </Button>
                  </div>
                </div>

                <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {category.description || t("common.noDescription")}
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600 mb-5">
                  <Dumbbell className="w-4 h-4" />
                  {category.muscle_group}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenEdit(category)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl h-10"
                  >
                    <Edit3 className="mr-2 w-4 h-4" />
                    {t("common.edit")}
                  </Button>

                  <Button
                    onClick={() => handleOpenDelete(category)}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl h-10 px-4"
                  >
                    <Trash2 className="w-4 h-4" />
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
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-[560px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
            {editingCategory ? t("common.edit") : t("content.addCategory")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {editingCategory
              ? t("content.updateCategoryDescription")
              : t("content.createCategoryDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryType">{t("content.categoryType")}</Label>
            <select
              id="categoryType"
              value={form.categoryType}
              onChange={(e) => {
                const selectedType = e.target.value;
                const config = categoryOptions.find(
                  (option) => option.value === selectedType
                );

                setForm((prev) => ({
                  ...prev,
                  categoryType: selectedType,
                  name: config?.label ?? prev.name,
                  description: prev.description,
                }));

                if (formError) setFormError("");
              }}
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
            >
              <option value="">{t("content.selectCategoryType")}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("content.categoryName")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (formError) setFormError("");
              }}
              placeholder="Enter category name"
              className="rounded-xl border-gray-200 bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("content.description")}</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                if (formError) setFormError("");
              }}
              placeholder="Enter category description"
              rows={4}
              className="rounded-xl border-gray-200 bg-gray-50 resize-none"
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="flex-1 rounded-xl"
            >
              {t("common.cancel")}
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  {editingCategory ? "Saving..." : "Creating..."}
                </>
              ) : editingCategory ? (
                t("common.save")
              ) : (
                t("content.addCategory")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog
      open={isDeleteDialogOpen}
      onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingCategory(null);
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
            {t("content.deletePrompt")}{" "}
            <span className="font-semibold text-gray-900">
              {deletingCategory?.name}
            </span>
            ? {t("common.deleteWarning")}
          </DialogDescription>
        </DialogHeader>

        {deleteError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {deleteError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingCategory(null);
              setDeleteError("");
            }}
            className="flex-1 rounded-xl"
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
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
