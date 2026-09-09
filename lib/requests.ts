// API route'larına gelen istek gövdelerini doğrulayan yardımcılar.
// Kullanıcı tarafından gönderilebilecek geçersiz/zararlı verilere karşı
// ortak bir "temizleme + sınırlama" katmanı sağlar.

import type { SuggestionMode, SuggestionRequest } from "./types";

// Ortak istek gövdesini doğrular ve güvenli bir SuggestionRequest nesnesine çevirir.
// Hatalı durumda { error } döner; başarılıysa { req } döner.
export function parseSuggestionRequest(body: unknown): {
  req?: SuggestionRequest;
  error?: string;
} {
  // Gövde bir JSON nesnesi olmalı
  if (typeof body !== "object" || body === null) {
    return { error: "Geçersiz istek gövdesi" };
  }
  const b = body as Record<string, unknown>;

  // Mod yalnızca bilinen iki değerden biri olabilir, aksi halde dolap varsayılır
  const mode: SuggestionMode =
    b.mode === "bana" || b.mode === "dolap" ? b.mode : "dolap";

  // Malzemeler: yalnızca metin olarak kabul et, boşları at
  const ingredients = Array.isArray(b.ingredients)
    ? b.ingredients
        .filter((ingredient): ingredient is string => typeof ingredient === "string")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)
        .slice(0, 100)
    : [];

  // Kişi sayısı yalnızca 1-20 arasındaki tam sayı olabilir.
  const requestedServings = Number(b.servings);
  const servings = Number.isFinite(requestedServings)
    ? Math.min(Math.max(Math.round(requestedServings), 1), 20)
    : 2;
  const diet = typeof b.diet === "string" ? b.diet.trim() : "";
  const mealType = typeof b.mealType === "string" ? b.mealType.trim() : "";
  const cookingMethod =
    typeof b.cookingMethod === "string" ? b.cookingMethod.trim() : "";

  // Maksimum süre pozitif sayıysa kabul edilir, değilse boş
  const maxTime =
    Number.isFinite(Number(b.maxTime)) && Number(b.maxTime) > 0
      ? Number(b.maxTime)
      : null;
  const cuisine = typeof b.cuisine === "string" ? b.cuisine.trim() : "";

  // Dışlama listeleri: yalnızca metin dizi kabul edilir, en fazla 50 kayıt
  const stringList = (value: unknown, limit = 50): string[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((v) => v.length > 0)
          .slice(0, limit)
      : [];

  const excludeNames = stringList(b.excludeNames);
  const excludeMadeNames = stringList(b.excludeMadeNames);
  const excludeIngredients = stringList(b.excludeIngredients);

  // Dolap modunda en az bir malzeme şart
  if (mode === "dolap" && ingredients.length === 0) {
    return { error: "En az bir malzeme girin." };
  }

  return {
    req: {
      mode,
      ingredients,
      servings,
      diet,
      mealType,
      cookingMethod,
      maxTime,
      cuisine,
      excludeNames,
      excludeMadeNames,
      excludeIngredients,
    },
  };
}

// Tarif isteği: ortak doğrulamaya ek olarak seçilen yemeğin adını ister.
export function parseRecipeRequest(body: unknown): {
  req?: SuggestionRequest;
  dishName?: string;
  error?: string;
} {
  // Önce ortak alanları doğrula
  const parsed = parseSuggestionRequest(body);
  if (parsed.error || !parsed.req) {
    return { error: parsed.error };
  }
  // Seçilen yemek adı boş olamaz
  const b = body as Record<string, unknown>;
  const dishName = typeof b.dishName === "string" ? b.dishName.trim() : "";
  if (!dishName) {
    return { error: "Bir yemek seçmelisin." };
  }
  return { req: parsed.req, dishName };
}
