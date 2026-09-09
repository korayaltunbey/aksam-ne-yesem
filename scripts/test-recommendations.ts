import assert from "node:assert/strict";

import { getRecipeById, findRecipes } from "@/lib/recipe-repository";
import {
  getRecommendations,
  getMatchedIngredientNames,
  normalizeSearchText,
  toDietCode,
} from "@/lib/recommendations";
import { mapDatabaseRecipeToRecipe } from "@/lib/recipe-mapper";
import { parseSuggestionRequest } from "@/lib/requests";

function recipeFor(name: string) {
  const recipe = findRecipes().find((item) => item.name === name);
  assert.ok(recipe, `Database recipe not found: ${name}`);
  return recipe;
}

function hasIngredient(name: string, ingredientName: string) {
  const recipe = recipeFor(name);
  const normalizedIngredient = normalizeSearchText(ingredientName);
  return recipe.ingredients.some(
    (ingredient) => normalizeSearchText(ingredient.name) === normalizedIngredient
  );
}

// Katalogdaki her tarif, mutfakta uygulanabilir bir hazırlık adımı ve
// yeterli sayıda yapılış adımı içermeli.
const catalogRecipes = findRecipes();
assert.ok(catalogRecipes.length >= 256);
assert.ok(catalogRecipes.every((recipe) => recipe.steps.length >= 4));
assert.ok(
  catalogRecipes.every((recipe) =>
    recipe.steps[0]?.startsWith("Ön hazırlık:")
  )
);

const perdePilavi = recipeFor("Tavuklu Perde Pilavı");
assert.ok(perdePilavi.steps.length >= 10);
assert.ok(
  perdePilavi.steps.some((step) => step.includes("180 derece"))
);
assert.ok(
  catalogRecipes.every((recipe) =>
    recipe.steps.every(
      (step) => !step.includes("için malzemeleri hazırlayıp doğra")
    )
  )
);
const twoServingPerdePilavi = mapDatabaseRecipeToRecipe(perdePilavi, {
  servings: 2,
});
assert.equal(
  twoServingPerdePilavi.ingredients.find((item) => item.name === "Pirinç")?.amount,
  "yarım + çeyrek su bardağı"
);
assert.equal(
  twoServingPerdePilavi.ingredients.find((item) => item.name === "Toz biber")?.amount,
  "çeyrek tatlı kaşığı"
);
assert.ok(
  twoServingPerdePilavi.ingredients.every(
    (item) => !/(?:0,\d{2}|0\.\d{2}|¼|½|¾)/.test(item.amount)
  )
);

const fırındaSebzeliTavuk = recipeFor("Fırında Sebzeli Tavuk");
const twoServingFırındaSebzeliTavuk = mapDatabaseRecipeToRecipe(
  fırındaSebzeliTavuk,
  { servings: 2 }
);
assert.equal(
  twoServingFırındaSebzeliTavuk.ingredients.find(
    (item) => item.name === "Tavuk göğsü"
  )?.amount,
  "1 adet"
);
assert.ok(twoServingFırındaSebzeliTavuk.steps.length >= 6);
assert.ok(
  twoServingFırındaSebzeliTavuk.steps.some((step) => step.includes("200 derece"))
);
assert.ok(
  twoServingFırındaSebzeliTavuk.steps.some((step) => step.includes("pembe kalmayana"))
);
assert.ok(
  twoServingFırındaSebzeliTavuk.note?.includes("tek kat doldurmak")
);
assert.equal(
  twoServingFırındaSebzeliTavuk.ingredients.find(
    (item) => item.name === "Patates"
  )?.amount,
  "1 tam + yarım adet"
);

// Katalog tariflerinin temel miktarları 4 kişiliktir. Beş kişi seçildiğinde
// malzemeler 5 katına değil, 1,25 katına çıkmalı.
const sebzeliMercimekCorbasi = recipeFor("Sebzeli Mercimek Çorbası");
assert.equal(sebzeliMercimekCorbasi.baseServings, 4);
const fiveServingSebzeliMercimekCorbasi = mapDatabaseRecipeToRecipe(
  sebzeliMercimekCorbasi,
  { servings: 5 }
);
assert.equal(
  fiveServingSebzeliMercimekCorbasi.ingredients.find((item) => item.name === "Mercimek")?.amount,
  "1 tam + çeyrek su bardağı"
);
assert.equal(
  fiveServingSebzeliMercimekCorbasi.ingredients.find((item) => item.name === "Havuç")?.amount,
  "2 tam + yarım adet"
);
assert.equal(
  fiveServingSebzeliMercimekCorbasi.ingredients.find((item) => item.name === "Zeytinyağı")?.amount,
  "2 tam + yarım yemek kaşığı"
);
assert.equal(
  fiveServingSebzeliMercimekCorbasi.ingredients.find((item) => item.name === "Su")?.amount,
  "7 tam + yarım su bardağı"
);

