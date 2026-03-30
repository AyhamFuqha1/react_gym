import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Flame,
  Loader2,
} from "lucide-react";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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

type FoodCategory = {
  id: number;
  category_name: string;
  icon: string | null;
  description: string | null;
};

type FoodItem = {
  id: number;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  badge: string | null;
  image: string | null;
  serving_size: string | null;
  category: FoodCategory;
};

type FoodsResponse = {
  data: FoodItem[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};

type FoodFormState = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  serving_size: string;
  badge: string;
  image: string;
};

const initialFormState: FoodFormState = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  serving_size: "",
  badge: "",
  image: "",
};

const iconEmojiMap: Record<string, string> = {
  protein: "🥩",
  carbohydrates: "🌽",
  carbs: "🌽",
  vegetables: "🥗",
  fruits: "🍎",
  seafood: "🐟",
  "healthy fat": "🥑",
  "healthy fats": "🥑",
  fats: "🥑",
  dairy: "🥛",
  snacks: "🥨",
  hydration: "💧",
  mixed: "🍱",
  "mixed meals": "🍱",
};

const gradientMap: Record<string, string> = {
  protein: "from-rose-500 to-red-500",
  carbohydrates: "from-amber-500 to-orange-500",
  carbs: "from-amber-500 to-orange-500",
  vegetables: "from-green-500 to-emerald-500",
  fruits: "from-pink-500 to-rose-500",
  seafood: "from-cyan-500 to-blue-500",
  "healthy fat": "from-emerald-500 to-teal-500",
  "healthy fats": "from-emerald-500 to-teal-500",
  fats: "from-emerald-500 to-teal-500",
  dairy: "from-sky-500 to-indigo-500",
  snacks: "from-violet-500 to-purple-500",
  hydration: "from-blue-500 to-cyan-500",
  mixed: "from-purple-500 to-violet-500",
  "mixed meals": "from-purple-500 to-violet-500",
};

const badgeOptions = [
  "High Protein",
  "Low Fat",
  "Fiber Rich",
  "Heart Healthy",
  "Low GI",
  "Omega-3 Rich",
  "Balanced",
  "Antioxidant",
  "Pre-Workout",
  "Post-Workout",
];

