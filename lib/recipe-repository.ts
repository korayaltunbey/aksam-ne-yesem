import { and, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  ingredients,
  recipeDiets,
  recipeIngredients,
  recipeSteps,
  recipes,
} from "@/db/schema";
import type { Difficulty } from "@/lib/types";

export interface DatabaseRecipeIngredient {
  ingredientId: number;
  name: string;
  normalizedName: string;
  quantity: number | null;
  unit: string;
  quantityText: string | null;
  preparation: string | null;
  isOptional: boolean;
  isPantryStaple: boolean;
}

export interface DatabaseRecipe {
  id: number;
  slug: string;
  name: string;
  category: string;
  cuisine: string | null;
  mealType: string | null;
  cookingMethod: string | null;
  caloriesPerServing: number | null;
  proteinGrams: number | null;
  isFreezerFriendly: boolean;
  timeMinutes: number;
  difficulty: Difficulty;
  baseServings: number;
  note: string | null;
  ingredients: DatabaseRecipeIngredient[];
  steps: string[];
  diets: string[];
}

export interface RecipeSearchFilters {
  maxTime?: number | null;
  cuisine?: string;
  diet?: string;
  mealType?: string;
  cookingMethod?: string;
}

function loadRecipe(id: number): DatabaseRecipe | null {
  const row = db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      name: recipes.name,
      category: recipes.category,
      cuisine: recipes.cuisine,
      mealType: recipes.mealType,
      cookingMethod: recipes.cookingMethod,
      caloriesPerServing: recipes.caloriesPerServing,
      proteinGrams: recipes.proteinGrams,
      isFreezerFriendly: recipes.isFreezerFriendly,
      timeMinutes: recipes.timeMinutes,
      difficulty: recipes.difficulty,
      baseServings: recipes.baseServings,
      note: recipes.note,
    })
    .from(recipes)
    .where(eq(recipes.id, id))
    .all()[0];

  if (!row) return null;

  const ingredientRows = db
    .select({
      ingredientId: recipeIngredients.ingredientId,
      name: ingredients.name,
      normalizedName: ingredients.normalizedName,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      quantityText: recipeIngredients.quantityText,
      preparation: recipeIngredients.preparation,
      isOptional: recipeIngredients.isOptional,
      isPantryStaple: ingredients.isPantryStaple,
    })
    .from(recipeIngredients)
    .innerJoin(
      ingredients,
      eq(recipeIngredients.ingredientId, ingredients.id)
    )
    .where(eq(recipeIngredients.recipeId, id))
    .all();

  const stepRows = db
    .select({ instruction: recipeSteps.instruction })
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, id))
    .orderBy(recipeSteps.stepOrder)
    .all();

  const dietRows = db
    .select({ diet: recipeDiets.diet })
    .from(recipeDiets)
    .where(eq(recipeDiets.recipeId, id))
    .all();

  return {
    ...row,
    difficulty: row.difficulty as Difficulty,
    ingredients: ingredientRows,
    steps: stepRows.map((step) => step.instruction),
    diets: dietRows.map((item) => item.diet),
  };
}

export function getRecipeById(id: number): DatabaseRecipe | null {
  return loadRecipe(id);
}

export function getRecipeBySlug(slug: string): DatabaseRecipe | null {
  const row = db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.slug, slug))
    .all()[0];

  return row ? loadRecipe(row.id) : null;
}

export function findRecipes(
  filters: RecipeSearchFilters = {}
): DatabaseRecipe[] {
  const conditions = [eq(recipes.isActive, true)];

  if (filters.maxTime !== null && filters.maxTime !== undefined) {
    conditions.push(lte(recipes.timeMinutes, filters.maxTime));
  }

  if (filters.cuisine) {
    conditions.push(eq(recipes.cuisine, filters.cuisine));
  }

  if (filters.mealType) {
    conditions.push(eq(recipes.mealType, filters.mealType));
  }

  if (filters.cookingMethod) {
    conditions.push(eq(recipes.cookingMethod, filters.cookingMethod));
  }

  if (filters.diet) {
    const dietRecipeIds = db
      .select({ recipeId: recipeDiets.recipeId })
      .from(recipeDiets)
      .where(eq(recipeDiets.diet, filters.diet))
      .all()
      .map((item) => item.recipeId);

    if (dietRecipeIds.length === 0) return [];
    conditions.push(inArray(recipes.id, dietRecipeIds));
  }

  const rows = db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(...conditions))
    .all();

  return rows
    .map((row) => loadRecipe(row.id))
    .filter((recipe): recipe is DatabaseRecipe => recipe !== null);
}
