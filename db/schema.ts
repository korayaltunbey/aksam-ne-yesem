import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const recipes = sqliteTable(
  "recipes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    cuisine: text("cuisine"),
    mealType: text("meal_type"),
    cookingMethod: text("cooking_method"),
    caloriesPerServing: integer("calories_per_serving"),
    proteinGrams: real("protein_grams"),
    isFreezerFriendly: integer("is_freezer_friendly", { mode: "boolean" })
      .notNull()
      .default(false),
    timeMinutes: integer("time_minutes").notNull(),
    difficulty: text("difficulty").notNull(),
    baseServings: integer("base_servings").notNull(),
    note: text("note"),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("recipes_slug_unique").on(table.slug),
    index("recipes_active_category_idx").on(table.isActive, table.category),
    index("recipes_active_cuisine_idx").on(table.isActive, table.cuisine),
    index("recipes_active_meal_type_idx").on(table.isActive, table.mealType),
    index("recipes_active_cooking_method_idx").on(
      table.isActive,
      table.cookingMethod
    ),
    index("recipes_active_time_idx").on(table.isActive, table.timeMinutes),
    check("recipes_time_positive", sql`${table.timeMinutes} > 0`),
    check("recipes_servings_positive", sql`${table.baseServings} > 0`),
    check(
      "recipes_difficulty_valid",
      sql`${table.difficulty} IN ('Kolay', 'Orta', 'Zor')`
    ),
  ]
);

export const ingredients = sqliteTable(
  "ingredients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    isPantryStaple: integer("is_pantry_staple", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    uniqueIndex("ingredients_normalized_name_unique").on(
      table.normalizedName
    ),
  ]
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    ingredientId: integer("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "restrict" }),
    quantity: real("quantity"),
    unit: text("unit").notNull(),
    quantityText: text("quantity_text"),
    preparation: text("preparation"),
    isOptional: integer("is_optional", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.ingredientId] }),
    index("recipe_ingredients_ingredient_idx").on(table.ingredientId),
    index("recipe_ingredients_recipe_idx").on(table.recipeId),
    check(
      "recipe_ingredients_quantity_present",
      sql`${table.quantity} IS NOT NULL OR ${table.quantityText} IS NOT NULL`
    ),
    check(
      "recipe_ingredients_quantity_positive",
      sql`${table.quantity} IS NULL OR ${table.quantity} > 0`
    ),
  ]
);

export const recipeSteps = sqliteTable(
  "recipe_steps",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    instruction: text("instruction").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.stepOrder] }),
    index("recipe_steps_recipe_idx").on(table.recipeId, table.stepOrder),
    check("recipe_steps_order_positive", sql`${table.stepOrder} > 0`),
  ]
);

export const recipeDiets = sqliteTable(
  "recipe_diets",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    diet: text("diet").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.diet] }),
    index("recipe_diets_diet_idx").on(table.diet),
  ]
);
