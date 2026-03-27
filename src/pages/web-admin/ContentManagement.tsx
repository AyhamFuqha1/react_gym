import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
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
  createGeneralExercise,
  deleteGeneralExercise,
  getGeneralExerciseById,
  getGeneralExercises,
  updateGeneralExercise,
  type GeneralExerciseItem,
} from "../../services/generalExercises";

type FormState = {
  name: string;
  description: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
};

const FIXED_MUSCLE_GROUP = "General";

const cardStyles = [
  {
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/20",
  },
  {
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/20",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/20",
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/20",
  },
  {
    gradient: "from-rose-500 to-red-500",
    borderColor: "border-rose-500/20",
  },
  {
    gradient: "from-indigo-500 to-purple-500",
    borderColor: "border-indigo-500/20",
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

function getCategoryIcon(name: string) {
  const normalized = name.trim().toLowerCase();

  if (
    normalized.includes("chest") ||
    normalized.includes("pec")
  ) {
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
    normalized.includes("glute") ||
    normalized.includes("glutes") ||
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
    return "💪";
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

  return "🏋️";
}

export function ContentManagement() {
  const navigate = useNavigate();

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
    navigate(`/dashboard/admin/exercises/${category.id}`, {
      state: {
        categoryName: category.name,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -m-8 p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-white mb-3">
              Exercise Library
            </h1>
            <p className="text-gray-400 text-lg">
              Manage exercises organized by categories
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-xl hover:shadow-[#0D7D6D]/30 h-12 px-6 text-base"
          >
            <Plus className="mr-2" size={20} />
            Add Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Total Exercises</p>
                <p className="text-4xl font-bold text-white">{exercisesCount}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Categories</p>
                <p className="text-4xl font-bold text-white">{categoriesCount}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Layers3 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-white mb-2">
            Exercise Categories
          </h2>
          <p className="text-gray-400">
            Select a category to view and manage exercises
          </p>
        </div>

        {loading ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-2xl text-white font-semibold mb-2">No categories found</h3>
            <p className="text-gray-400 mb-6">
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
                  className={`bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border ${style.borderColor} rounded-2xl p-8 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300`}
                >
                  <div className="mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-3xl shadow-lg`}
                    >
                      {categoryIcon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-white mb-2">
                    {category.name}
                  </h3>

                  <p className="text-gray-400 text-sm min-h-[48px] mb-6">
                    {category.description}
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleViewExercises(category)}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white h-11"
                    >
                      View Exercises
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenEdit(category.id)}
                        className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 h-11"
                      >
                        <Pencil className="mr-2 w-4 h-4" />
                        Edit
                      </Button>

                      <Button
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 h-11 px-4"
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
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-white">
              {editingId !== null ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingId !== null
                ? "Update the general exercise category details"
                : "Create a new general exercise category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">
                Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Chest"
                className="h-12 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="e.g. Chest exercises category"
                rows={4}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl resize-none"
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
                className="flex-1 h-12 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl"
              >
                <X className="mr-2 w-4 h-4" />
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-12 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-xl hover:shadow-[#0D7D6D]/30 rounded-xl"
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