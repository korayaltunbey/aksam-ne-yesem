// Ana sayfa (/) — istemci bileşeni.
// İki mod kartı, "Yaptığım Yemekler" listesi, öneri geçmişi ve
// kaydedilen tariflerin listesi burada görüntülenir.

"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
// Kaydedilen tarif geçmişi deposu
import {
  getSnapshot,
  getServerSnapshot,
  removeFromHistory,
  subscribe,
} from "@/lib/history";
// "Yaptığım yemekler" deposu
import {
  getMadeSnapshot,
  getMadeServerSnapshot,
  subscribeMade,
  addMadeDish,
  removeMadeDish,
} from "@/lib/made";
// Öneri geçmişi / tekrar engelleme deposu
import {
  getSuggestedSnapshot,
  getSuggestedServerSnapshot,
  subscribeSuggested,
  clearSuggested,
} from "@/lib/suggested";
import {
  clearShoppingList,
  getShoppingServerSnapshot,
  getShoppingSnapshot,
  removeShoppingItem,
  subscribeShopping,
  toggleShoppingItem,
} from "@/lib/shopping";
import {
  getFavoritesServerSnapshot,
  getFavoritesSnapshot,
  removeFavorite,
  subscribeFavorites,
} from "@/lib/favorites";
import {
  getPlanServerSnapshot,
  getPlanSnapshot,
  PLAN_DAYS,
  removePlannedRecipe,
  subscribePlan,
} from "@/lib/week-plan";
import type { PlanDay } from "@/lib/week-plan";

