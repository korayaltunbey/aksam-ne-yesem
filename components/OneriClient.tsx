// /oneri sayfasının istemci tarafı: öneri akışının kalbi.
// İki adımlı çalışır:
//   1) Form gönderilir -> /api/suggest -> 5 farklı yemek listesi gösterilir
//   2) Bir yemeğe tıklanır -> /api/recipe -> tam tarif kartı açılır
// Ayrıca mod değişimi URL'e yansıtılır (router.replace) ve tekrar önerilen
// yemeklerin geçmişe eklenmesi burada yönetilir.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { DishSuggestion, Recipe, SuggestionMode } from "@/lib/types";
import { addToHistory } from "@/lib/history"; // tarif kaydetme
import { addShoppingItems } from "@/lib/shopping";
import {
  addFavorite,
  getFavoritesServerSnapshot,
  getFavoritesSnapshot,
  removeFavorite,
  subscribeFavorites,
} from "@/lib/favorites";
import {
  PLAN_DAYS,
  setPlannedRecipe,
  type PlanDay,
} from "@/lib/week-plan";
import {
  getMadeSnapshot,
  getMadeServerSnapshot,
  subscribeMade,
  addMadeDish,
} from "@/lib/made"; // "yaptığım yemekler" deposu
import {
  getSuggestedSnapshot,
  getSuggestedServerSnapshot,
  subscribeSuggested,
  addSuggestedNames,
} from "@/lib/suggested"; // tekrar engelleme deposu
import MalzemeGirisi from "@/components/MalzemeGirisi";
import TarifKarti from "@/components/TarifKarti";

// Diyet tercihi seçenekleri (boş = fark etmez)
const DIET_OPTIONS = [
  "",
  "Vejetaryen",
  "Vegan",
  "Glutensiz",
  "Düşük karbonhidrat",
  "Düşük kalorili",
];

// Süre seçenekleri
const TIME_OPTIONS = [
  { value: "", label: "Süre fark etmez" },
  { value: "15", label: "En fazla 15 dk" },
  { value: "30", label: "En fazla 30 dk" },
  { value: "45", label: "En fazla 45 dk" },
  { value: "60", label: "En fazla 60 dk" },
];

// Mutfak/yöre seçenekleri
const CUISINE_OPTIONS = [
  "",
  "Türk mutfağı",
  "İtalyan mutfağı",
  "Asya mutfağı",
  "Meksika mutfağı",
  "Akdeniz mutfağı",
];

const MEAL_TYPE_OPTIONS = ["", "Kahvaltı", "Öğle", "Akşam", "Atıştırmalık", "Tatlı"];
const COOKING_METHOD_OPTIONS = ["", "Tencere", "Tava", "Fırın", "Pişirme yok"];
const BUDGET_OPTIONS = ["", "Düşük", "Orta", "Yüksek"];

// Form seçim kutularının ortak görünümü
const SELECT_CLASS =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

// Form alanı etiketlerinin ortak görünümü
const LABEL_CLASS = "mb-1.5 block text-xs font-bold text-stone-500 dark:text-stone-400";

interface OneriClientProps {
  initialMode: SuggestionMode; // URL'den gelen başlangıç modu
  initialFavoriteName?: string;
}

// Liste sırasını bozmadan, harf duyarsız tekrarları temizler
function dedupeIgnoreCase(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }
  return result;
}

