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

function formatAmount(
  quantity: number | null,
  unit: string,
  quantityText: string | null,
  multiplier: number
): string {
  if (quantity === null) return quantityText || unit;

  const scaledQuantity = Math.round(quantity * multiplier * 100) / 100;
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
