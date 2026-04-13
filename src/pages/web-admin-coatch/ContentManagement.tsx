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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { GeneralExerciseItem } from "../../services/generalExercises";
import {
  categoryOptions,
  cardStyles,
  FIXED_MUSCLE_GROUP,
  getCategoryIcon,
  getCategoryTypeFromName,
  getDefaultDescription,
  getErrorMessage,
  initialForm,
  type FormState,
} from "../../utils/generalExercises";
import { useGeneralExercises } from "../../hooks/generalExercises/queries/useGeneralExercises";
import { useCreateGeneralExercise } from "../../hooks/generalExercises/mutations/useCreateGeneralExercise";
import { useUpdateGeneralExercise } from "../../hooks/generalExercises/mutations/useUpdateGeneralExercise";
import { useDeleteGeneralExercise } from "../../hooks/generalExercises/mutations/useDeleteGeneralExercise";

export function ContentManagement() {
  const navigate = useNavigate();
  const location = useLocation();

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
  }

  function handleOpenCreate() {
    resetForm();
    setIsDialogOpen(true);
  }

  function handleOpenEdit(category: GeneralExerciseItem) {
    setEditingCategory(category);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      categoryType: getCategoryTypeFromName(category.name ?? ""),
    });
    setIsDialogOpen(true);
  }

  function handleOpenDelete(category: GeneralExerciseItem) {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  }

  function handleCategoryTypeChange(value: string) {
    const option = categoryOptions.find((item) => item.value === value);

    setForm((prev) => ({
      ...prev,
      categoryType: value,
      name: option?.label ?? prev.name,
      description: getDefaultDescription(value),
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.description.trim()) {
      alert("Name and description are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      muscle_group: FIXED_MUSCLE_GROUP,
      description: form.description.trim(),
    };

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
      alert(
        getErrorMessage(
          error,
          editingCategory
            ? "Failed to update category."
            : "Failed to create category."
        )
      );
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;

    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to delete category."));
    }
  }

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load categories.";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1">
            Content Management
          </h1>
          <p className="text-gray-500 text-sm">
            Manage exercise categories and navigate to category exercises
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
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Categories</p>
          <p className="text-3xl font-bold text-gray-900">{categoriesCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Exercises</p>
          <p className="text-3xl font-bold text-gray-900">{exercisesCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search categories..."
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
            No categories found
          </h3>
          <p className="text-gray-500 mb-6">
            {categories.length === 0
              ? "No exercise categories yet."
              : "Try adjusting your search."}
          </p>
          {categories.length === 0 ? (
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0"
            >
              <Plus className="mr-2" size={18} />
              Add Category
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
                      View Exercises
                    </Button>
                  </div>
                </div>

                <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {category.description || "No description available."}
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
                    Edit
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
          if (!open && !isSubmitting) resetForm();
        }}
      >
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-gray-900">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingCategory
                ? "Update category details"
                : "Create a new exercise category"}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="space-y-5 mt-4">
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Category Type
                </Label>
                <Select
                  value={form.categoryType}
                  onValueChange={handleCategoryTypeChange}
                >
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="mr-2">{option.icon}</span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Category Name
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
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
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Category description..."
                  rows={4}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
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
                  Cancel
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open && !deleteMutation.isPending) setDeletingCategory(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete Category</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {deletingCategory?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!deleteMutation.isPending) {
                  setIsDeleteDialogOpen(false);
                  setDeletingCategory(null);
                }
              }}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}