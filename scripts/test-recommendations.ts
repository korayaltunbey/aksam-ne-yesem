import assert from "node:assert/strict";

import { getRecipeById, findRecipes } from "@/lib/recipe-repository";
import {
  getRecommendations,
  normalizeSearchText,
  toDietCode,
} from "@/lib/recommendations";
import { mapDatabaseRecipeToRecipe } from "@/lib/recipe-mapper";

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