// Bölüm başlıklarını küçük, renkli etiketler halinde gösterir
function SectionLabel({
  color = "text-orange-600 dark:text-orange-400",
  children,
}: {
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-600 ${color} dark:border-stone-700 dark:bg-stone-900`}
    >
      {children}
    </span>
  );
}

// Kartların ortak görünümü (açık modda beyaz, koyu modda koyu)
const CARD = "rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/20";

export default function HomePage() {
  // Üç localStorage deposunu React'e bağlar (değişince otomatik yeniden çizilir)
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const made = useSyncExternalStore(subscribeMade, getMadeSnapshot, getMadeServerSnapshot);
  const suggested = useSyncExternalStore(
    subscribeSuggested,
    getSuggestedSnapshot,
    getSuggestedServerSnapshot
  );
  const shoppingItems = useSyncExternalStore(
    subscribeShopping,
    getShoppingSnapshot,
    getShoppingServerSnapshot
  );
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot
  );
  const plannedRecipes = useSyncExternalStore(
    subscribePlan,
    getPlanSnapshot,
    getPlanServerSnapshot
  );
  // "Yaptığım yemekler" ekleme kutusunun metni
  const [madeDraft, setMadeDraft] = useState("");
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedPlanDay, setSelectedPlanDay] = useState<PlanDay>(PLAN_DAYS[todayIndex]);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - todayIndex + weekOffset * 7);
  const selectedPlannedRecipe = plannedRecipes.find((item) => item.day === selectedPlanDay);

  function getPlanDate(dayIndex: number) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date;
  }

  // Kaydedilmiş bir tarifi geçmişten siler
  function handleRemove(id: string) {
    removeFromHistory(id);
  }

  // Yeni yemek adını "yaptığım yemekler" listesine ekler
  function handleAddMade(e: React.FormEvent) {
    e.preventDefault();
    addMadeDish(madeDraft);
    setMadeDraft("");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      {/* Hero başlık */}
      <header className="mb-10 text-center">
        <div className="mb-4 text-5xl">🍳</div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Akşam Ne Yesem?
        </h1>
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          &quot;Ne yapacağım?&quot; derdine son. Dolaptakilerle ya da keyfine göre yemek önerisi al.
        </p>
      </header>

      {/* İki mod kartı */}
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Dolaptakilerle modu: /oneri?mode=dolap'a götürür */}
        <Link
          href="/oneri?mode=dolap"
          className={`group overflow-hidden transition hover:-translate-y-0.5 hover:border-orange-500 ${CARD}`}
        >
          <div className="p-5">
            <div className="mb-3 text-3xl">🧺</div>
            <h2 className="text-lg font-bold text-stone-900 group-hover:text-orange-600 dark:text-stone-100 dark:group-hover:text-orange-400">
              Dolaptakilerle Tarif
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              Elindeki malzemeleri yaz, seninle o malzemelerden yemek çıkaralım.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
              Başla
              <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </span>
          </div>
        </Link>

        {/* Bana Öner modu: /oneri?mode=bana'ya götürür */}
        <Link
          href="/oneri?mode=bana"
          className={`group overflow-hidden transition hover:-translate-y-0.5 hover:border-amber-500 ${CARD}`}
        >
          <div className="p-5">
            <div className="mb-3 text-3xl">🍽️</div>
            <h2 className="text-lg font-bold text-stone-900 group-hover:text-amber-600 dark:text-stone-100 dark:group-hover:text-amber-400">
              Bana Öner
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              Karar veremiyorum, bana bir yemek öner.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Başla
              <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </span>
          </div>
        </Link>
      </section>

      {/* Yaptığım yemekler bölümü: eklenenler önerilerde dışlanır */}
      <section className="mt-12">
        <div className="mb-3 flex items-center gap-2">
          <SectionLabel>Yaptığım Yemekler</SectionLabel>
        </div>
        <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
          Bu listedekiler ve benzerleri bir daha önerilmez.
        </p>
        <form onSubmit={handleAddMade} className="flex gap-2">
          <input
            type="text"
            value={madeDraft}
            onChange={(e) => setMadeDraft(e.target.value)}
            placeholder="Yemek adı yaz (örn. menemen)"
            className="flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
          />
          <button
            type="submit"
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Ekle
          </button>
        </form>
        {/* Eklenen yemek adları çip olarak listelenir, çarpı ile silinebilir */}
        {made.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {made.map((dish) => (
              <span
                key={dish}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/40 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {dish}
                <button
                  type="button"
                  onClick={() => removeMadeDish(dish)}
                  aria-label={`${dish} kaldır`}
                  className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Öneri geçmişi: daha önce önerilenler hatırlanır; sıfırlanabilir */}
      {suggested.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SectionLabel color="text-amber-600 dark:text-amber-400">Öneri Geçmişi</SectionLabel>
            <button
              onClick={clearSuggested}
              className="ml-auto rounded-lg border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-500 transition hover:border-red-500 hover:text-red-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-600 dark:hover:text-red-400"
            >
              Geçmişi Sıfırla
            </button>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Daha önce önerilen {suggested.length} yemek hatırlanıyor; bunlar bir daha gelmez.
            &quot;Geçmişi Sıfırla&quot; ile hepsi yeniden önerilebilir.
          </p>
        </section>
      )}

      {shoppingItems.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SectionLabel color="text-sky-600 dark:text-sky-400">
              Alışveriş Listesi
            </SectionLabel>
            <button
              onClick={clearShoppingList}
              className="ml-auto rounded-lg border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-500 transition hover:border-red-500 hover:text-red-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-600 dark:hover:text-red-400"
            >
              Listeyi Temizle
            </button>
          </div>
          <ul className="space-y-2">
            {shoppingItems.map((item) => (
              <li
                key={item.name}
                className={`flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900 ${
                  item.checked ? "opacity-60" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleShoppingItem(item.name)}
                  aria-label={`${item.name} alındı`}
                  className="h-4 w-4 accent-sky-600"
                />
                <span className={`min-w-0 flex-1 text-sm ${item.checked ? "line-through" : ""}`}>
                  {item.name}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {item.amount}
                </span>
                <button
                  type="button"
                  onClick={() => removeShoppingItem(item.name)}
                  aria-label={`${item.name} alışveriş listesinden kaldır`}
                  className="rounded px-2 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800 dark:hover:text-red-400"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <SectionLabel color="text-sky-600 dark:text-sky-400">
              Favorilerim
            </SectionLabel>
          </div>
          <ul className="space-y-3">
            {favorites.map((item) => (
              <li key={item.id} className={`flex items-center gap-3 p-3.5 ${CARD}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-base dark:bg-sky-950/50">
                  &#9733;
                </span>
                <Link
                  href={`/oneri?mode=bana&favorite=${encodeURIComponent(item.recipe.name)}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                    {item.recipe.name}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {item.recipe.servings} kişilik &middot; {item.recipe.timeMinutes} dk
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => removeFavorite(item.recipe.name)}
                  aria-label={`${item.recipe.name} favorilerden kaldır`}
                  className="rounded px-2 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800 dark:hover:text-red-400"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel color="text-violet-600 dark:text-violet-400">
              Haftalık Plan
            </SectionLabel>
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Bir güne tıkla; o gün için kaydettiğin tarifi aşağıda gör.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900">
            <button
              type="button"
              onClick={() => setWeekOffset((offset) => offset - 1)}
              aria-label="Önceki hafta"
              className="rounded-md px-2.5 py-1.5 text-sm text-stone-500 transition hover:bg-violet-50 hover:text-violet-700 dark:text-stone-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
            >
              &larr;
            </button>
            <span className="min-w-28 text-center text-[11px] font-bold text-stone-700 dark:text-stone-200">
              {weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
              {" – "}
              {getPlanDate(6).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((offset) => offset + 1)}
              aria-label="Sonraki hafta"
              className="rounded-md px-2.5 py-1.5 text-sm text-stone-500 transition hover:bg-violet-50 hover:text-violet-700 dark:text-stone-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {PLAN_DAYS.map((day, index) => {
            const planned = plannedRecipes.find((item) => item.day === day);
            const date = getPlanDate(index);
            const isSelected = selectedPlanDay === day;
            const isToday = weekOffset === 0 && index === todayIndex;
            const calendarDayClass = `min-h-25 rounded-xl border p-2 text-left transition sm:min-h-30 sm:p-2.5 ${
              isSelected
                ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/20"
                : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-violet-700"
            }`;
            const calendarDayContent = (
              <>
                <span className={`block text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${isSelected ? "text-violet-100" : "text-stone-500 dark:text-stone-400"}`}>
                  {day.slice(0, 3)}
                </span>
                <span className={`mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                  isToday && !isSelected ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : ""
                }`}>
                  {date.getDate()}
                </span>
                {planned ? (
                  <span className={`mt-2 block line-clamp-3 text-[10px] font-bold leading-snug sm:text-[11px] ${isSelected ? "text-white" : "text-stone-800 dark:text-stone-100"}`}>
                    {planned.recipe.name}
                  </span>
                ) : (
                  <span className={`mt-3 block text-[10px] ${isSelected ? "text-violet-200" : "text-stone-400 dark:text-stone-600"}`}>
                    Boş
                  </span>
                )}
              </>
            );

            if (planned) {
              return (
                <Link
                  key={day}
                  href={`/oneri?mode=bana&planned=${encodeURIComponent(planned.recipe.name)}`}
                  aria-label={`${day}: ${planned.recipe.name} tarifini aç`}
                  className={calendarDayClass}
                >
                  {calendarDayContent}
                </Link>
              );
            }

            return (
              <button
                type="button"
                key={day}
                onClick={() => setSelectedPlanDay(day)}
                aria-pressed={isSelected}
                className={calendarDayClass}
              >
                {calendarDayContent}
              </button>
            );
          })}
        </div>

        <div className={`mt-3 p-4 ${CARD}`}>
          {selectedPlannedRecipe ? (
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-lg dark:bg-violet-950">🍲</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">{selectedPlanDay}</p>
                  <Link
                    href={`/oneri?mode=bana&planned=${encodeURIComponent(selectedPlannedRecipe.recipe.name)}`}
                    className="mt-0.5 block text-base font-bold text-stone-900 transition hover:text-violet-700 dark:text-stone-100 dark:hover:text-violet-300"
                  >
                    {selectedPlannedRecipe.recipe.name} <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {selectedPlannedRecipe.recipe.servings} kişilik · {selectedPlannedRecipe.recipe.timeMinutes} dk · {selectedPlannedRecipe.recipe.difficulty}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removePlannedRecipe(selectedPlanDay)}
                  aria-label={`${selectedPlanDay} planını kaldır`}
                  className="rounded-md px-2 py-1 text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  &times;
                </button>
              </div>
              <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Malzemeler</p>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  {selectedPlannedRecipe.recipe.ingredients.map((ingredient) => `${ingredient.name} (${ingredient.amount})`).join(" · ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1 text-sm text-stone-500 dark:text-stone-400">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-lg dark:bg-stone-800">＋</span>
              <p><strong className="text-stone-700 dark:text-stone-200">{selectedPlanDay}</strong> için henüz bir tarif kaydetmedin.</p>
            </div>
          )}
        </div>
      </section>

      {/* Kaydedilen tariflerin geçmişi */}
      {history.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <SectionLabel>Son Önerilerim</SectionLabel>
          </div>
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className={`flex items-center gap-3 p-3.5 ${CARD}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-stone-100 text-base dark:bg-stone-800">
                  {item.mode === "dolap" ? "🧺" : "🍽️"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                    {item.recipe.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {item.recipe.servings} kişilik &middot; {item.recipe.timeMinutes} dk &middot;{" "}
                    {new Date(item.savedAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  aria-label={`${item.recipe.name} önerisini kaldır`}
                  className="rounded px-2 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800 dark:hover:text-red-400"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
