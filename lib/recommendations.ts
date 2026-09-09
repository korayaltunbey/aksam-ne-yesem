import type { DishSuggestion } from "@/lib/types";
import {
  findRecipes,
  type DatabaseRecipe,
  type DatabaseRecipeIngredient,
  type RecipeSearchFilters,
} from "@/lib/recipe-repository";

const DEFAULT_LIMIT = 5;

export interface RecommendationRequest {
  ingredients?: string[];
  diet?: string;
  mealType?: string;
  cookingMethod?: string;
  maxTime?: number | null;
  cuisine?: string;
  excludeNames?: string[];
  excludeIngredients?: string[];
  limit?: number;
}

export interface LocalDishSuggestion extends DishSuggestion {
  id: number;
  slug: string;
  ingredientCoverage: number;
  matchedIngredientCount: number;
  matchScore: number;
  missingIngredientCount: number;
}

const DIET_ALIASES: Record<string, string> = {
  vejetaryen: "vegetarian",
  vegetarian: "vegetarian",
  vegan: "vegan",
  glutensiz: "gluten_free",
  "gluten free": "gluten_free",
  "dusuk karbonhidrat": "low_carb",
  "low carb": "low_carb",
  "dusuk kalorili": "low_calorie",
  "low calorie": "low_calorie",
};

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function singularizeToken(token: string): string {
  if (token.length <= 4) return token;
  if (token.endsWith("lar") || token.endsWith("ler")) {
    return token.slice(0, -3);
  }
  return token;
}

function getIngredientKeys(value: string): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const singular = normalized
    .split(" ")
    .map(singularizeToken)
    .join(" ");

  return singular === normalized ? [normalized] : [normalized, singular];
}

function buildIngredientKeySet(values: string[]): Set<string> {
  return new Set(values.flatMap(getIngredientKeys));
}

function containsIngredientKey(recipeKey: string, userKey: string): boolean {
  const recipeTokens = recipeKey.split(" ");
  const userTokens = userKey.split(" ");
  if (userTokens.length > recipeTokens.length) return false;

  return recipeTokens.some((_, start) =>
    userTokens.every(
      (token, offset) => recipeTokens[start + offset] === token
    )
  );
}

function ingredientMatches(
  userIngredientKeys: Set<string>,
  recipeIngredient: DatabaseRecipeIngredient
): boolean {
  return getIngredientKeys(recipeIngredient.name).some((recipeKey) =>
    [...userIngredientKeys].some(
      (userKey) =>
        userKey === recipeKey || containsIngredientKey(recipeKey, userKey)
    )
  );
}

export function toDietCode(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const normalized = normalizeSearchText(value);
  return DIET_ALIASES[normalized] || normalized;
}

export function normalizeCuisine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return normalizeSearchText(value) === normalizeSearchText("Türk Mutfağı")
    ? "Türk Mutfağı"
    : value.trim();
}

function getRequiredIngredients(
  recipeIngredients: DatabaseRecipeIngredient[]
): DatabaseRecipeIngredient[] {
  const nonPantry = recipeIngredients.filter(
    (ingredient) => !ingredient.isOptional && !ingredient.isPantryStaple
  );

  if (nonPantry.length > 0) return nonPantry;
  return recipeIngredients.filter((ingredient) => !ingredient.isOptional);
}

export function getMissingIngredients(
  recipe: DatabaseRecipe,
  userIngredients: string[]
): string[] {
  const userIngredientSet = buildIngredientKeySet(userIngredients);

  return getRequiredIngredients(recipe.ingredients)
    .filter((ingredient) => !ingredientMatches(userIngredientSet, ingredient))
    .map((ingredient) => ingredient.name);
}

export function getMatchedIngredientNames(
  recipe: DatabaseRecipe,
  userIngredients: string[]
): string[] {
  const userIngredientSet = buildIngredientKeySet(userIngredients);
  if (userIngredientSet.size === 0) return [];

  return recipe.ingredients
    .filter((ingredient) => ingredientMatches(userIngredientSet, ingredient))
    .map((ingredient) => ingredient.name);
}

function calculateMatch(
  recipe: DatabaseRecipe,
  userIngredientValues: string[],
  userIngredients: Set<string>
): {
  ingredientCoverage: number;
  matchedIngredientCount: number;
  matchScore: number;
  missingIngredientCount: number;
} {
  if (userIngredients.size === 0) {
    return {
      ingredientCoverage: 0,
      matchedIngredientCount: 0,
      matchScore: 0,
      missingIngredientCount: 0,
    };
  }

  const ingredientCoverage = userIngredientValues.filter((userIngredient) => {
    const userIngredientKeys = buildIngredientKeySet([userIngredient]);
    return recipe.ingredients.some((ingredient) =>
      ingredientMatches(userIngredientKeys, ingredient)
    );
  }).length;

  const matchedIngredientCount = recipe.ingredients.filter((ingredient) =>
    ingredientMatches(userIngredients, ingredient)
  ).length;

  const requiredIngredients = getRequiredIngredients(recipe.ingredients);
  const matchedRequiredCount = requiredIngredients.filter((ingredient) =>
    ingredientMatches(userIngredients, ingredient)
  ).length;

  const matchScore =
    requiredIngredients.length === 0
      ? 0
      : matchedRequiredCount / requiredIngredients.length;

  return {
    ingredientCoverage,
    matchedIngredientCount,
    matchScore,
    missingIngredientCount: requiredIngredients.length - matchedRequiredCount,
  };
}