const servingOptions = [1, 2, 3, 4, 5, 6, 8, 10];
for (const servings of servingOptions) {
  const scaledRecipe = mapDatabaseRecipeToRecipe(fırındaSebzeliTavuk, {
    servings,
  });
  assert.equal(scaledRecipe.servings, servings);
  assert.equal(scaledRecipe.ingredients.length, fırındaSebzeliTavuk.ingredients.length);
  assert.ok(scaledRecipe.ingredients.every((item) => item.amount.trim().length > 0));
}
assert.equal(
  mapDatabaseRecipeToRecipe(fırındaSebzeliTavuk, { servings: 1 }).ingredients.find(
    (item) => item.name === "Tavuk göğsü"
  )?.amount,
  "yarım adet"
);
assert.equal(
  mapDatabaseRecipeToRecipe(fırındaSebzeliTavuk, { servings: 3 }).ingredients.find(
    (item) => item.name === "Tavuk göğsü"
  )?.amount,
  "1 tam + yarım adet"
);
assert.equal(
  mapDatabaseRecipeToRecipe(fırındaSebzeliTavuk, { servings: 10 }).ingredients.find(
    (item) => item.name === "Tavuk göğsü"
  )?.amount,
  "5 adet"
);

for (const recipe of catalogRecipes) {
  assert.ok(recipe.baseServings > 0, `${recipe.name} için kişi sayısı geçersiz`);
  assert.ok(
    recipe.ingredients.every(
      (ingredient) =>
        (ingredient.quantity !== null && ingredient.quantity > 0) ||
        Boolean(ingredient.quantityText?.trim())
    ),
    `${recipe.name} tarifinde ölçüsüz malzeme var`
  );

  for (const servings of servingOptions) {
    const practicalRecipe = mapDatabaseRecipeToRecipe(recipe, { servings });
    assert.equal(practicalRecipe.servings, servings);
    assert.equal(practicalRecipe.ingredients.length, recipe.ingredients.length);
    assert.ok(
      practicalRecipe.ingredients.every(
        (item) =>
          item.amount.trim().length > 0 &&
          !/(?:0,\d{2}|0\.\d{2}|¼|½|¾)/.test(item.amount)
      ),
      `${recipe.name} tarifinde ${servings} kişilik mutfak dışı ölçü kaldı`
    );
  }
}

for (const [value, expected] of [[0, 1], [2.6, 3], [50, 20], ["geçersiz", 2]] as const) {
  const parsed = parseSuggestionRequest({ mode: "bana", servings: value });
  assert.equal(parsed.req?.servings, expected);
}

const volumeRecipe = catalogRecipes.find((recipe) =>
  recipe.ingredients.some((ingredient) =>
    ["mililitre", "ml", "litre"].includes(ingredient.unit)
  )
);
assert.ok(volumeRecipe, "Ölçü dönüşümünü doğrulayacak sıvı tarif bulunamadı");
const mappedVolumeRecipe = mapDatabaseRecipeToRecipe(volumeRecipe);
assert.ok(
  mappedVolumeRecipe.ingredients
    .filter((ingredient) => /(?:mililitre|ml|litre)/.test(ingredient.amount))
    .length === 0
);

function assertRecipeFilters(
  suggestions: ReturnType<typeof getRecommendations>,
  filters: { diet?: string; cuisine?: string; maxTime?: number }
) {
  for (const suggestion of suggestions) {
    const recipe = recipeFor(suggestion.name);
    if (filters.diet) {
      assert.ok(recipe.diets.includes(toDietCode(filters.diet) ?? ""));
    }
    if (filters.cuisine) assert.equal(recipe.cuisine, "Türk Mutfağı");
    if (filters.maxTime) assert.ok(recipe.timeMinutes <= filters.maxTime);
  }
}

