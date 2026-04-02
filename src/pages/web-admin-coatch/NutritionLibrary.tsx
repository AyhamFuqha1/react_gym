import { useEffect, useMemo, useState } from "react";
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
import {
  createGeneralNutrition,
  deleteGeneralNutrition,
  getGeneralNutritionCategories,
  updateGeneralNutrition,
  type GeneralNutritionItem,
  type GeneralNutritionPayload,
} from "../../services/generalNutrition";

type CategoryCard = {
  id: number;
  name: string;
  foodCount: number;
  icon: string;
  gradient: string;
  bgSoft: string;
  borderColor: string;
  textColor: string;
  description: string;
};

type FormState = {
  category_name: string;
  icon: string;
  description: string;
};

type IconOption = {
  value: string;
  label: string;
  emoji: string;
};

const initialForm: FormState = {
  category_name: "",
  icon: "",
  description: "",
};

const iconOptions: IconOption[] = [
  { value: "protein", label: "Protein", emoji: "🥩" },
  { value: "carbohydrates", label: "Carbohydrates", emoji: "🌾" },
  { value: "healthy_fats", label: "Healthy Fats", emoji: "🥑" },
  { value: "vegetables", label: "Vegetables", emoji: "🥗" },
  { value: "fruits", label: "Fruits", emoji: "🍎" },
  { value: "mixed_meals", label: "Mixed Meals", emoji: "🍱" },
  { value: "dairy", label: "Dairy", emoji: "🥛" },
  { value: "seafood", label: "Seafood", emoji: "🐟" },
  { value: "snacks", label: "Snacks", emoji: "🥜" },
  { value: "hydration", label: "Hydration", emoji: "💧" },
];

const stylePresets = [
  {
    gradient: "from-blue-500 to-cyan-500",
    bgSoft: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-600",
    fallbackIcon: "🥩",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    bgSoft: "bg-amber-50",
    borderColor: "border-amber-100",
    textColor: "text-amber-600",
    fallbackIcon: "🌾",
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    bgSoft: "bg-emerald-50",
    borderColor: "border-emerald-100",
    textColor: "text-emerald-600",
    fallbackIcon: "🥑",
  },
  {
    gradient: "from-green-500 to-emerald-500",
    bgSoft: "bg-green-50",
    borderColor: "border-green-100",
    textColor: "text-green-600",
    fallbackIcon: "🥗",
  },
  {
    gradient: "from-pink-500 to-rose-500",
    bgSoft: "bg-pink-50",
    borderColor: "border-pink-100",
    textColor: "text-pink-600",
    fallbackIcon: "🍎",
  },
  {
    gradient: "from-purple-500 to-violet-500",
    bgSoft: "bg-purple-50",
    borderColor: "border-purple-100",
    textColor: "text-purple-600",
    fallbackIcon: "🍱",
  },
];

function mapIcon(icon: string | null | undefined, fallbackIcon: string): string {
  if (!icon) return fallbackIcon;

  const normalized = icon.trim().toLowerCase();
  const found = iconOptions.find((option) => option.value === normalized);

  return found?.emoji || fallbackIcon;
}

function getCategoryVisual(index: number, item: GeneralNutritionItem) {
  const preset = stylePresets[index % stylePresets.length];

  return {
    gradient: preset.gradient,
    bgSoft: preset.bgSoft,
    borderColor: preset.borderColor,
    textColor: preset.textColor,
    icon: mapIcon(item.icon, preset.fallbackIcon),
  };
}

function mapCategories(data: GeneralNutritionItem[]): CategoryCard[] {
  return data.map((item, index) => {
    const visual = getCategoryVisual(index, item);

    return {
      id: item.id,
      name: item.category_name,
      foodCount: item.foods.length,
      icon: visual.icon,
      gradient: visual.gradient,
      bgSoft: visual.bgSoft,
      borderColor: visual.borderColor,
      textColor: visual.textColor,
      description: item.description?.trim() || "No description available.",
    };
  });
}

export function NutritionLibrary() {
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const [categories, setCategories] = useState<CategoryCard[]>([]);
  const [rawCategories, setRawCategories] = useState<GeneralNutritionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<GeneralNutritionItem | null>(null);

  const [createForm, setCreateForm] = useState<FormState>(initialForm);
  const [editForm, setEditForm] = useState<FormState>(initialForm);

  const loadCategories = async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const data = await getGeneralNutritionCategories();
      setRawCategories(data);
      setCategories(mapCategories(data));
    } catch (err: any) {
      setPageError(
        err?.response?.data?.message ||
          "Failed to load nutrition categories."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const totalFoods = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.foodCount, 0),
    [categories]
  );

  const averageFoodsPerCategory =
    categories.length > 0 ? Math.round(totalFoods / categories.length) : 0;

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
      setSubmitError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload: GeneralNutritionPayload = {
        category_name: createForm.category_name.trim(),
        icon: createForm.icon.trim(),
        description: createForm.description.trim(),
      };

      await createGeneralNutrition(payload);
      setIsCreateOpen(false);
      setCreateForm(initialForm);
      await loadCategories();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to create category."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;

    if (
      !editForm.category_name.trim() ||
      !editForm.icon.trim() ||
      !editForm.description.trim()
    ) {
      setSubmitError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload: GeneralNutritionPayload = {
        category_name: editForm.category_name.trim(),
        icon: editForm.icon.trim(),
        description: editForm.description.trim(),
      };

      await updateGeneralNutrition(selectedCategory.id, payload);
      setIsEditOpen(false);
      setSelectedCategory(null);
      await loadCategories();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to update category."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await deleteGeneralNutrition(selectedCategory.id);
      setIsDeleteOpen(false);
      setSelectedCategory(null);
      await loadCategories();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to delete category."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900">
            Nutrition Library
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage food database organized by nutrition categories
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
          Create Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Foods</p>
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
              <p className="text-gray-400 text-sm mb-2">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Avg per Category</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageFoodsPerCategory}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
            Food Categories
          </h2>
          <p className="text-gray-500 text-sm">
            Select a category to view and manage foods
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
            {pageError}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            No nutrition categories found.
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
                      {category.foodCount} foods
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
                    View Foods
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => handleOpenEdit(category.id)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Update
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleOpenDelete(category.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
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
            <DialogTitle>Create Nutrition Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-category-name">Category Name</Label>
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
              <Label>Choose Icon</Label>
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
              <Label htmlFor="create-category-description">Description</Label>
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
              {isSubmitting ? "Creating..." : "Create Category"}
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
            <DialogTitle>Update Nutrition Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name</Label>
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
              <Label>Choose Icon</Label>
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
              <Label htmlFor="edit-category-description">Description</Label>
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
              {isSubmitting ? "Updating..." : "Update Category"}
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
            <DialogTitle>Delete Nutrition Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete{" "}
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
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}