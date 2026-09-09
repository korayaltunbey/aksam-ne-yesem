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
  const fraction = ["", "¼", "½", "¾"][quarter] ?? "";

  if (whole === 0) return fraction || "¼";
  return `${whole}${fraction}`;
}

function formatAmount(
  quantity: number | null,
  unit: string,
  quantityText: string | null,
  multiplier: number
): string {
  if (quantity === null) return quantityText || unit;

  const scaledQuantity = Math.round(quantity * multiplier * 100) / 100;

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
    ["adet", "diş", "su bardağı", "çay bardağı", "yemek kaşığı", "tatlı kaşığı", "çay kaşığı"].includes(unit)
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