// A: Seed kataloğunda bezelye yok; alakasız fallback dönmemeli.
const peaSuggestions = getRecommendations({ ingredients: ["bezelye"] });
assert.ok(peaSuggestions.length > 0);
assert.ok(peaSuggestions.every((item) => item.matchedIngredientCount > 0));
assert.ok(peaSuggestions.every((item) => hasIngredient(item.name, "bezelye")));

const quickPeaSuggestions = getRecommendations({ ingredients: ["Bezelye"] });
assert.deepEqual(
  quickPeaSuggestions.map((item) => item.name),
  peaSuggestions.map((item) => item.name)
);

const peaTomatoSuggestions = getRecommendations({
  ingredients: ["bezelye", "domates"],
  limit: 20,
});
assert.ok(peaTomatoSuggestions.length > 0);
assert.ok(
  peaTomatoSuggestions.every((item) => item.matchedIngredientCount > 0)
);
for (let index = 1; index < peaTomatoSuggestions.length; index += 1) {
  assert.ok(
    peaTomatoSuggestions[index - 1].ingredientCoverage >=
      peaTomatoSuggestions[index].ingredientCoverage
  );
}
const fullCoverageIndex = peaTomatoSuggestions.findIndex(
  (item) => item.ingredientCoverage === 2
);
const partialCoverageIndex = peaTomatoSuggestions.findIndex(
  (item) => item.ingredientCoverage === 1
);
assert.ok(fullCoverageIndex >= 0);
assert.ok(partialCoverageIndex >= 0);
assert.ok(fullCoverageIndex < partialCoverageIndex);
assert.ok(
  peaTomatoSuggestions.every((item) => item.ingredientCoverage > 0)
);
assert.ok(
  peaTomatoSuggestions.every(
    (item) => item.missingIngredientCount >= 0
  )
);
for (let index = 1; index < peaTomatoSuggestions.length; index += 1) {
  const previous = peaTomatoSuggestions[index - 1];
  const current = peaTomatoSuggestions[index];
  if (
    previous.ingredientCoverage === current.ingredientCoverage &&
    previous.matchScore === current.matchScore
  ) {
    assert.ok(
      previous.missingIngredientCount <= current.missingIngredientCount
    );
  }
}

const chickenSuggestions = getRecommendations({ ingredients: ["tavuk"] });
assert.ok(chickenSuggestions.length > 0);
assert.ok(
  chickenSuggestions.every((item) => item.matchedIngredientCount > 0)
);

const broccoliSoup = recipeFor("Brokoli Çorbası");
assert.ok(getMatchedIngredientNames(broccoliSoup, ["brokoli"]).includes("Brokoli"));

// Pozitif ingredient eşleşmesi ve basit çoğul varyasyonu.
const tomatoSuggestions = getRecommendations({ ingredients: ["domates"] });
assert.ok(tomatoSuggestions.length > 0);
assert.ok(tomatoSuggestions.every((item) => item.matchedIngredientCount > 0));
const pluralTomatoSuggestions = getRecommendations({ ingredients: ["domatesler"] });
assert.ok(pluralTomatoSuggestions.length > 0);
assert.ok(
  pluralTomatoSuggestions.every((item) => item.matchedIngredientCount > 0)
);

// B: Diet hard filter.
const vegetarianSuggestions = getRecommendations({
  ingredients: ["domates"],
  diet: "Vejetaryen",
});
assertRecipeFilters(vegetarianSuggestions, { diet: "Vejetaryen" });

const veganSuggestions = getRecommendations({
  ingredients: ["mercimek"],
  diet: "Vegan",
});
assert.ok(veganSuggestions.length > 0);
assertRecipeFilters(veganSuggestions, { diet: "Vegan" });

// C: Cuisine hard filter; seed'de yalnızca Türk Mutfağı var.
const turkishSuggestions = getRecommendations({
  ingredients: ["domates"],
  cuisine: "Türk mutfağı",
});
assertRecipeFilters(turkishSuggestions, { cuisine: "Türk mutfağı" });
const italianSuggestions = getRecommendations({
  ingredients: ["domates"],
  cuisine: "İtalyan mutfağı",
});
assert.ok(italianSuggestions.length > 0);
assert.ok(
  italianSuggestions.every(
    (item) => recipeFor(item.name).cuisine === "İtalyan mutfağı"
  )
);

// D: Time hard filter.
const quickSuggestions = getRecommendations({
  ingredients: ["domates"],
  maxTime: 30,
});
assertRecipeFilters(quickSuggestions, { maxTime: 30 });

