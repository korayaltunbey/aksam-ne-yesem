import { createArrayStore } from "./store";
import type { Recipe } from "./types";

export interface FavoriteRecipe {
  id: string;
  savedAt: string;
  recipe: Recipe;
}

function isValidFavorite(item: unknown): item is FavoriteRecipe {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  const recipe = record.recipe as Record<string, unknown> | undefined;
  return (
    typeof record.id === "string" &&
    typeof record.savedAt === "string" &&
    Number.isFinite(new Date(record.savedAt).getTime()) &&
    typeof recipe === "object" &&
    recipe !== null &&
    typeof recipe.name === "string" &&
    recipe.name.trim().length > 0
  );
}

const store = createArrayStore<FavoriteRecipe>({
  storageKey: "foof-favorites",
  changeEvent: "foof-favorites-changed",
  isValid: isValidFavorite,
});

export const getFavoritesSnapshot = store.getSnapshot;
export const getFavoritesServerSnapshot = store.getServerSnapshot;
export const subscribeFavorites = store.subscribe;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function isFavorite(name: string): boolean {
  return store.getSnapshot().some((item) => normalize(item.recipe.name) === normalize(name));
}

export function addFavorite(recipe: Recipe): void {
  if (isFavorite(recipe.name)) return;
  const item: FavoriteRecipe = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    recipe,
  };
  store.write([item, ...store.getSnapshot()].slice(0, 50));
}

export function removeFavorite(name: string): void {
  const key = normalize(name);
  store.write(
    store.getSnapshot().filter((item) => normalize(item.recipe.name) !== key)
  );
}

export function toggleFavorite(recipe: Recipe): boolean {
  if (isFavorite(recipe.name)) {
    removeFavorite(recipe.name);
    return false;
  }
  addFavorite(recipe);
  return true;
}
