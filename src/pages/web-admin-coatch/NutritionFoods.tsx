import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Apple,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import type { FoodPayload } from "../../services/foods";
import { useFoods } from "../../hooks/foods/queries/useFoods";
import { useCreateFood } from "../../hooks/foods/mutations/useCreateFood";
import { useUpdateFood } from "../../hooks/foods/mutations/useUpdateFood";
import { useDeleteFood } from "../../hooks/foods/mutations/useDeleteFood";
import {
  badgeColors,
  badgeOptions,
  filterFoods,
  getCategoryData,
  initialFormState,
  toInputValue,
  type FoodFormState,
} from "../../utils/foods";
import { useTranslation } from "../../i18n";

export function NutritionFoods() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const { t } = useTranslation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const numericCategoryId = Number(categoryId);

  const [searchQuery, setSearchQuery] = useState("");
  const [calorieFilter, setCalorieFilter] = useState("all");
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<FoodFormState>(initialFormState);
  const [editForm, setEditForm] = useState<FoodFormState>(initialFormState);

  const foodsQuery = useFoods();
  const createFoodMutation = useCreateFood();
  const updateFoodMutation = useUpdateFood();
  const deleteFoodMutation = useDeleteFood();

  const isLoading = foodsQuery.isLoading;
  const foods = foodsQuery.data?.data ?? [];

  const isSubmitting =
    createFoodMutation.isPending ||
    updateFoodMutation.isPending ||
    deleteFoodMutation.isPending;

  const categoryFoods = useMemo(() => {
    return filterFoods(foods, numericCategoryId, searchQuery, calorieFilter);
  }, [foods, numericCategoryId, searchQuery, calorieFilter]);

  const categoryData = useMemo(() => {
    return getCategoryData(categoryFoods, categoryId);
  }, [categoryFoods, categoryId]);

  const totalFoods = categoryFoods.length;
  const totalCalories = categoryFoods.reduce(
    (sum, food) => sum + (Number(food.calories) || 0),
    0
  );

  const selectedFood = useMemo(() => {
    return foods.find((food) => food.id === selectedFoodId) || null;
  }, [foods, selectedFoodId]);

  const openCreateDialog = () => {
    setCreateForm(initialFormState);
    setSubmitError("");
    setIsCreateOpen(true);
  };

  const openEditDialog = (foodId: number) => {
    const found = foods.find((food) => food.id === foodId);
    if (!found) return;

    setSelectedFoodId(found.id);
    setEditForm({
      name: found.name ?? "",
      calories: toInputValue(found.calories),
      protein: toInputValue(found.protein),
      carbs: toInputValue(found.carbs),
      fat: toInputValue(found.fat),
      serving_size: toInputValue(found.serving_size),
      badge: found.badge ?? "",
      image: found.image ?? "",
    });
    setSubmitError("");
    setIsEditOpen(true);
  };

  const openDeleteDialog = (foodId: number) => {
    const found = foods.find((food) => food.id === foodId);
    if (!found) return;

    setSelectedFoodId(found.id);
    setSubmitError("");
    setIsDeleteOpen(true);
  };

  const buildPayload = (form: FoodFormState): FoodPayload => ({
    general_nutrition_id: numericCategoryId,
    name: form.name.trim(),
    calories: Number(form.calories),
    protein: Number(form.protein),
    carbs: Number(form.carbs),
    fat: Number(form.fat),
    serving_size: form.serving_size.trim(),
    image: form.image.trim() || null,
  });

  const validateForm = (form: FoodFormState) => {
    if (
      !form.name.trim() ||
      !form.calories.trim() ||
      !form.protein.trim() ||
      !form.carbs.trim() ||
      !form.fat.trim() ||
      !form.serving_size.trim()
    ) {
      return t("nutritionFoods.requiredFields");
    }

    if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
      return t("nutritionFoods.invalidCategory");
    }

    return "";
  };

  const handleCreate = async () => {
    const validationError = validateForm(createForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError("");
    setPageError("");

    try {
      await createFoodMutation.mutateAsync(buildPayload(createForm));
      setIsCreateOpen(false);
      setCreateForm(initialFormState);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Failed to create food.");
    }
  };

  const handleUpdate = async () => {
    if (!selectedFoodId) return;

    const validationError = validateForm(editForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError("");
    setPageError("");

    try {
      await updateFoodMutation.mutateAsync({
        foodId: selectedFoodId,
        payload: buildPayload(editForm),
      });
      setIsEditOpen(false);
      setSelectedFoodId(null);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Failed to update food.");
    }
  };

  const handleDelete = async () => {
    if (!selectedFoodId) return;

    setSubmitError("");
    setPageError("");

    try {
      await deleteFoodMutation.mutateAsync(selectedFoodId);
      setIsDeleteOpen(false);
      setSelectedFoodId(null);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Failed to delete food.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${dashboardBase}/nutrition`)}
            className="rounded-xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4 rtl-flip" />
            {t("memberDetails.backToMembers")}
          </Button>

          <div>
            <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 capitalize">
              {categoryData.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{categoryData.description}</p>
          </div>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl h-11 px-5"
        >
          <Plus className="mr-2" size={18} />
          {t("nutritionFoods.addFood")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {t("nutritionLibrary.foods")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalFoods}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryData.gradient} flex items-center justify-center text-2xl`}
            >
              {categoryData.icon}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {t("nutritionFoods.calories")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalCalories}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Apple className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {t("nutritionFoods.categoryId")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {categoryId || "-"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              #
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder={t("nutritionFoods.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 bg-gray-50 h-11"
            />
          </div>

          <Select value={calorieFilter} onValueChange={setCalorieFilter}>
            <SelectTrigger className="w-full lg:w-[220px] rounded-xl border-gray-200 bg-gray-50 h-11">
              <SelectValue placeholder={t("nutritionFoods.calories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("nutritionFoods.calories")}</SelectItem>
              <SelectItem value="low">Low (&lt; 100)</SelectItem>
              <SelectItem value="medium">Medium (100 - 299)</SelectItem>
              <SelectItem value="high">High (300+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
        </div>
      ) : foodsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
          {pageError || "Failed to load foods."}
        </div>
      ) : categoryFoods.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
          {t("nutritionFoods.noFoods")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categoryFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryData.gradient} flex items-center justify-center text-2xl shadow-sm`}
                >
                  {categoryData.icon}
                </div>

                {food.badge ? (
                  <div
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                      badgeColors[food.badge] ||
                      "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {food.badge}
                  </div>
                ) : null}
              </div>

              <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-2">
                {food.name}
              </h3>

              <p className="text-gray-500 text-sm mb-4">
                {t("nutritionFoods.servingSize")}: {food.serving_size || "N/A"}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">
                    {t("nutritionFoods.calories")}
                  </p>
                  <p className="font-semibold text-gray-900">{food.calories}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">
                    {t("nutritionFoods.protein")}
                  </p>
                  <p className="font-semibold text-gray-900">{food.protein}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">
                    {t("nutritionFoods.carbs")}
                  </p>
                  <p className="font-semibold text-gray-900">{food.carbs}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">
                    {t("nutritionFoods.fat")}
                  </p>
                  <p className="font-semibold text-gray-900">{food.fat}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => openEditDialog(food.id)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("common.update")}
                </Button>

                <Button
                  type="button"
                  onClick={() => openDeleteDialog(food.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreateForm(initialFormState);
            setSubmitError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("nutritionFoods.addFood")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t("nutritionFoods.foodName")}</Label>
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-2 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("nutritionFoods.calories")}</Label>
                <Input
                  type="number"
                  value={createForm.calories}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      calories: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label>{t("nutritionFoods.servingSize")}</Label>
                <Input
                  value={createForm.serving_size}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      serving_size: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("nutritionFoods.protein")}</Label>
                <Input
                  type="number"
                  value={createForm.protein}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      protein: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label>{t("nutritionFoods.carbs")}</Label>
                <Input
                  type="number"
                  value={createForm.carbs}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      carbs: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label>{t("nutritionFoods.fat")}</Label>
                <Input
                  type="number"
                  value={createForm.fat}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      fat: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label>{t("nutritionFoods.badge")}</Label>
              <Select
                value={createForm.badge}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, badge: value }))
                }
              >
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  {badgeOptions.map((badge) => (
                    <SelectItem key={badge} value={badge}>
                      {badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("nutritionFoods.imageUrl")}</Label>
              <Input
                value={createForm.image}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, image: e.target.value }))
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
              onClick={handleCreate}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white"
            >
              {isSubmitting ? t("members.creating") : t("nutritionFoods.addFood")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedFoodId(null);
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
              <Label>{t("nutritionFoods.foodName")}</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-2 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("nutritionFoods.calories")}</Label>
                <Input
                  type="number"
                  value={editForm.calories}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      calories: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label>{t("nutritionFoods.servingSize")}</Label>
                <Input
                  value={editForm.serving_size}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      serving_size: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("nutritionFoods.protein")}</Label>
                <Input
                  type="number"
                  value={editForm.protein}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      protein: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label>{t("nutritionFoods.carbs")}</Label>
                <Input
                  type="number"
                  value={editForm.carbs}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      carbs: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label>{t("nutritionFoods.fat")}</Label>
                <Input
                  type="number"
                  value={editForm.fat}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      fat: e.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label>{t("nutritionFoods.badge")}</Label>
              <Select
                value={editForm.badge}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, badge: value }))
                }
              >
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  {badgeOptions.map((badge) => (
                    <SelectItem key={badge} value={badge}>
                      {badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("nutritionFoods.imageUrl")}</Label>
              <Input
                value={editForm.image}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, image: e.target.value }))
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
              {isSubmitting ? t("common.loading") : t("common.update")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {
            setSelectedFoodId(null);
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
              {t("nutritionFoods.deletePrompt")}{" "}
              <span className="font-semibold text-gray-900">
                {selectedFood?.name}
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
                {isSubmitting ? t("common.loading") : t("common.delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
