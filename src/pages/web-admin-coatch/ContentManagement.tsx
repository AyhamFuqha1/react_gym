import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Layers3,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  createGeneralExercise,
  deleteGeneralExercise,
  getGeneralExerciseById,
  getGeneralExercises,
  updateGeneralExercise,
  type GeneralExerciseItem,
} from "../../services/generalExercises";
import {
  cardStyles,
  categoryOptions,
  FIXED_MUSCLE_GROUP,
  getCategoryIcon,
  getCategoryTypeFromName,
  getDefaultDescription,
  getErrorMessage,
  initialForm,
  type FormState,
} from "../../utils/generalExercises";

export function ContentManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

  const [categories, setCategories] = useState<GeneralExerciseItem[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [exercisesCount, setExercisesCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  async function loadData() {
    try {
      setLoading(true);

      const data = await getGeneralExercises();
      const safeCategories = Array.isArray(data.categories) ? data.categories : [];

      setCategories(safeCategories);
      setCategoriesCount(data.categories_count ?? safeCategories.length);
      setExercisesCount(data.exercises_count ?? 0);
    } catch (error) {
      console.error("Failed to load general exercises:", error);
      setCategories([]);
      setCategoriesCount(0);
      setExercisesCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleOpenCreate() {
    resetForm();
    setIsDialogOpen(true);
  }

  async function handleOpenEdit(id: number) {
    try {
      setSubmitting(true);

      const item = await getGeneralExerciseById(id);

      setEditingId(item.id);
      setForm({
        name: item.name ?? "",
        description: item.description ?? "",
        categoryType: getCategoryTypeFromName(item.name ?? ""),
      });

      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load general exercise:", error);
      alert(getErrorMessage(error, "Failed to load category details."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.description.trim()) {
      alert("Name and description are required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        muscle_group: FIXED_MUSCLE_GROUP,
      };

      if (editingId !== null) {
        await updateGeneralExercise(editingId, payload);
      } else {
        await createGeneralExercise(payload);
      }

      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Failed to save general exercise:", error);
      alert(getErrorMessage(error, "Failed to save category."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this category?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteGeneralExercise(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete general exercise:", error);
      alert(getErrorMessage(error, "Failed to delete category."));
    } finally {
      setDeletingId(null);
    }
  }

  function handleViewExercises(category: GeneralExerciseItem) {
    navigate(`${dashboardBase}/exercises/${category.id}`, {
      state: {
        categoryName: category.name,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900">
            Exercise Library
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage exercises organized by categories
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl h-11 px-5"
        >
          <Plus className="mr-2" size={18} />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Exercises</p>
              <p className="text-2xl font-bold text-gray-900">{exercisesCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categoriesCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Layers3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
            Exercise Categories
          </h2>
          <p className="text-gray-500 text-sm">
            Select a category to view and manage exercises
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-2xl text-gray-900 font-semibold mb-2">
              No categories found
            </h3>
            <p className="text-gray-500 mb-6">
              Start by creating your first general exercise category.
            </p>
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0"
            >
              <Plus className="mr-2" size={18} />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const style = cardStyles[index % cardStyles.length];
              const categoryIcon = getCategoryIcon(category.name ?? "");

              return (
                <div
                  key={category.id}
                  className={`bg-white border ${style.borderColor} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-2xl shadow-sm`}
                    >
                      {categoryIcon}
                    </div>

                    <div
                      className={`${style.bgSoft} ${style.borderColor} border px-3 py-1 rounded-full`}
                    >
                      <span className={`${style.textColor} text-xs font-semibold`}>
                        Category
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-2">
                    {category.name}
                  </h3>

                  <p className="text-gray-500 text-sm min-h-[48px] mb-5">
                    {category.description}
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleViewExercises(category)}
                      className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 rounded-xl h-11"
                    >
                      View Exercises
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenEdit(category.id)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl h-11"
                      >
                        <Pencil className="mr-2 w-4 h-4" />
                        Edit
                      </Button>

                      <Button
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl h-11 px-4"
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open && !submitting) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-gray-900">
              {editingId !== null ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingId !== null
                ? "Update the general exercise category details"
                : "Create a new general exercise category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium mb-2 block">
                Category Type
              </Label>
              <Select
                value={form.categoryType}
                onValueChange={(value) => {
                  const option = categoryOptions.find((item) => item.value === value);

                  setForm((prev) => ({
                    ...prev,
                    categoryType: value,
                    name: option?.label || prev.name,
                    description:
                      prev.description.trim() === "" ||
                      prev.description === getDefaultDescription(prev.categoryType)
                        ? getDefaultDescription(value)
                        : prev.description,
                  }));
                }}
              >
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                  <SelectValue placeholder="Choose category type" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 text-sm font-medium mb-2 block">
                Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Chest"
                className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-gray-700 text-sm font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="e.g. Chest exercises category"
                rows={4}
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
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
                <X className="mr-2 w-4 h-4" />
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
                ) : editingId !== null ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}