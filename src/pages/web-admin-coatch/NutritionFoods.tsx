import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import {
  createFood,
  deleteFood,
  getFoods,
  updateFood,
  type FoodItem,
} from "../../services/foods";
import {
  badgeColors,
  badgeOptions,
  filterFoods,
  getCategoryData,
  initialFormState,
  toInputValue,
  type FoodFormState,
} from "../../utils/foods";

export function NutritionFoods() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardBase = location.pathname.startsWith("/dashboard/coach")
    ? "/dashboard/coach"
    : "/dashboard/admin";

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
      const response = await getFoods();
      setFoods(response.data || []);
    } catch (error) {
      console.error("Failed to load foods:", error);
      setFoods([]);
      alert("Failed to load foods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) return;
    loadFoods();
  }, [numericCategoryId]);

  const categoryFoods = useMemo(() => {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) return [];
    return foods.filter((food) => food.category?.id === numericCategoryId);
  }, [foods, numericCategoryId]);

  const filteredFoods = useMemo(() => {
    if (!numericCategoryId || Number.isNaN(numericCategoryId)) return [];
    return filterFoods(foods, numericCategoryId, searchQuery, calorieFilter);
  }, [foods, numericCategoryId, searchQuery, calorieFilter]);

  const categoryData = useMemo(() => {
    return getCategoryData(categoryFoods, categoryId);
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
        await updateFood(editingFood.id, payload);
      } else {
        await createFood(payload);
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
      await deleteFood(foodId);
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid category
          </h2>
          <p className="text-gray-500 mb-4">
            The category id is missing or invalid.
          </p>
          <Button onClick={() => navigate(`${dashboardBase}/nutrition`)}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryData.gradient} flex items-center justify-center text-3xl shadow-sm`}
          >
            {categoryData.icon}
          </div>

          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`${dashboardBase}/nutrition`)}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 mb-2 -ml-3"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Categories
            </Button>

            <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-1 capitalize">
              {categoryData.name}
            </h1>
            <p className="text-gray-500 text-sm mb-1">
              {categoryData.description}
            </p>
            <p className="text-gray-500 text-sm">
              {filteredFoods.length} foods in this category
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAddFood}
          className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl h-11 px-5"
        >
          <Plus className="mr-2" size={18} />
          Add Food
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Select value={calorieFilter} onValueChange={setCalorieFilter}>
              <SelectTrigger className="pl-12 h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
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
        <div className="rounded-2xl border border-gray-100 bg-white p-12 flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No foods found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="relative mb-5">
                <div
                  className={`w-full aspect-video rounded-xl bg-gradient-to-br ${categoryData.gradient} flex items-center justify-center text-6xl mb-4`}
                >
                  {categoryData.icon}
                </div>

                {food.badge && (
                  <div
                    className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg border ${
                      badgeColors[food.badge] ||
                      "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {food.badge}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-900 mb-4">
                {food.name}
              </h3>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-500">Calories</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {food.calories}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">Protein</p>
                    <p className="text-sm font-bold text-gray-900">
                      {food.protein}g
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                    <p className="text-xs text-amber-600 mb-1">Carbs</p>
                    <p className="text-sm font-bold text-gray-900">
                      {food.carbs}g
                    </p>
                  </div>

                  <div className="bg-rose-50 rounded-lg p-2 text-center border border-rose-100">
                    <p className="text-xs text-rose-600 mb-1">Fat</p>
                    <p className="text-sm font-bold text-gray-900">
                      {food.fat}g
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-100">
                  <span className="text-sm text-gray-500">Serving Size</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {food.serving_size || "-"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenEditFood(food)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl h-10"
                >
                  <Edit className="mr-2 w-4 h-4" />
                  Edit
                </Button>

                <Button
                  onClick={() => handleDeleteFood(food.id)}
                  disabled={deletingFoodId === food.id}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl h-10 px-4"
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

      <Dialog open={isFoodDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl text-gray-900">
              {editingFood ? "Edit Food" : "Add New Food"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingFood
                ? "Update food details"
                : "Add a new food to the nutrition database"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-gray-700 text-sm font-medium mb-2 block">
                Food Name
              </Label>
              <Input
                placeholder="e.g., Greek Yogurt"
                value={form.name}
                onChange={(e) => handleChangeForm("name", e.target.value)}
                className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Category
                </Label>
                <Input
                  value={categoryData.name}
                  disabled
                  className="h-11 bg-gray-100 border-gray-200 text-gray-500 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Badge
                </Label>
                <Select
                  value={form.badge || "none"}
                  onValueChange={(value) =>
                    handleChangeForm("badge", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
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
              <Label className="text-gray-700 text-sm font-medium mb-3 block">
                Nutritional Information
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs mb-2 block">
                    Calories
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.calories}
                    onChange={(e) =>
                      handleChangeForm("calories", e.target.value)
                    }
                    className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-500 text-xs mb-2 block">
                    Protein (g)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.protein}
                    onChange={(e) =>
                      handleChangeForm("protein", e.target.value)
                    }
                    className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-500 text-xs mb-2 block">
                    Carbs (g)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.carbs}
                    onChange={(e) => handleChangeForm("carbs", e.target.value)}
                    className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-gray-500 text-xs mb-2 block">
                    Fat (g)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.fat}
                    onChange={(e) => handleChangeForm("fat", e.target.value)}
                    className="h-11 bg-gray-50 border-gray-200 text-gray-900 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Serving Size
                </Label>
                <Input
                  placeholder="e.g., 170g"
                  value={form.serving_size}
                  onChange={(e) =>
                    handleChangeForm("serving_size", e.target.value)
                  }
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-medium mb-2 block">
                  Image URL
                </Label>
                <Input
                  placeholder="optional"
                  value={form.image}
                  onChange={(e) => handleChangeForm("image", e.target.value)}
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleCloseDialog(false)}
                variant="outline"
                className="flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmitFood}
                disabled={submitting}
                className="flex-1 h-11 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white border-0 hover:shadow-md rounded-xl"
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