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

export function addShoppingItems(items: ShoppingItem[]): void {
  const current = store.getSnapshot();
  const existing = new Set(current.map((item) => normalize(item.name)));
  const additions = items.filter((item) => {
    const key = normalize(item.name);
    if (!key || existing.has(key)) return false;
    existing.add(key);
    return true;
  });

  if (additions.length > 0) store.write([...current, ...additions]);
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
