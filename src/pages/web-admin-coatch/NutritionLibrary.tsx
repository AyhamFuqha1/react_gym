import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  ChevronRight,
  TrendingUp,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type {
  GeneralNutritionItem,
  GeneralNutritionPayload,
} from "../../services/generalNutrition";
import {
  iconOptions,
  initialForm,
  mapCategories,
  type FormState,
} from "../../utils/generalNutrition";
import { useGeneralNutritionCategories } from "../../hooks/generalNutrition/queries/useGeneralNutritionCategories";
import { useCreateGeneralNutrition } from "../../hooks/generalNutrition/mutations/useCreateGeneralNutrition";
import { useUpdateGeneralNutrition } from "../../hooks/generalNutrition/mutations/useUpdateGeneralNutrition";
import { useDeleteGeneralNutrition } from "../../hooks/generalNutrition/mutations/useDeleteGeneralNutrition";
import { useTranslation } from "../../i18n";

export function NutritionLibrary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<GeneralNutritionItem | null>(null);

  const [createForm, setCreateForm] = useState<FormState>(initialForm);
  const [editForm, setEditForm] = useState<FormState>(initialForm);

  const categoriesQuery = useGeneralNutritionCategories();
  const createMutation = useCreateGeneralNutrition();
  const updateMutation = useUpdateGeneralNutrition();
  const deleteMutation = useDeleteGeneralNutrition();

  const isLoading = categoriesQuery.isLoading;
  const rawCategories = categoriesQuery.data ?? [];
  const categories = useMemo(() => mapCategories(rawCategories), [rawCategories]);

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const totalFoods = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.foodCount, 0),
    [categories]
  );

  const handleOpenEdit = (categoryId: number) => {
    const found = rawCategories.find((item) => item.id === categoryId);
    if (!found) return;

    setSelectedCategory(found);
    setEditForm({
      category_name: found.category_name,
      icon: found.icon || "",
      description: found.description || "",
    });
    setSubmitError("");
    setIsEditOpen(true);
  };

  const handleOpenDelete = (categoryId: number) => {
    const found = rawCategories.find((item) => item.id === categoryId);
    if (!found) return;

    setSelectedCategory(found);
    setSubmitError("");
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (
      !createForm.category_name.trim() ||
      !createForm.icon.trim() ||
      !createForm.description.trim()
    ) {
      setSubmitError(t("common.requiredFields"));
      return;
    }

    setSubmitError("");
    setPageError("");

    try {
      const payload: GeneralNutritionPayload = {
        category_name: createForm.category_name.trim(),
        icon: createForm.icon.trim(),
        description: createForm.description.trim(),
      };

      await createMutation.mutateAsync(payload);
      setIsCreateOpen(false);
      setCreateForm(initialForm);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to create category."
      );
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;

    if (
      !editForm.category_name.trim() ||
      !editForm.icon.trim() ||
      !editForm.description.trim()
    ) {
      setSubmitError(t("common.requiredFields"));
      return;
    }

    setSubmitError("");
    setPageError("");

    try {
      const payload: GeneralNutritionPayload = {
        category_name: editForm.category_name.trim(),
        icon: editForm.icon.trim(),
        description: editForm.description.trim(),
      };

      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        payload,
      });
      setIsEditOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to update category."
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setSubmitError("");
    setPageError("");

    try {
      await deleteMutation.mutateAsync(selectedCategory.id);
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to delete category."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900">
            {t("nutritionLibrary.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("nutritionLibrary.subtitle")}
          </p>
        </div>

        <Button
          onClick={() => {
            setCreateForm(initialForm);
            setSubmitError("");
            setIsCreateOpen(true);
          }}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl h-11 px-5"
        >
          <Plus className="mr-2" size={18} />
          {t("nutritionLibrary.addCategory")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {t("nutritionLibrary.totalFoods")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalFoods}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Apple className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {t("dashboard.nutritionCategories")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
            {t("dashboard.nutritionCategories")}
          </h2>
          <p className="text-gray-500 text-sm">
            {t("nutritionLibrary.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
          </div>
        ) : categoriesQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
            {pageError || "Failed to load nutrition categories."}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            {t("nutritionLibrary.noCategories")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`bg-white border ${category.borderColor} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl shadow-sm`}
                  >
                    {category.icon}
                  </div>

                  <div
                    className={`${category.bgSoft} ${category.borderColor} border px-3 py-1 rounded-full`}
                  >
                    <span className={`${category.textColor} text-sm font-semibold`}>
                      {category.foodCount} {t("nutritionLibrary.foods")}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-2 capitalize">
                  {category.name}
                </h3>

                <p className="text-gray-500 text-sm mb-5 min-h-[40px]">
                  {category.description}
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() =>
                      navigate(`${dashboardBase}/nutrition/${category.id}`)
                    }
                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 rounded-xl h-11"
                  >
                    {t("nutritionLibrary.foods")}
                    <ChevronRight className="ml-2 w-4 h-4 rtl-flip" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => handleOpenEdit(category.id)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("common.update")}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleOpenDelete(category.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreateForm(initialForm);
            setSubmitError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("nutritionLibrary.addCategory")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-category-name">
                {t("nutritionLibrary.categoryName")}
              </Label>
              <Input
                id="create-category-name"
                value={createForm.category_name}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                placeholder="e.g. vegetables"
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label>{t("nutritionLibrary.icon")}</Label>
              <Select
                value={createForm.icon}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    icon: value,
                  }))
                }
              >
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue placeholder="Select category icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="create-category-description">
                {t("nutritionLibrary.description")}
              </Label>
              <Textarea
                id="create-category-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Write category description"
                className="mt-2 rounded-xl"
              />
            </div>

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
            >
              {isSubmitting ? t("members.creating") : t("nutritionLibrary.addCategory")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedCategory(null);
            setSubmitError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("common.update")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">
                {t("nutritionLibrary.categoryName")}
              </Label>
              <Input
                id="edit-category-name"
                value={editForm.category_name}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label>{t("nutritionLibrary.icon")}</Label>
              <Select
                value={editForm.icon}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    icon: value,
                  }))
                }
              >
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue placeholder="Select category icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-category-description">
                {t("nutritionLibrary.description")}
              </Label>
              <Textarea
                id="edit-category-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-2 rounded-xl"
              />
            </div>

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
            >
              {isSubmitting ? t("common.loading") : t("nutritionLibrary.updateCategory")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {
            setSelectedCategory(null);
            setSubmitError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {t("nutritionLibrary.deletePrompt")}{" "}
              <span className="font-semibold text-gray-900">
                {selectedCategory?.category_name}
              </span>
              ?
            </p>

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? t("common.deleting") : t("common.delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
