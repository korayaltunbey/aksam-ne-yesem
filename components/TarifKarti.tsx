// Tarif kartı bileşeni: seçilen yemeğin tam tarifini gösterir.
// Başlık + meta rozetler (süre/zorluk/kişi), ölçeklenmiş malzeme listesi,
// eksik olabilecek malzemeler uyarısı, adım adım hazırlanış ve ipucu içerir.

"use client";

import type { Recipe } from "@/lib/types";
import { useSyncExternalStore } from "react";
import {
  getStepsServerSnapshot,
  getStepsSnapshot,
  resetRecipeSteps,
  subscribeSteps,
  toggleRecipeStep,
} from "@/lib/steps";

interface TarifKartiProps {
  recipe: Recipe; // gösterilecek tarif
}

// Zorluk seviyesine göre rozet renkleri (açık + koyu mod)
const DIFFICULTY_STYLES: Record<Recipe["difficulty"], string> = {
  Kolay: "border-emerald-600/50 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Orta: "border-amber-600/50 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Zor: "border-red-600/50 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

export default function TarifKarti({ recipe }: TarifKartiProps) {
  const stepProgress = useSyncExternalStore(
    subscribeSteps,
    getStepsSnapshot,
    getStepsServerSnapshot
  ).find(
    (item) =>
      item.recipeName.toLocaleLowerCase("tr-TR") ===
      recipe.name.toLocaleLowerCase("tr-TR")
  );
  const completedSteps = new Set(stepProgress?.completedSteps ?? []);

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg shadow-black/10 dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/30">
      {/* Başlık bandı: yemek adı + meta bilgiler */}
      <div className="border-b border-stone-800 bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-5 text-white">
        <h2 className="text-2xl font-bold">{recipe.name}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {/* Toplam süre */}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/25 px-2.5 py-1">
            &#9200; {recipe.timeMinutes} dk
          </span>
          {/* Zorluk rozeti */}
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 ${DIFFICULTY_STYLES[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
          {/* Kaç kişilik */}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/25 px-2.5 py-1">
            &#128100; {recipe.servings} kişilik
          </span>
          {recipe.mealType && (
            <span className="inline-flex items-center rounded-md bg-black/25 px-2.5 py-1">
              {recipe.mealType}
            </span>
          )}
          {recipe.cookingMethod && (
            <span className="inline-flex items-center rounded-md bg-black/25 px-2.5 py-1">
              {recipe.cookingMethod}
            </span>
          )}
          {recipe.budgetLevel && (
            <span className="inline-flex items-center rounded-md bg-black/25 px-2.5 py-1">
              Bütçe: {recipe.budgetLevel}
            </span>
          )}
          {recipe.estimatedCostPerServing !== undefined && (
            <span className="inline-flex items-center rounded-md bg-black/25 px-2.5 py-1">
              ~{recipe.estimatedCostPerServing} TL / porsiyon
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6 p-6">
        {(recipe.caloriesPerServing !== undefined ||
          recipe.proteinGrams !== undefined ||
          recipe.isFreezerFriendly) && (
          <section className="flex flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-300">
            {recipe.caloriesPerServing !== undefined && (
              <span className="rounded-md border border-stone-200 px-2.5 py-1 dark:border-stone-700">
                {recipe.caloriesPerServing} kcal / porsiyon
              </span>
            )}
            {recipe.proteinGrams !== undefined && (
              <span className="rounded-md border border-stone-200 px-2.5 py-1 dark:border-stone-700">
                {recipe.proteinGrams} g protein / porsiyon
              </span>
            )}
            {recipe.isFreezerFriendly && (
              <span className="rounded-md border border-stone-200 px-2.5 py-1 dark:border-stone-700">
                Dondurulabilir
              </span>
            )}
          </section>
        )}

        {/* Malzeme listesi: ölçüler sağa hizalı mono yazı tipinde */}
        <section>
          <h3 className="mb-2 text-xs font-bold text-stone-500 dark:text-stone-400">
            Malzemeler ({recipe.servings} kişilik ölçüler)
          </h3>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 py-2">
                <span className="text-sm text-stone-800 dark:text-stone-200">{ing.name}</span>
                <span className="font-mono text-xs font-semibold text-stone-500 dark:text-stone-400">
                  {ing.amount}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Dolap modunda kullanıcıda olmayabilecek malzemeler */}
        {recipe.missingIngredients.length > 0 && (
          <section className="rounded-lg border border-dashed border-orange-600/50 bg-orange-50 px-4 py-3 dark:border-orange-900 dark:bg-orange-950/40">
            <h3 className="mb-1 text-xs font-bold text-orange-700 dark:text-orange-300">
              &#9888; Eksik Olabilecek Malzemeler
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              {recipe.missingIngredients.join(", ")}
            </p>
          </section>
        )}

        {/* Adım adım hazırlanış: numaralı zaman çizelgesi */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400">
              Hazırlanışı ({completedSteps.size}/{recipe.steps.length})
            </h3>
            {completedSteps.size > 0 && (
              <button
                type="button"
                onClick={() => resetRecipeSteps(recipe.name)}
                className="text-[11px] font-semibold text-stone-400 transition hover:text-red-600 dark:hover:text-red-400"
              >
                Adımları Sıfırla
              </button>
            )}
          </div>
          <ol className="space-y-0">
            {recipe.steps.map((step, i) => (
              <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                {/* Adımlar arası dikey bağlantı çizgisi */}
                {i < recipe.steps.length - 1 && (
                  <span className="absolute left-[13px] top-7 h-full w-px bg-stone-200 dark:bg-stone-700" />
                )}
                <input
                  id={`recipe-step-${i}`}
                  type="checkbox"
                  checked={completedSteps.has(i)}
                  onChange={() => toggleRecipeStep(recipe.name, i)}
                  aria-label={`${i + 1}. adımı tamamlandı`}
                  className="mt-2 h-4 w-4 shrink-0 accent-orange-600"
                />
                <label
                  htmlFor={`recipe-step-${i}`}
                  className={`cursor-pointer text-sm leading-relaxed text-stone-700 dark:text-stone-300 ${
                    completedSteps.has(i) ? "text-stone-400 line-through dark:text-stone-500" : ""
                  }`}
                >
                  {step}
                </label>
              </li>
            ))}
          </ol>
        </section>

        {/* İsteğe bağlı ipucu notu */}
        {recipe.note && (
          <section className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/60">
            <h3 className="mb-1 text-xs font-bold text-stone-500 dark:text-stone-400">İpucu</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">{recipe.note}</p>
          </section>
        )}
      </div>
    </article>
  );
}
