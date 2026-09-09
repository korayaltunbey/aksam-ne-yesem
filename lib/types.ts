// Uygulamanın tamamında kullanılan ortak tipler.
// Veri şemaları burada tek merkezde tanımlanır; istemci, sunucu ve API bu tipleri paylaşır.

// Uygulamanın iki çalışma modu:
//  "dolap" = kullanıcının verdiği malzemelerle öneri
//  "bana"  = malzeme verilmeden rastgele öneri
export type SuggestionMode = "dolap" | "bana";

// Tarifin zorluk seviyesi (yapay zekadan bu üç değerden biri istenir)
export type Difficulty = "Kolay" | "Orta" | "Zor";

// Tarifteki tek bir malzeme: adı ve miktarı
export interface RecipeIngredient {
  name: string;
  amount: string; // örn. "300 gr", "2 adet"
}

// Yapay zekanın ürettiği tam tarif yapısı
export interface Recipe {
  name: string; // yemeğin adı
  mealType?: string;
  cookingMethod?: string;
  budgetLevel?: string;
  estimatedCostPerServing?: number;
  caloriesPerServing?: number;
  proteinGrams?: number;
  isFreezerFriendly?: boolean;
  timeMinutes: number; // toplam hazırlık+pişirme süresi
  difficulty: Difficulty; // zorluk seviyesi
  servings: number; // kaç kişilik olduğu (ölçüler buna göre ölçeklenir)
  ingredients: RecipeIngredient[]; // ölçülü malzeme listesi
  steps: string[]; // adım adım hazırlanış
  missingIngredients: string[]; // dolap modunda kullanıcıda olmayan tamamlayıcılar
  matchedIngredients?: string[]; // dolaptaki malzemelerden eşleşenler
  note?: string; // isteğe bağlı ipucu notu
}

// Öneri listesindeki tek bir yemek (listeleme aşaması)
export interface DishSuggestion {
  name: string; // yemeğin adı
  type: string; // yemek türü (çorba, ana yemek, zeytinyağlı...)
  reason: string; // neden seçildiği (kısa açıklama)
  missingIngredientCount?: number; // dolap modunda eksik temel malzeme sayısı
}

// Yapay zekadan gelen öneri listesi yanıtı
export interface SuggestionList {
  suggestions: DishSuggestion[];
}

// Hem /api/suggest hem de /api/recipe tarafından kullanılan istek gövdesi.
// Dışlama alanları sayesinde aynı yemekler ve istenmeyen malzemeler önerilmez.
export interface SuggestionRequest {
  mode: SuggestionMode;
  ingredients: string[]; // dolap modundaki malzemeler
  servings: number; // kaç kişilik
  diet: string; // diyet tercihi (boş olabilir)
  mealType: string; // öğün türü (boş olabilir)
  cookingMethod: string; // pişirme yöntemi (boş olabilir)
  budgetLevel: string; // bütçe seviyesi (boş olabilir)
  maxTime: number | null; // maksimum süre (boş olabilir)
  cuisine: string; // mutfak/yöre tercihi (boş olabilir)
  excludeNames: string[]; // önerilmemesi gereken yemek adları
  excludeMadeNames: string[]; // kullanıcının yaptığı ve asla önerilmemesi gereken yemekler
  excludeIngredients: string[]; // içerdiği yemeklerin yasak olduğu ana malzemeler
}

// /api/recipe isteği: SuggestionRequest'e seçilen yemeğin adı eklenir
export interface RecipeRequest extends SuggestionRequest {
  dishName: string;
}

// "Kaydet" ile tarayıcıda saklanan geçmiş kaydı
export interface SavedRecipe {
  id: string; // benzersiz kimlik
  savedAt: string; // kaydedilme zamanı (ISO)
  mode: SuggestionMode; // hangi moddan geldiği
  recipe: Recipe; // kaydedilen tam tarif
}
