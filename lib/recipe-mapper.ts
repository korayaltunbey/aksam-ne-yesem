import type { Recipe, RecipeIngredient } from "@/lib/types";
import type { DatabaseRecipe } from "@/lib/recipe-repository";

export interface RecipeMappingOptions {
  servings?: number;
  missingIngredients?: string[];
}

function formatNumber(value: number): string {
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });
}

function formatKitchenFraction(value: number): string {
  const rounded = Math.max(0.25, Math.round(value * 4) / 4);
  const whole = Math.floor(rounded);
  const quarter = Math.round((rounded - whole) * 4);
  const fraction = ["", "çeyrek", "yarım", "yarım + çeyrek"][quarter] ?? "";

  if (whole === 0) return fraction || "çeyrek";
  if (!fraction) return String(whole);
  return `${whole} tam + ${fraction}`;
}

function formatProteinPiece(value: number): string {
  const rounded = Math.max(0.5, Math.ceil(value * 2) / 2);
  if (rounded === 0.5) return "yarım";
  if (Number.isInteger(rounded)) return String(rounded);
  return `${Math.floor(rounded)} tam + yarım`;
}

function formatAmount(
  ingredientName: string,
  quantity: number | null,
  unit: string,
  quantityText: string | null,
  multiplier: number
): string {
  if (quantity === null) return quantityText || unit;

  const scaledQuantity = Math.round(quantity * multiplier * 100) / 100;

  // Tavuk göğsü alışverişte genellikle parça ile alınır; gram yerine bu
  // ölçünün gösterilmesi tarifi mutfakta daha hızlı uygulanabilir kılar.
  if (ingredientName === "Tavuk göğsü" || ingredientName === "Tavuk") {
    const pieceCount = unit === "gram" ? scaledQuantity / 300 : scaledQuantity;
    return `${formatProteinPiece(pieceCount)} adet`;
  }

  if (unit === "gram") {
    const roundedGrams = Math.max(25, Math.round(scaledQuantity / 25) * 25);
    return `${roundedGrams} gram`;
  }

  if (unit === "kilogram") {
    const roundedGrams = Math.max(25, Math.round((scaledQuantity * 1000) / 25) * 25);
    return `${roundedGrams} gram`;
  }

  // Sıvı miktarlarını tarif ekranında daha pratik mutfak ölçüleriyle göster.
  if (unit === "mililitre" || unit === "ml") {
    const glasses = Math.round((scaledQuantity / 200) * 100) / 100;
    if (glasses >= 1) return `${formatKitchenFraction(glasses)} su bardağı`;

    const teaGlasses = Math.round((scaledQuantity / 100) * 100) / 100;
    return `${formatKitchenFraction(teaGlasses)} çay bardağı`;
  }

  if (unit === "litre") {
    return `${formatKitchenFraction(scaledQuantity * 5)} su bardağı`;
  }

  if (
    ["adet", "diş", "su bardağı", "çay bardağı", "yemek kaşığı", "tatlı kaşığı", "çay kaşığı", "paket", "kutu", "dilim", "demet", "kase"].includes(unit)
  ) {
    return `${formatKitchenFraction(scaledQuantity)} ${unit}`;
  }

  return `${formatNumber(scaledQuantity)} ${unit}`;
}

export function mapDatabaseRecipeToRecipe(
  recipe: DatabaseRecipe,
  options: RecipeMappingOptions = {}
): Recipe {
  const servings =
    options.servings && options.servings > 0
      ? Math.round(options.servings)
      : recipe.baseServings;
  const multiplier = servings / recipe.baseServings;

  const mappedIngredients: RecipeIngredient[] = recipe.ingredients.map(
    (ingredient) => ({
      name: ingredient.name,
      amount: formatAmount(
        ingredient.name,
        ingredient.quantity,
        ingredient.unit,
        ingredient.quantityText,
        multiplier
      ),
    })
  );

  return {
    name: recipe.name,
    ...(recipe.mealType ? { mealType: recipe.mealType } : {}),
    ...(recipe.cookingMethod ? { cookingMethod: recipe.cookingMethod } : {}),
    ...(recipe.budgetLevel ? { budgetLevel: recipe.budgetLevel } : {}),
    ...(recipe.estimatedCostPerServing !== null
      ? { estimatedCostPerServing: recipe.estimatedCostPerServing }
      : {}),
    ...(recipe.caloriesPerServing !== null
      ? { caloriesPerServing: recipe.caloriesPerServing }
      : {}),
    ...(recipe.proteinGrams !== null
      ? { proteinGrams: recipe.proteinGrams }
      : {}),
    ...(recipe.isFreezerFriendly ? { isFreezerFriendly: true } : {}),
    timeMinutes: recipe.timeMinutes,
    difficulty: recipe.difficulty,
    servings,
    ingredients: mappedIngredients,
    steps: recipe.steps,
    missingIngredients: options.missingIngredients ?? [],
    ...(recipe.note ? { note: recipe.note } : {}),
  };
}