// E: Combined hard filters plus ingredient existence.
const combinedSuggestions = getRecommendations({
  ingredients: ["domates"],
  diet: "Vejetaryen",
  cuisine: "Türk mutfağı",
  maxTime: 30,
});
assert.ok(combinedSuggestions.length > 0);
assert.ok(combinedSuggestions.every((item) => item.matchedIngredientCount > 0));
assertRecipeFilters(combinedSuggestions, {
  diet: "Vejetaryen",
  cuisine: "Türk mutfağı",
  maxTime: 30,
});

// Formdaki her tekil filtre tercihi en az beş gerçek tarif bulabilmeli.
// Bu kontrol, katalog büyütülürken bir seçeneğin boşa düşmesini engeller.
type CoverageCheck = {
  label: string;
  request: Parameters<typeof getRecommendations>[0];
  matches: (recipe: ReturnType<typeof recipeFor>) => boolean;
};

const coverageChecks: CoverageCheck[] = [
  ...["Kahvaltı", "Öğle", "Akşam", "Atıştırmalık", "Tatlı"].map(
    (mealType) => ({
      label: `Öğün: ${mealType}`,
      request: { mealType },
      matches: (recipe: ReturnType<typeof recipeFor>) =>
        recipe.mealType === mealType,
    })
  ),
  ...[15, 30, 45, 60].map((maxTime) => ({
    label: `Süre: ${maxTime} dk`,
    request: { maxTime },
    matches: (recipe: ReturnType<typeof recipeFor>) =>
      recipe.timeMinutes <= maxTime,
  })),
  ...["Tencere", "Tava", "Fırın", "Pişirme yok"].map(
    (cookingMethod) => ({
      label: `Pişirme yöntemi: ${cookingMethod}`,
      request: { cookingMethod },
      matches: (recipe: ReturnType<typeof recipeFor>) =>
        recipe.cookingMethod === cookingMethod,
    })
  ),
  ...["Düşük", "Orta", "Yüksek"].map((budgetLevel) => ({
    label: `Bütçe: ${budgetLevel}`,
    request: { budgetLevel },
    matches: (recipe: ReturnType<typeof recipeFor>) =>
      recipe.budgetLevel === budgetLevel,
  })),
];

for (const { label, request, matches } of coverageChecks) {
  const suggestions = getRecommendations(request);
  assert.equal(suggestions.length, 5, `${label} için beş öneri bekleniyor`);
  assert.ok(
    suggestions.every((suggestion) => matches(recipeFor(suggestion.name))),
    `${label} filtresine uymayan bir tarif döndü`
  );
}

// F: Bana Öner modunda ingredient hard filter uygulanmaz; diğer filtreler uygulanır.
const generalSuggestions = getRecommendations({
  diet: "Vejetaryen",
  cuisine: "Türk mutfağı",
  maxTime: 30,
});
assert.ok(generalSuggestions.length > 0);
assert.ok(generalSuggestions.every((item) => item.matchedIngredientCount === 0));
assertRecipeFilters(generalSuggestions, {
  diet: "Vejetaryen",
  cuisine: "Türk mutfağı",
  maxTime: 30,
});

// Exclusion kuralları.
const excludedName = tomatoSuggestions[0].name;
assert.ok(
  !getRecommendations({
    ingredients: ["domates"],
    excludeNames: [excludedName],
  }).some((item) => item.name === excludedName)
);
const noTomatoSuggestions = getRecommendations({
  excludeIngredients: ["domates"],
});
assert.ok(
  noTomatoSuggestions.every((suggestion) => {
    const recipe = recipeFor(suggestion.name);
    return recipe.ingredients.every(
      (ingredient) => normalizeSearchText(ingredient.name) !== "domates"
    );
  })
);

// Porsiyon ölçekleme: Menemen 2 kişilik seed tarifidir.
const menemen = getRecipeById(1);
assert.ok(menemen);
const fourServingRecipe = mapDatabaseRecipeToRecipe(menemen, { servings: 4 });
const tenServingRecipe = mapDatabaseRecipeToRecipe(menemen, { servings: 10 });
assert.equal(tenServingRecipe.estimatedCostPerServing, 35);
assert.equal(
  fourServingRecipe.ingredients.find((item) => item.name === "Yumurta")?.amount,
  "8 adet"
);
assert.equal(
  tenServingRecipe.ingredients.find((item) => item.name === "Yumurta")?.amount,
  "20 adet"
);

console.log("Recommendation tests passed.");