const badgeColors: Record<string, string> = {
  "High Protein": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Low Fat": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Omega-3 Rich": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Fiber Rich": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Low GI": "bg-green-500/20 text-green-400 border-green-500/30",
  "Heart Healthy": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Antioxidant: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Balanced: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Pre-Workout": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Post-Workout": "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

function getIconEmoji(icon?: string | null) {
  if (!icon) return "🥗";
  return iconEmojiMap[icon.toLowerCase()] || "🥗";
}

function getGradient(icon?: string | null) {
  if (!icon) return "from-green-500 to-emerald-500";
  return gradientMap[icon.toLowerCase()] || "from-green-500 to-emerald-500";
}

function toInputValue(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function NutritionFoods() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const numericCategoryId = Number(categoryId);

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingFoodId, setDeletingFoodId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [calorieFilter, setCalorieFilter] = useState("all");

  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [form, setForm] = useState<FoodFormState>(initialFormState);

  const loadFoods = async () => {
    try {
      setLoading(true);
      const response = await api.get<FoodsResponse>("/foods");
      setFoods(response.data.data || []);
    } catch (error) {
      console.error("Failed to load foods:", error);
      setFoods([]);
      alert("Failed to load foods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
      return;
    }

    loadFoods();
  }, [numericCategoryId]);

  const categoryFoods = useMemo(() => {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) return [];
    return foods.filter((food) => food.category?.id === numericCategoryId);
  }, [foods, numericCategoryId]);

  const filteredFoods = useMemo(() => {
    return categoryFoods.filter((food) => {
      const matchesSearch = food.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const calories = Number(food.calories);
      let matchesCalories = true;

      if (calorieFilter === "low") matchesCalories = calories < 100;
      if (calorieFilter === "medium") {
        matchesCalories = calories >= 100 && calories < 300;
      }
      if (calorieFilter === "high") matchesCalories = calories >= 300;

      return matchesSearch && matchesCalories;
    });
  }, [categoryFoods, searchQuery, calorieFilter]);

  const categoryData = useMemo(() => {
    const firstFood = categoryFoods[0];

    if (firstFood?.category) {
      return {
        name: firstFood.category.category_name,
        description: firstFood.category.description || "No description available",
        icon: getIconEmoji(firstFood.category.icon),
        gradient: getGradient(firstFood.category.icon),
      };
    }

    return {
      name: `Category #${categoryId ?? ""}`,
      description: "No foods found in this category yet",
      icon: "🥗",
      gradient: "from-green-500 to-emerald-500",
    };
  }, [categoryFoods, categoryId]);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingFood(null);
  };

  const handleOpenAddFood = () => {
    resetForm();
    setIsFoodDialogOpen(true);
  };

  const handleOpenEditFood = (food: FoodItem) => {
    setEditingFood(food);
    setForm({
      name: food.name ?? "",
      calories: toInputValue(food.calories),
      protein: toInputValue(food.protein),
      carbs: toInputValue(food.carbs),
      fat: toInputValue(food.fat),
      serving_size: food.serving_size ?? "",
      badge: food.badge ?? "",
      image: food.image ?? "",
    });
    setIsFoodDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsFoodDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleChangeForm = (field: keyof FoodFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitFood = async () => {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
      alert("Invalid category id.");
      return;
    }

    if (!form.name.trim()) {
      alert("Food name is required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        general_nutrition_id: numericCategoryId,
        name: form.name.trim(),
        calories: Number(form.calories || 0),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0),
        serving_size: form.serving_size.trim(),
        image: form.image.trim() || null,
      };

      if (editingFood) {
        await api.put(`/foods/${editingFood.id}`, payload);
      } else {
        await api.post("/foods", payload);
      }

      await loadFoods();
      handleCloseDialog(false);
    } catch (error: any) {
      console.error("Failed to submit food:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to save food. Check console/network tab."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFood = async (foodId: number) => {
    try {
      setDeletingFoodId(foodId);
      await api.delete(`/foods/${foodId}`);
      await loadFoods();
    } catch (error: any) {
      console.error("Failed to delete food:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to delete food. Check console/network tab."
      );
    } finally {
      setDeletingFoodId(null);
    }
  };

  if (!numericCategoryId || Number.isNaN(numericCategoryId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -m-8 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Invalid category</h2>
          <p className="text-gray-400 mb-4">The category id is missing or invalid.</p>
          <Button onClick={() => navigate("/dashboard/admin/nutrition")}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -m-8 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/admin/nutrition")}
            className="text-gray-400 hover:text-white hover:bg-white/5 mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Categories
          </Button>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${categoryData.gradient} flex items-center justify-center text-4xl shadow-xl`}
              >
                {categoryData.icon}
              </div>

              <div>
                <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-2 capitalize">
                  {categoryData.name}
                </h1>
                <p className="text-gray-400 text-base mb-1">
                  {categoryData.description}
                </p>
                <p className="text-gray-400 text-lg">
                  {filteredFoods.length} foods in this category
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenAddFood}
              className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-xl hover:shadow-[#0D7D6D]/30 h-12 px-6 text-base"
            >
              <Plus className="mr-2" size={20} />
              Add Food
            </Button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <Select value={calorieFilter} onValueChange={setCalorieFilter}>
                <SelectTrigger className="pl-12 h-12 bg-gray-900/50 border-gray-700 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calories</SelectItem>
                  <SelectItem value="low">Low (&lt;100 cal)</SelectItem>
                  <SelectItem value="medium">Medium (100-300 cal)</SelectItem>
                  <SelectItem value="high">High (&gt;300 cal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No foods found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:scale-105 hover:shadow-2xl hover:border-gray-600/50 transition-all duration-300 group"
              >
                <div className="relative mb-5">
                  <div
                    className={`w-full aspect-video rounded-xl bg-gradient-to-br ${categoryData.gradient} flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform`}
                  >
                    {categoryData.icon}
                  </div>

                  {food.badge && (
                    <div
                      className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg border ${
                        badgeColors[food.badge] ||
                        "bg-gray-700/50 text-gray-300 border-gray-600"
                      } backdrop-blur-sm`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {food.badge}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-4">
                  {food.name}
                </h3>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-400">Calories</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {food.calories}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-400 mb-1">Protein</p>
                      <p className="text-sm font-bold text-white">
                        {food.protein}g
                      </p>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-amber-400 mb-1">Carbs</p>
                      <p className="text-sm font-bold text-white">
                        {food.carbs}g
                      </p>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-rose-400 mb-1">Fat</p>
                      <p className="text-sm font-bold text-white">
                        {food.fat}g
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Serving Size</span>
                    <span className="text-sm font-semibold text-white">
                      {food.serving_size || "-"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenEditFood(food)}
                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 h-10"
                  >
                    <Edit className="mr-2 w-4 h-4" />
                    Edit
                  </Button>

                  <Button
                    onClick={() => handleDeleteFood(food.id)}
                    disabled={deletingFoodId === food.id}
                    className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 h-10 px-4"
                  >
                    {deletingFoodId === food.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFoodDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-white">
              {editingFood ? "Edit Food" : "Add New Food"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingFood
                ? "Update food details"
                : "Add a new food to the nutrition database"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">
                Food Name
              </Label>
              <Input
                placeholder="e.g., Greek Yogurt"
                value={form.name}
                onChange={(e) => handleChangeForm("name", e.target.value)}
                className="h-12 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">
                  Category
                </Label>
                <Input
                  value={categoryData.name}
                  disabled
                  className="h-12 bg-gray-900/30 border-gray-700 text-gray-400 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">
                  Badge
                </Label>
                <Select
                  value={form.badge || "none"}
                  onValueChange={(value) =>
                    handleChangeForm("badge", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-12 bg-gray-900/50 border-gray-700 text-white rounded-xl">
                    <SelectValue placeholder="Select badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Badge</SelectItem>
                    {badgeOptions.map((badge) => (
                      <SelectItem key={badge} value={badge}>
                        {badge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm font-medium mb-3 block">
                Nutritional Information
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">
                    Calories
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.calories}
                    onChange={(e) =>
                      handleChangeForm("calories", e.target.value)
                    }
                    className="h-12 bg-gray-900/50 border-gray-700 text-white rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">
                    Protein (g)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.protein}
                    onChange={(e) =>
                      handleChangeForm("protein", e.target.value)
                    }
                    className="h-12 bg-gray-900/50 border-gray-700 text-white rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">
                    Carbs (g)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.carbs}
                    onChange={(e) => handleChangeForm("carbs", e.target.value)}
                    className="h-12 bg-gray-900/50 border-gray-700 text-white rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 text-xs mb-2 block">
                    Fat (g)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.fat}
                    onChange={(e) => handleChangeForm("fat", e.target.value)}
                    className="h-12 bg-gray-900/50 border-gray-700 text-white rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">
                  Serving Size
                </Label>
                <Input
                  placeholder="e.g., 170g"
                  value={form.serving_size}
                  onChange={(e) =>
                    handleChangeForm("serving_size", e.target.value)
                  }
                  className="h-12 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">
                  Image URL
                </Label>
                <Input
                  placeholder="optional"
                  value={form.image}
                  onChange={(e) => handleChangeForm("image", e.target.value)}
                  className="h-12 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleCloseDialog(false)}
                variant="outline"
                className="flex-1 h-12 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmitFood}
                disabled={submitting}
                className="flex-1 h-12 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-xl hover:shadow-[#0D7D6D]/30 rounded-xl"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingFood ? (
                  "Update Food"
                ) : (
                  "Add Food"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}