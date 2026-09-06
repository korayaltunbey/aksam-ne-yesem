import { createArrayStore } from "./store";

export interface RecipeStepProgress {
  recipeName: string;
  completedSteps: number[];
}

function isValidProgress(item: unknown): item is RecipeStepProgress {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.recipeName === "string" &&
    record.recipeName.trim().length > 0 &&
    Array.isArray(record.completedSteps) &&
    record.completedSteps.every(
      (step) => Number.isInteger(step) && (step as number) >= 0
    )
  );
}

const store = createArrayStore<RecipeStepProgress>({
  storageKey: "foof-recipe-steps",
  changeEvent: "foof-recipe-steps-changed",
  isValid: isValidProgress,
});

export const getStepsSnapshot = store.getSnapshot;
export const getStepsServerSnapshot = store.getServerSnapshot;
export const subscribeSteps = store.subscribe;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function toggleRecipeStep(recipeName: string, stepIndex: number): void {
  const key = normalize(recipeName);
  const current = store.getSnapshot();
  const existing = current.find((item) => normalize(item.recipeName) === key);
  const completed = new Set(existing?.completedSteps ?? []);

  if (completed.has(stepIndex)) completed.delete(stepIndex);
  else completed.add(stepIndex);

  const nextItem = {
    recipeName: recipeName.trim(),
    completedSteps: Array.from(completed).sort((a, b) => a - b),
  };
  store.write([
    nextItem,
    ...current.filter((item) => normalize(item.recipeName) !== key),
  ]);
}

export function resetRecipeSteps(recipeName: string): void {
  const key = normalize(recipeName);
  store.write(
    store.getSnapshot().filter((item) => normalize(item.recipeName) !== key)
  );
}
