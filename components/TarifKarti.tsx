// Tarif kartı bileşeni: seçilen yemeğin tam tarifini gösterir.
// Başlık + meta rozetler (süre/zorluk/kişi), ölçeklenmiş malzeme listesi,
// eksik olabilecek malzemeler uyarısı, adım adım hazırlanış ve ipucu içerir.

"use client";

import type { Recipe } from "@/lib/types";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getIngredientSubstitutes } from "@/lib/ingredient-substitutes";
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

function findStepMinutes(step: string): number | null {
  const match = step.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:dakika|dk)/i);
  if (!match) return null;
  return Number(match[2] ?? match[1]);
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

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
  const [cookingMode, setCookingMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [missingCopied, setMissingCopied] = useState(false);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const timer = window.setInterval(
      () => setTimerSeconds((seconds) => Math.max(seconds - 1, 0)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [timerSeconds]);

  useEffect(() => {
    setCookingMode(false);
    setActiveStep(0);
    setTimerSeconds(0);
  }, [recipe.name]);

  const currentStep = recipe.steps[activeStep] ?? recipe.steps[0];
  const suggestedMinutes = currentStep ? findStepMinutes(currentStep) : null;

  async function copyMissingIngredients() {
    const missing = new Set(recipe.missingIngredients);
    const text = recipe.ingredients
      .filter((ingredient) => missing.has(ingredient.name))
      .map((ingredient) => `- ${ingredient.name}: ${ingredient.amount}`)
      .join("\n");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(`EKSİK MALZEMELER\n${text}`);
      setMissingCopied(true);
      window.setTimeout(() => setMissingCopied(false), 2000);
    } catch {
      // Tarayıcının pano izni yoksa kullanıcı listeden seçerek kopyalayabilir.
    }
  }

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

        {recipe.matchedIngredients && recipe.matchedIngredients.length > 0 && (
          <section className="rounded-lg border border-emerald-600/30 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
            <h3 className="mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ✓ Bu tarifi neden görüyorsun?
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Dolabında bulunan: {recipe.matchedIngredients.join(", ")}
            </p>
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
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-orange-700 dark:text-orange-300">
                &#9888; Eksik Olabilecek Malzemeler
              </h3>
              <button
                type="button"
                onClick={copyMissingIngredients}
                className="rounded border border-orange-600/40 px-2 py-1 text-[11px] font-bold text-orange-700 transition hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/40"
              >
                {missingCopied ? "Kopyalandı" : "Listeyi Kopyala"}
              </button>
            </div>
            <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
              {recipe.missingIngredients.map((name) => {
                const substitutes = getIngredientSubstitutes(name);
                return (
                  <li key={name}>
                    <span className="font-semibold">{name}</span>
                    {substitutes.length > 0 && (
                      <span className="block text-xs text-orange-600/90 dark:text-orange-300/90">
                        Yerine: {substitutes[0].replacement}. {substitutes[0].note}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
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
          <div className="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                {cookingMode ? `Pişirme modu · Adım ${activeStep + 1}/${recipe.steps.length}` : "Adımları sırayla takip etmek için pişirme modunu aç."}
              </p>
              <button
                type="button"
                onClick={() => setCookingMode((value) => !value)}
                className="rounded border border-orange-600 px-2.5 py-1 text-[11px] font-bold text-orange-700 transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950"
              >
                {cookingMode ? "Pişirme Modunu Kapat" : "Pişirme Modunu Aç"}
              </button>
            </div>
            {cookingMode && currentStep && (
              <div className="mt-3">
                <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">{currentStep}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedMinutes && (
                    <button
                      type="button"
                      onClick={() => setTimerSeconds(suggestedMinutes * 60)}
                      className="rounded bg-orange-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-500"
                    >
                      {timerSeconds > 0 ? `Zamanlayıcı ${formatTimer(timerSeconds)}` : `${suggestedMinutes} dk zamanlayıcı başlat`}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((step) => Math.max(step - 1, 0))}
                    className="rounded border border-stone-300 px-2.5 py-1.5 text-xs font-bold text-stone-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300"
                  >
                    Önceki
                  </button>
                  <button
                    type="button"
                    disabled={activeStep === recipe.steps.length - 1}
                    onClick={() => setActiveStep((step) => Math.min(step + 1, recipe.steps.length - 1))}
                    className="rounded border border-stone-300 px-2.5 py-1.5 text-xs font-bold text-stone-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
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