export function isExcluded(
  recipe: DatabaseRecipe,
  excludeNames: Set<string>,
  excludeIngredients: Set<string>
): boolean {
  const recipeNames = [recipe.name, recipe.slug].map(normalizeSearchText);
  if (recipeNames.some((name) => excludeNames.has(name))) return true;

  return recipe.ingredients.some((ingredient) =>
    ingredientMatches(excludeIngredients, ingredient)
  );
}

export function hasIngredientMatch(
  recipe: DatabaseRecipe,
  userIngredients: string[]
): boolean {
  const userIngredientKeys = buildIngredientKeySet(userIngredients);
  return recipe.ingredients.some((ingredient) =>
    ingredientMatches(userIngredientKeys, ingredient)
  );
}

function buildReason(
  recipe: DatabaseRecipe,
  matchedIngredientCount: number,
  missingIngredientCount: number,
  hasIngredientFilter: boolean
): string {
  if (hasIngredientFilter && matchedIngredientCount > 0) {
    const missingText =
      missingIngredientCount > 0
        ? `, ${missingIngredientCount} temel malzeme eksik olabilir`
        : "";
    return `${matchedIngredientCount} malzemen elinde var${missingText}`;
  }

  return `${recipe.category} kategorisinden uygun bir tarif`;
}

export function getRecommendations(
  request: RecommendationRequest = {}
): LocalDishSuggestion[] {
  const userIngredientValues = Array.from(
    new Set(
      (request.ingredients ?? [])
        .map(normalizeSearchText)
        .filter((ingredient) => ingredient.length > 0)
    )
  );
  const userIngredients = buildIngredientKeySet(userIngredientValues);
  const excludeNames = new Set(
    (request.excludeNames ?? [])
      .map(normalizeSearchText)
      .filter((name) => name.length > 0)
  );
  const excludeIngredients = new Set(
    (request.excludeIngredients ?? [])
      .map(normalizeSearchText)
      .filter((name) => name.length > 0)
  );

  const filters: RecipeSearchFilters = {
    maxTime: request.maxTime ?? null,
    cuisine: normalizeCuisine(request.cuisine),
    diet: toDietCode(request.diet),
    mealType: request.mealType?.trim() || undefined,
    cookingMethod: request.cookingMethod?.trim() || undefined,
  };

  const recipes = findRecipes(filters);
  const hasIngredientFilter = userIngredients.size > 0;
  const limit = Math.min(Math.max(Math.round(request.limit ?? DEFAULT_LIMIT), 1), 20);

  return recipes
    .filter((recipe) => !isExcluded(recipe, excludeNames, excludeIngredients))
    .map((recipe) => {
      const match = calculateMatch(recipe, userIngredientValues, userIngredients);
      return {
        recipe,
        ...match,
      };
    })
    // Dolap modunda alakasız tarifleri score ile listeye sokma.
    .filter(
      ({ matchedIngredientCount }) =>
        !hasIngredientFilter || matchedIngredientCount > 0
    )
    .map(
      ({
        recipe,
        ingredientCoverage,
        matchedIngredientCount,
        matchScore,
        missingIngredientCount,
      }) => ({
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      type: recipe.category,
      reason: buildReason(
        recipe,
        matchedIngredientCount,
        missingIngredientCount,
        hasIngredientFilter
      ),
      ingredientCoverage,
      matchedIngredientCount,
      matchScore,
      missingIngredientCount,
      timeMinutes: recipe.timeMinutes,
      })
    )
    .sort((a, b) => {
      if (hasIngredientFilter && b.ingredientCoverage !== a.ingredientCoverage) {
        return b.ingredientCoverage - a.ingredientCoverage;
      }
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (a.missingIngredientCount !== b.missingIngredientCount) {
        return a.missingIngredientCount - b.missingIngredientCount;
      }
      if (b.matchedIngredientCount !== a.matchedIngredientCount) {
        return b.matchedIngredientCount - a.matchedIngredientCount;
      }
      if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes;
      return a.name.localeCompare(b.name, "tr");
    })
    .slice(0, limit)
    .map((suggestion) => ({
      id: suggestion.id,
      slug: suggestion.slug,
      name: suggestion.name,
      type: suggestion.type,
      reason: suggestion.reason,
      ingredientCoverage: suggestion.ingredientCoverage,
      matchedIngredientCount: suggestion.matchedIngredientCount,
      matchScore: suggestion.matchScore,
      missingIngredientCount: suggestion.missingIngredientCount,
      timeMinutes: suggestion.timeMinutes,
    }));
}