export default function OneriClient({
  initialMode,
  initialFavoriteName,
}: OneriClientProps) {
  const router = useRouter(); // URL'i güncellemek için

  // İki dışlama deposunu React'e bağla
  const made = useSyncExternalStore(subscribeMade, getMadeSnapshot, getMadeServerSnapshot);
  const suggested = useSyncExternalStore(
    subscribeSuggested,
    getSuggestedSnapshot,
    getSuggestedServerSnapshot
  );
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot
  );

  // Form durumu
  const [mode, setMode] = useState<SuggestionMode>(initialMode);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [servings, setServings] = useState(2);
  const [diet, setDiet] = useState("");
  const [mealType, setMealType] = useState("");
  const [cookingMethod, setCookingMethod] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("");
  const [maxTime, setMaxTime] = useState("");
  const [cuisine, setCuisine] = useState("");

  // Öneri listesi durumu
  const [suggestions, setSuggestions] = useState<DishSuggestion[] | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  // Seçilen tarif durumu
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");

  // Aksiyon geri bildirimleri
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [madeAdded, setMadeAdded] = useState(false);
  const [shoppingAdded, setShoppingAdded] = useState(false);
  const [planDay, setPlanDay] = useState<PlanDay>("Pazartesi");
  const [planAdded, setPlanAdded] = useState(false);

  // Dışlama listesi = "yaptığım yemekler" + daha önce önerilenler.
  // useMemo: her render'da yeni dizi referansı üretmeyip useCallback bağımlılıklarını
  // stabil tutar (gereksiz yeniden render ve eski değerle istek atma riskini önler).
  const excludeNames = useMemo(
    () => dedupeIgnoreCase([...made, ...suggested]),
    [made, suggested]
  );

  // 1. Adım: 5 yemeklik listeyi üretir
  const generateList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    setSuggestions(null);
    setRecipe(null);
    setRecipeError("");
    setCopied(false);
    setSaved(false);
    setMadeAdded(false);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ingredients,
          servings,
          diet,
          mealType,
          cookingMethod,
          budgetLevel,
          maxTime: maxTime ? Number(maxTime) : null,
          cuisine,
          excludeNames,
          excludeMadeNames: made,
          excludeIngredients: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bir sorun oluştu, tekrar dene.");
      }
      // API beklenen yapıyı döndürmediyse anlamlı bir hata göster
      if (!Array.isArray(data.suggestions)) {
        throw new Error("Öneri listesi alınamadı, tekrar dene.");
      }
      const list = data.suggestions as DishSuggestion[];
      setSuggestions(list);
      // Gelen yemekleri tekrar engelleme geçmişine ekle
      addSuggestedNames(list.map((s) => s.name));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Bir sorun oluştu.");
    } finally {
      setListLoading(false);
    }
  }, [mode, ingredients, servings, diet, mealType, cookingMethod, budgetLevel, maxTime, cuisine, excludeNames, made]);

  // 2. Adım: seçilen yemeğin tam tarifini üretir
  const selectDish = useCallback(
    async (dishName: string) => {
      setRecipeLoading(true);
      setRecipe(null);
      setRecipeError("");
      setCopied(false);
      setSaved(false);
      setMadeAdded(false);

      try {
        const res = await fetch("/api/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            ingredients,
            servings,
            diet,
            mealType,
            cookingMethod,
            budgetLevel,
            maxTime: maxTime ? Number(maxTime) : null,
            cuisine,
            // Seçilen yemeğin kendisini dışlamadan gönder
            excludeNames: excludeNames.filter((n) => n.toLowerCase() !== dishName.toLowerCase()),
            excludeMadeNames: made,
            excludeIngredients: [],
            dishName,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Tarif alınamadı, tekrar dene.");
        }
        // API beklenen yapıyı döndürmediyse anlamlı bir hata göster
        if (!data.recipe || typeof data.recipe !== "object") {
          throw new Error("Tarif alınamadı, tekrar dene.");
        }
        setRecipe(data.recipe as Recipe);
      } catch (err) {
        setRecipeError(err instanceof Error ? err.message : "Bir sorun oluştu.");
      } finally {
        setRecipeLoading(false);
      }
    },
    [mode, ingredients, servings, diet, mealType, cookingMethod, budgetLevel, maxTime, cuisine, excludeNames, made]
  );

  // Form gönderimi: moda göre geçerli mi kontrol et ve listeyi üret
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "dolap" && ingredients.length === 0) {
      setListError("En az bir malzeme girmelisin.");
      return;
    }
    generateList();
  }

  // Mod değiştirici: durumu günceller ve URL'i senkronize eder
  function switchMode(next: SuggestionMode) {
    setMode(next);
    router.replace(`/oneri?mode=${next}`, { scroll: false });
  }

  // Tarifi kopyalanabilir metin olarak panoya yazar
  async function handleCopy() {
    if (!recipe) return;
    const text = [
      `${recipe.name} (${recipe.servings} kişilik, ${recipe.timeMinutes} dk)`,
      "",
      "MALZEMELER",
      ...recipe.ingredients.map((i) => `- ${i.name}: ${i.amount}`),
      recipe.missingIngredients.length > 0
        ? ["", "EKSİK OLABİLECEK MALZEMELER", ...recipe.missingIngredients.map((m) => `- ${m}`)]
        : [],
      "",
      "HAZIRLANIŞI",
      ...recipe.steps.map((s, i) => `${i + 1}. ${s}`),
    ]
      .flat()
      .join("\n");

    try {
      // Panoya erişim mümkünse kopyala; değilse eski yöntemle geri dönüş yap
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // pano erişimi başarısız olabilir
    }
  }

  // Tarifi "Son önerilerim" geçmişine kaydeder
  function handleSave() {
    if (!recipe) return;
    addToHistory(mode, recipe);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Tarifi "yaptığım yemekler" listesine ekler (bir daha önerilmez)
  function handleMade() {
    if (!recipe) return;
    addMadeDish(recipe.name);
    setMadeAdded(true);
    setTimeout(() => setMadeAdded(false), 2000);
  }

  function handleAddMissingToShoppingList() {
    if (!recipe || recipe.missingIngredients.length === 0) return;
    const missing = new Set(recipe.missingIngredients);
    addShoppingItems(
      recipe.ingredients
        .filter((ingredient) => missing.has(ingredient.name))
        .map((ingredient) => ({
          name: ingredient.name,
          amount: ingredient.amount,
          checked: false,
        }))
    );
    setShoppingAdded(true);
    setTimeout(() => setShoppingAdded(false), 2000);
  }

  const favoriteActive = recipe
    ? favorites.some((item) => item.recipe.name.toLocaleLowerCase("tr-TR") === recipe.name.toLocaleLowerCase("tr-TR"))
    : false;

  useEffect(() => {
    if (!initialFavoriteName || recipe) return;
    const favorite = favorites.find(
      (item) =>
        item.recipe.name.toLocaleLowerCase("tr-TR") ===
        initialFavoriteName.toLocaleLowerCase("tr-TR")
    );
    if (!favorite) return;
    const timeoutId = window.setTimeout(() => {
      setRecipe(favorite.recipe);
      setSuggestions(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [favorites, initialFavoriteName, recipe]);

  function handleFavorite() {
    if (!recipe) return;
    if (favoriteActive) {
      removeFavorite(recipe.name);
    } else {
      addFavorite(recipe);
    }
  }

  function handleAddToPlan() {
    if (!recipe) return;
    setPlannedRecipe(planDay, recipe);
    setPlanAdded(true);
    setTimeout(() => setPlanAdded(false), 2000);
  }

  function renderPlanControls() {
    if (!recipe) return null;
    return (
      <div className="flex gap-2">
        <select
          aria-label="Plan günü"
          value={planDay}
          onChange={(event) => setPlanDay(event.target.value as PlanDay)}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-xs text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        >
          {PLAN_DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddToPlan}
          className="flex-1 rounded-lg border border-violet-600 px-3 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
        >
          {planAdded ? "Plana Eklendi" : "Haftalık Plana Ekle"}
        </button>
      </div>
    );
  }

  if (initialFavoriteName) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-stone-500 transition hover:text-orange-600 dark:text-stone-400 dark:hover:text-orange-400"
        >
          &larr; Ana Sayfaya Dön
        </Link>

        {recipeLoading && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white p-8 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Favori tarif açılıyor...
          </div>
        )}

        {recipeError && (
          <div className="rounded-lg border border-red-600/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {recipeError}
          </div>
        )}

        {recipe && !recipeLoading && (
          <div className="space-y-4">
            <TarifKarti recipe={recipe} />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs font-bold text-stone-100 transition hover:bg-stone-800 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-stone-600"
              >
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-500"
              >
                {saved ? "Kaydedildi" : "Kaydet"}
              </button>
              <button
                onClick={handleFavorite}
                className="flex-1 rounded-lg border border-sky-600 px-4 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-950"
              >
                Favoriden Çıkar
              </button>
            </div>
            {renderPlanControls()}
            {recipe.missingIngredients.length > 0 && (
              <button
                onClick={handleAddMissingToShoppingList}
                className="w-full rounded-lg border border-sky-600 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950"
              >
                {shoppingAdded
                  ? "Eksik malzemeler listeye eklendi"
                  : "Eksik Malzemeleri Alışveriş Listesine Ekle"}
              </button>
            )}
            <Link
              href="/"
              className="block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-center text-xs font-bold text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              &larr; Ana Sayfaya Dön
            </Link>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      {/* Ana sayfaya dönüş bağlantısı */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-stone-500 transition hover:text-orange-600 dark:text-stone-400 dark:hover:text-orange-400"
      >
        &larr; Ana Sayfa
      </Link>

      {/* Sayfa başlığı moda göre değişir */}
      <h1 className="mb-6 text-3xl font-bold text-stone-900 dark:text-stone-100">
        {mode === "dolap" ? "Dolaptakilerle Tarif" : "Bana Öner"}
      </h1>

      {/* Öneri formu */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/20"
      >
        {/* Mod seçici (segmentli kontrol): URL'i de günceller */}
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-stone-300 bg-stone-100 p-1 dark:border-stone-700 dark:bg-stone-950/60">
          <button
            type="button"
            onClick={() => switchMode("dolap")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition ${
              mode === "dolap"
                ? "bg-orange-600 text-white shadow"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            Dolaptakilerle
          </button>
          <button
            type="button"
            onClick={() => switchMode("bana")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition ${
              mode === "bana"
                ? "bg-orange-600 text-white shadow"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            }`}
          >
            Bana Öner
          </button>
        </div>

        {/* Dolap modunda malzeme girişi; Bana Öner modunda bilgi notu */}
        {mode === "dolap" ? (
          <div>
            <label className={`mb-2 block ${LABEL_CLASS}`}>Dolabındaki Malzemeler</label>
            <MalzemeGirisi value={ingredients} onChange={setIngredients} />
          </div>
        ) : (
          <p className="rounded-lg border border-amber-600/40 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            Malzeme kısıtı yok — sana lezzetli bir yemek öneriyorum.
          </p>
        )}

        {/* Filtre seçimleri: kişi sayısı, diyet, süre, mutfak */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="servings" className={LABEL_CLASS}>
              Kaç Kişilik?
            </label>
            <select
              id="servings"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className={SELECT_CLASS}
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} kişi
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="diet" className={LABEL_CLASS}>
              Diyet
            </label>
            <select
              id="diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className={SELECT_CLASS}
            >
              {DIET_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d || "Fark etmez"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="maxTime" className={LABEL_CLASS}>
              Toplam Süre
            </label>
            <select
              id="maxTime"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              className={SELECT_CLASS}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cuisine" className={LABEL_CLASS}>
              Mutfak / Yöre
            </label>
            <select
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className={SELECT_CLASS}
            >
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c || "Fark etmez"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mealType" className={LABEL_CLASS}>
              Öğün
            </label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className={SELECT_CLASS}
            >
              {MEAL_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || "Öğün fark etmez"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cookingMethod" className={LABEL_CLASS}>
              Pişirme yöntemi
            </label>
            <select
              id="cookingMethod"
              value={cookingMethod}
              onChange={(e) => setCookingMethod(e.target.value)}
              className={SELECT_CLASS}
            >
              {COOKING_METHOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || "Yöntem fark etmez"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budgetLevel" className={LABEL_CLASS}>
              Bütçe
            </label>
            <select
              id="budgetLevel"
              value={budgetLevel}
              onChange={(e) => setBudgetLevel(e.target.value)}
              className={SELECT_CLASS}
            >
              {BUDGET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || "Bütçe fark etmez"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ana buton: listeyi üretir */}
        <button
          type="submit"
          disabled={listLoading || recipeLoading}
          className="w-full rounded-lg bg-orange-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {listLoading
            ? "Yemekler düşünülüyor..."
            : mode === "dolap"
              ? "Yemekleri Öner"
              : "Yemek Öner"}
        </button>
      </form>

      {/* Liste hatası */}
      {listError && (
        <div className="mt-6 rounded-lg border border-red-600/50 bg-red-50 px-4 py-3 font-mono text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span className="mr-2 text-red-500">&#x2715;</span>
          {listError}
        </div>
      )}

      {/* Liste yükleniyor */}
      {listLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white p-8 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          Farklı yemekler araştırılıyor...
        </div>
      )}

      {/* 5 yemeklik öneri listesi */}
      {suggestions && !recipeLoading && !recipe && (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {suggestions.length > 0
                ? `Sana ${suggestions.length} yemek buldum`
                : "Uygun yemek bulunamadı"}
            </h2>
            <button
              onClick={generateList}
              disabled={listLoading}
              className="rounded-lg border border-orange-600 px-3 py-1.5 text-xs font-bold text-orange-600 transition hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-950"
            >
              Başka Liste
            </button>
          </div>
          {suggestions.length > 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Birine tıkla, tam tarifini göstereyim.
            </p>
          )}
          <ul className={suggestions.length > 0 ? "space-y-3" : "hidden"}>
            {suggestions.map((s, i) => (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => selectDish(s.name)}
                  disabled={recipeLoading}
                  className="group flex w-full items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-500 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-orange-500"
                >
                  {/* Sıra numarası */}
                  <span className="mt-0.5 font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {/* Yemek adı */}
                      <span className="font-bold text-stone-900 group-hover:text-orange-600 dark:text-stone-100 dark:group-hover:text-orange-400">
                        {s.name}
                      </span>
                      {/* Tür rozeti */}
                      <span className="rounded border border-stone-300 bg-stone-50 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
                        {s.type || "yemek"}
                      </span>
                    </span>
                    {/* Seçilme nedeni */}
                    {s.reason && (
                      <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                        {s.reason}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-orange-500">
                    &rarr;
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {suggestions.length === 0 && (
            <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
              Seçtiğin malzemelerle şu anda uygun bir yemek bulunamadı.
            </p>
          )}
        </section>
      )}

      {/* Tarif yükleniyor */}
      {recipeLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white p-8 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          Tarif hazırlanıyor...
        </div>
      )}

      {/* Tarif hatası */}
      {recipeError && (
        <div className="mt-6 rounded-lg border border-red-600/50 bg-red-50 px-4 py-3 font-mono text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span className="mr-2 text-red-500">&#x2715;</span>
          {recipeError}
        </div>
      )}

      {/* Tam tarif kartı + aksiyonlar */}
      {recipe && !recipeLoading && (
        <div className="mt-6 space-y-4">
          <TarifKarti recipe={recipe} />
          {/* Gezinme: listeye dön / yeni liste */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setRecipe(null);
                setRecipeError("");
              }}
              className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              &larr; Listeye Dön
            </button>
            <button
              onClick={generateList}
              className="flex-1 rounded-lg border border-orange-600 px-4 py-2.5 text-xs font-bold text-orange-600 transition hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-950"
            >
              Başka Liste
            </button>
          </div>
          {renderPlanControls()}
          {/* Aksiyonlar: kopyala / kaydet / yaptım */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-lg border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs font-bold text-stone-100 transition hover:bg-stone-800 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-stone-600"
            >
              {copied ? "Kopyalandı" : "Kopyala"}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-500"
            >
              {saved ? "Kaydedildi" : "Kaydet"}
            </button>
            <button
              onClick={handleMade}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              {madeAdded ? "Eklendi" : "Yaptım, Önerme"}
            </button>
            <button
              onClick={handleFavorite}
              className="flex-1 rounded-lg border border-sky-600 px-4 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-950"
            >
              {favoriteActive ? "Favoriden Çıkar" : "Favoriye Ekle"}
            </button>
          </div>
          {recipe.missingIngredients.length > 0 && (
            <button
              onClick={handleAddMissingToShoppingList}
              className="w-full rounded-lg border border-sky-600 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950"
            >
              {shoppingAdded
                ? "Eksik malzemeler listeye eklendi"
                : "Eksik Malzemeleri Alışveriş Listesine Ekle"}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
