import { createArrayStore } from "./store";
import type { Recipe } from "./types";

export const PLAN_DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export type PlanDay = (typeof PLAN_DAYS)[number];

export interface PlannedRecipe {
  day: PlanDay;
  recipe: Recipe;
}

function isValidPlannedRecipe(item: unknown): item is PlannedRecipe {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  const recipe = record.recipe as Record<string, unknown> | undefined;
  return (
    typeof record.day === "string" &&
    PLAN_DAYS.includes(record.day as PlanDay) &&
    typeof recipe === "object" &&
    recipe !== null &&
    typeof recipe.name === "string" &&
    recipe.name.trim().length > 0
  );
}

const store = createArrayStore<PlannedRecipe>({
  storageKey: "foof-week-plan",
  changeEvent: "foof-week-plan-changed",
  isValid: isValidPlannedRecipe,
});

export const getPlanSnapshot = store.getSnapshot;
export const getPlanServerSnapshot = store.getServerSnapshot;
export const subscribePlan = store.subscribe;

export function setPlannedRecipe(day: PlanDay, recipe: Recipe): void {
  store.write([
    { day, recipe },
    ...store.getSnapshot().filter((item) => item.day !== day),
  ]);
}

export function removePlannedRecipe(day: PlanDay): void {
  store.write(store.getSnapshot().filter((item) => item.day !== day));
}
