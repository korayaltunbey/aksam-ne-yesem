import {
  getRecommendations,
  type RecommendationRequest,
} from "@/lib/recommendations";

export const FILTER_OPTIONS = {
  diet: ["Vejetaryen", "Vegan", "Glutensiz", "Düşük karbonhidrat", "Düşük kalorili"],
  maxTime: [15, 30, 45, 60],
  cuisine: [
    "Türk mutfağı",
    "İtalyan mutfağı",
    "Asya mutfağı",
    "Meksika mutfağı",
    "Akdeniz mutfağı",
  ],
  mealType: ["Kahvaltı", "Öğle", "Akşam", "Atıştırmalık", "Tatlı"],
  cookingMethod: ["Tencere", "Tava", "Fırın", "Pişirme yok"],
  budgetLevel: ["Düşük", "Orta", "Yüksek"],
} as const;

export type FilterAvailability = Record<
  keyof typeof FILTER_OPTIONS,
  Record<string, boolean>
>;

function availableValues(
  request: RecommendationRequest,
  field: keyof typeof FILTER_OPTIONS
): Record<string, boolean> {
  return Object.fromEntries(
    FILTER_OPTIONS[field].map((value) => [
      String(value),
      getRecommendations({ ...request, [field]: value, limit: 1 }).length > 0,
    ])
  );
}

// Her seçenek, diğer mevcut tercihler korunarak ölçülür. Böylece kullanıcı
// yalnızca sonuç üretecek bir sonraki seçimi yapabilir.
export function getFilterAvailability(
  request: RecommendationRequest
): FilterAvailability {
  return {
    diet: availableValues(request, "diet"),
    maxTime: availableValues(request, "maxTime"),
    cuisine: availableValues(request, "cuisine"),
    mealType: availableValues(request, "mealType"),
    cookingMethod: availableValues(request, "cookingMethod"),
    budgetLevel: availableValues(request, "budgetLevel"),
  };
}
