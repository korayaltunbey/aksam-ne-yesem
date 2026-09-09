import { createArrayStore } from "./store";

export interface ShoppingItem {
  name: string;
  amount: string;
  checked: boolean;
}

function isValidShoppingItem(item: unknown): item is ShoppingItem {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    record.name.trim().length > 0 &&
    typeof record.amount === "string" &&
    typeof record.checked === "boolean"
  );
}

const store = createArrayStore<ShoppingItem>({
  storageKey: "foof-shopping-list",
  changeEvent: "foof-shopping-list-changed",
  isValid: isValidShoppingItem,
});

export const getShoppingSnapshot = store.getSnapshot;
export const getShoppingServerSnapshot = store.getServerSnapshot;
export const subscribeShopping = store.subscribe;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function combineAmounts(current: string, added: string): string {
  const amountPattern = /^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/;
  const currentMatch = current.trim().match(amountPattern);
  const addedMatch = added.trim().match(amountPattern);

  if (!currentMatch || !addedMatch || normalize(currentMatch[2]) !== normalize(addedMatch[2])) {
    return current;
  }

  const currentQuantity = Number(currentMatch[1].replace(",", "."));
  const addedQuantity = Number(addedMatch[1].replace(",", "."));
  if (!Number.isFinite(currentQuantity) || !Number.isFinite(addedQuantity)) return current;

  const total = Math.round((currentQuantity + addedQuantity) * 100) / 100;
  return `${total.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currentMatch[2]}`;
}

export function addShoppingItems(items: ShoppingItem[]): void {
  const current = store.getSnapshot();
  const next = [...current];

  for (const item of items) {
    const key = normalize(item.name);
    if (!key) continue;
    const existingIndex = next.findIndex((candidate) => normalize(candidate.name) === key);
    if (existingIndex === -1) {
      next.push(item);
      continue;
    }

    const existing = next[existingIndex];
    next[existingIndex] = {
      ...existing,
      amount: combineAmounts(existing.amount, item.amount),
    };
  }

  store.write(next);
}

export function toggleShoppingItem(name: string): void {
  const key = normalize(name);
  store.write(
    store.getSnapshot().map((item) =>
      normalize(item.name) === key ? { ...item, checked: !item.checked } : item
    )
  );
}

export function removeShoppingItem(name: string): void {
  const key = normalize(name);
  store.write(
    store.getSnapshot().filter((item) => normalize(item.name) !== key)
  );
}

export function clearShoppingList(): void {
  store.write([]);
}
