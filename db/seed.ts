import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import {
  ingredients,
  recipeDiets,
  recipeIngredients,
  recipeSteps,
  recipes,
} from "./schema";

type SeedIngredient = {
  name: string;
  quantity: number | null;
  unit: string;
  quantityText?: string;
  preparation?: string;
  optional?: boolean;
};

type SeedRecipe = {
  slug: string;
  name: string;
  category: string;
  cuisine?: string;
  mealType?: string;
  cookingMethod?: string;
  budgetLevel?: string;
  estimatedCostPerServing?: number;
  caloriesPerServing?: number;
  proteinGrams?: number;
  isFreezerFriendly?: boolean;
  timeMinutes: number;
  difficulty: "Kolay" | "Orta" | "Zor";
  baseServings: number;
  note?: string;
  diets: string[];
  ingredients: SeedIngredient[];
  steps: string[];
};

const CUISINE = "Türk Mutfağı";

// Ingredient names are canonicalized before insertion so all recipes share
// the same ingredient row even when Turkish casing/diacritics are involved.
function normalizeIngredientName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function ingredient(
  name: string,
  quantity: number | null,
  unit: string,
  options: Omit<SeedIngredient, "name" | "quantity" | "unit"> = {}
): SeedIngredient {
  return { name, quantity, unit, ...options };
}

const seedRecipes: SeedRecipe[] = [
  {
    slug: "menemen",
    name: "Menemen",
    category: "Kahvaltı",
    mealType: "Kahvaltı",
    cookingMethod: "Tava",
    budgetLevel: "Düşük",
    estimatedCostPerServing: 35,
    timeMinutes: 20,
    difficulty: "Kolay",
    baseServings: 2,
    note: "Yumurtaları fazla kurutmadan ocaktan almak menemenin kıvamını korur.",
    diets: ["vegetarian", "gluten_free"],
    ingredients: [
      ingredient("Yumurta", 4, "adet"),
      ingredient("Domates", 3, "adet", { preparation: "küçük doğranmış" }),
      ingredient("Yeşil biber", 2, "adet", { preparation: "ince doğranmış" }),
      ingredient("Soğan", 1, "adet", { preparation: "ince doğranmış", optional: true }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Zeytinyağını tavada ısıtıp soğanı ve biberi yumuşayana kadar kavur.",
      "Domatesleri ekleyip suyunu çekene kadar pişir.",
      "Tuz ve karabiberi ekle.",
      "Yumurtaları kırıp hafifçe karıştırarak istediğin kıvama gelene kadar pişir.",
    ],
  },
  {
    slug: "sucuklu-yumurta",
    name: "Sucuklu Yumurta",
    category: "Kahvaltı",
    timeMinutes: 15,
    difficulty: "Kolay",
    baseServings: 2,
    diets: ["gluten_free"],
    ingredients: [
      ingredient("Sucuk", 120, "gram", { preparation: "ince dilimlenmiş" }),
      ingredient("Yumurta", 4, "adet"),
      ingredient("Tereyağı", 1, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Tereyağını tavada erit.",
      "Sucuk dilimlerini ekleyip iki tarafını kısa süre kızart.",
      "Yumurtaları sucukların üzerine kır.",
      "Yumurtaların beyazı pişene kadar tavayı kısık ateşte tut ve servis et.",
    ],
  },
  {
    slug: "kuymak-muhlama",
    name: "Kuymak (Muhlama)",
    category: "Kahvaltı",
    timeMinutes: 20,
    difficulty: "Kolay",
    baseServings: 2,
    diets: ["vegetarian", "gluten_free"],
    ingredients: [
      ingredient("Tereyağı", 2, "yemek kaşığı"),
      ingredient("Mısır unu", 3, "yemek kaşığı"),
      ingredient("Su", 1.5, "su bardağı"),
      ingredient("Kolot peyniri", 200, "gram", { preparation: "rendelenmiş" }),
      ingredient("Tuz", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Tereyağını tavada eritip mısır ununu ekle.",
      "Mısır ununu kokusu çıkana kadar birkaç dakika kavur.",
      "Suyu yavaşça ekleyip topaklanmaması için karıştır.",
      "Peynir ve tuzu ekleyip peynir eriyene ve yağ yüzeye çıkana kadar pişir.",
    ],
  },
  {
    slug: "pisi",
    name: "Pişi",
    category: "Kahvaltı",
    timeMinutes: 45,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Un", 4, "su bardağı"),
      ingredient("Su", 1.5, "su bardağı", { preparation: "ılık" }),
      ingredient("Kuru maya", 1, "tatlı kaşığı"),
      ingredient("Tuz", 1, "çay kaşığı"),
      ingredient("Toz şeker", 1, "çay kaşığı"),
      ingredient("Sıvı yağ", 500, "ml", { preparation: "kızartmak için" }),
    ],
    steps: [
      "Ilık su, maya ve şekeri karıştırıp birkaç dakika beklet.",
      "Un ve tuzu ekleyerek yumuşak bir hamur yoğur.",
      "Hamurun üzerini kapatıp yaklaşık 30 dakika mayalandır.",
      "Hamurdan parçalar koparıp aç ve ortalarını hafifçe del.",
      "Sıvı yağı kızdırıp pişileri iki tarafı altın rengini alana kadar kızart.",
    ],
  },
  {
    slug: "mercimek-corbasi",
    name: "Mercimek Çorbası",
    category: "Çorba",
    timeMinutes: 40,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Kırmızı mercimek", 1, "su bardağı"),
      ingredient("Soğan", 1, "adet", { preparation: "doğranmış" }),
      ingredient("Havuç", 1, "adet", { preparation: "doğranmış" }),
      ingredient("Patates", 1, "adet", { preparation: "küçük doğranmış" }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Su", 6, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
      ingredient("Kimyon", 1, "çay kaşığı", { optional: true }),
    ],
    steps: [
      "Mercimeği bol suyla yıka.",
      "Zeytinyağında soğan, havuç ve patatesi birkaç dakika kavur.",
      "Mercimek, su, tuz ve karabiberi ekleyip sebzeler yumuşayana kadar pişir.",
      "Çorbayı blenderdan geçirip kimyonu ekle ve birkaç dakika daha kaynat.",
    ],
  },
  {
    slug: "ezogelin-corbasi",
    name: "Ezogelin Çorbası",
    category: "Çorba",
    timeMinutes: 50,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["vegan", "vegetarian"],
    ingredients: [
      ingredient("Kırmızı mercimek", 1, "su bardağı"),
      ingredient("İnce bulgur", 2, "yemek kaşığı"),
      ingredient("Pirinç", 2, "yemek kaşığı"),
      ingredient("Soğan", 1, "adet", { preparation: "ince doğranmış" }),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Biber salçası", 1, "tatlı kaşığı", { optional: true }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Nane", 1, "tatlı kaşığı"),
      ingredient("Pul biber", 1, "çay kaşığı", { optional: true }),
      ingredient("Su", 7, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Mercimek, pirinç ve bulguru yıkayıp tencereye al.",
      "Suyu ekleyip bakliyatlar yumuşayana kadar kaynat.",
      "Ayrı tavada zeytinyağı, soğan, salçalar, nane ve pul biberi kavur.",
      "Salçalı karışımı çorbaya ekleyip tuzunu ayarla ve 10 dakika daha kaynat.",
    ],
  },
  {
    slug: "yayla-corbasi",
    name: "Yayla Çorbası",
    category: "Çorba",
    timeMinutes: 40,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["vegetarian", "gluten_free"],
    ingredients: [
      ingredient("Yoğurt", 1, "su bardağı"),
      ingredient("Pirinç", 3, "yemek kaşığı"),
      ingredient("Yumurta", 1, "adet"),
      ingredient("Un", 1, "yemek kaşığı"),
      ingredient("Su", 6, "su bardağı"),
      ingredient("Tereyağı", 1, "yemek kaşığı"),
      ingredient("Kuru nane", 1, "tatlı kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Pirinci suyla tencereye alıp yumuşayana kadar haşla.",
      "Yoğurt, yumurta ve unu ayrı bir kapta çırp.",
      "Çorbanın sıcak suyundan yoğurtlu karışıma azar azar ekleyerek ılıt.",
      "Karışımı tencereye döküp sürekli karıştırarak kaynama noktasına getir.",
      "Tereyağında naneyi yakmadan kızdırıp çorbanın üzerine dök.",
    ],
  },
  {
    slug: "tarhana-corbasi",
    name: "Tarhana Çorbası",
    category: "Çorba",
    timeMinutes: 30,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Tarhana", 5, "yemek kaşığı"),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Tereyağı", 1, "yemek kaşığı"),
      ingredient("Su", 6, "su bardağı"),
      ingredient("Sarımsak", 1, "diş", { preparation: "ezilmiş", optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Kuru nane", 1, "çay kaşığı", { optional: true }),
    ],
    steps: [
      "Tarhanayı bir su bardağı suyla pürüzsüz olana kadar karıştırıp beklet.",
      "Tereyağında salçayı ve sarımsağı kısa süre kavur.",
      "Kalan suyu ve açılmış tarhanayı tencereye ekleyip sürekli karıştır.",
      "Çorba koyulaşıp kaynayınca tuz ve naneyi ekleyerek birkaç dakika pişir.",
    ],
  },
  {
    slug: "karniyarik",
    name: "Karnıyarık",
    category: "Ana yemek",
    timeMinutes: 75,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["gluten_free"],
    ingredients: [
      ingredient("Patlıcan", 4, "adet"),
      ingredient("Kıyma", 300, "gram"),
      ingredient("Soğan", 1, "adet", { preparation: "doğranmış" }),
      ingredient("Domates", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Yeşil biber", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Sarımsak", 2, "diş", { preparation: "doğranmış" }),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Sıvı yağ", 4, "yemek kaşığı"),
      ingredient("Su", 1, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Patlıcanları alacalı soyup tuzlu suda beklet ve kurula.",
      "Patlıcanları az yağda yumuşayana kadar çevirerek kızart.",
      "Ayrı tavada soğan, sarımsak, biber ve kıymayı kavur.",
      "Domates, salça, tuz ve karabiberi ekleyip harcı birkaç dakika pişir.",
      "Patlıcanların ortasını açıp harçla doldur, tepsiye diz ve suyu ekle.",
      "200 derece fırında yaklaşık 25 dakika pişir.",
    ],
  },
  {
    slug: "imam-bayildi",
    name: "İmam Bayıldı",
    category: "Ana yemek",
    timeMinutes: 70,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Patlıcan", 4, "adet"),
      ingredient("Soğan", 3, "adet", { preparation: "piyazlık doğranmış" }),
      ingredient("Domates", 3, "adet", { preparation: "doğranmış" }),
      ingredient("Sarımsak", 4, "diş", { preparation: "doğranmış" }),
      ingredient("Yeşil biber", 2, "adet", { preparation: "doğranmış", optional: true }),
      ingredient("Zeytinyağı", 6, "yemek kaşığı"),
      ingredient("Toz şeker", 1, "çay kaşığı", { optional: true }),
      ingredient("Su", 1, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Patlıcanları alacalı soyup ortalarına uzun bir çizik at.",
      "Patlıcanları zeytinyağının bir kısmıyla tavada veya fırında yumuşat.",
      "Kalan yağda soğan, sarımsak ve biberi kavur.",
      "Domates, şeker ve tuzu ekleyip soğanlar iyice yumuşayana kadar pişir.",
      "Patlıcanları tepsiye alıp içlerini aç ve soğanlı harçla doldur.",
      "Suyu ekleyip 190 derece fırında yaklaşık 30 dakika pişir.",
    ],
  },
  {
    slug: "kuru-fasulye",
    name: "Kuru Fasulye",
    category: "Ana yemek",
    timeMinutes: 90,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Kuru fasulye", 2, "su bardağı"),
      ingredient("Soğan", 1, "adet", { preparation: "doğranmış" }),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Biber salçası", 1, "yemek kaşığı", { optional: true }),
      ingredient("Zeytinyağı", 3, "yemek kaşığı"),
      ingredient("Su", 6, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Kuru fasulyeyi bir gece önceden bol suyla ıslat.",
      "Fasulyeyi süzüp yeni suyla yumuşayana kadar haşla.",
      "Zeytinyağında soğanı kavurup salçaları ekle.",
      "Fasulyeyi ve suyu tencereye alıp kısık ateşte sos koyulaşana kadar pişir.",
      "Tuz ve karabiberi pişmenin sonlarına doğru ekle.",
    ],
  },
  {
    slug: "manti",
    name: "Mantı",
    category: "Ana yemek",
    timeMinutes: 100,
    difficulty: "Zor",
    baseServings: 4,
    diets: [],
    ingredients: [
      ingredient("Un", 3, "su bardağı"),
      ingredient("Yumurta", 1, "adet"),
      ingredient("Su", 1, "su bardağı"),
      ingredient("Kıyma", 250, "gram"),
      ingredient("Soğan", 1, "adet", { preparation: "rendelenmiş" }),
      ingredient("Yoğurt", 2, "su bardağı"),
      ingredient("Sarımsak", 2, "diş", { preparation: "ezilmiş" }),
      ingredient("Tereyağı", 2, "yemek kaşığı"),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Pul biber", 1, "çay kaşığı", { optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Un, yumurta, su ve tuzla sert bir hamur yoğurup dinlendir.",
      "Kıyma, soğan, tuz ve karabiberi karıştırarak iç harcı hazırla.",
      "Hamuru ince açıp küçük kareler kes ve her karenin ortasına harç koy.",
      "Karelerin köşelerini birleştirerek mantıları kapat.",
      "Mantıları kaynayan tuzlu suda hamur yumuşayana kadar haşla.",
      "Sarımsaklı yoğurdu hazırla; tereyağında salça ve pul biberi kızdır.",
      "Mantıyı yoğurt ve salçalı sosla servis et.",
    ],
  },
  {
    slug: "izmir-kofte",
    name: "İzmir Köfte",
    category: "Ana yemek",
    timeMinutes: 70,
    difficulty: "Orta",
    baseServings: 4,
    diets: [],
    ingredients: [
      ingredient("Kıyma", 500, "gram"),
      ingredient("Soğan", 1, "adet", { preparation: "rendelenmiş" }),
      ingredient("Bayat ekmek içi", 1, "su bardağı"),
      ingredient("Yumurta", 1, "adet"),
      ingredient("Patates", 4, "adet", { preparation: "elma dilimi doğranmış" }),
      ingredient("Domates", 3, "adet", { preparation: "doğranmış" }),
      ingredient("Yeşil biber", 3, "adet"),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Sıvı yağ", 4, "yemek kaşığı"),
      ingredient("Su", 2, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Kıyma, soğan, ekmek içi, yumurta, tuz ve karabiberi yoğur.",
      "Harçtan parmak köfteler şekillendir.",
      "Köfteleri ve patatesleri az yağda hafifçe kızart.",
      "Tepsiye köfte, patates, domates ve biberleri diz.",
      "Salçayı suyla açıp tepsiye dök.",
      "200 derece fırında patatesler yumuşayana kadar pişir.",
    ],
  },
  {
    slug: "hunkar-begendi",
    name: "Hünkar Beğendi",
    category: "Ana yemek",
    timeMinutes: 100,
    difficulty: "Zor",
    baseServings: 4,
    diets: [],
    ingredients: [
      ingredient("Kuzu kuşbaşı", 600, "gram"),
      ingredient("Soğan", 1, "adet", { preparation: "doğranmış" }),
      ingredient("Domates", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Patlıcan", 4, "adet"),
      ingredient("Tereyağı", 2, "yemek kaşığı"),
      ingredient("Un", 2, "yemek kaşığı"),
      ingredient("Süt", 2, "su bardağı"),
      ingredient("Kaşar peyniri", 100, "gram", { preparation: "rendelenmiş" }),
      ingredient("Su", 2, "su bardağı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Patlıcanları közleyip kabuklarını soy ve içlerini ince kıy.",
      "Kuzu etini tencerede suyunu salıp çekene kadar pişir.",
      "Soğanı, salçayı ve domatesi ekleyip kavur; suyu ilave ederek et yumuşayana kadar pişir.",
      "Beğendi için tereyağında unu kavurup sütü yavaşça ekle.",
      "Közlenmiş patlıcan ve kaşar peynirini beşamele karıştırıp tuzunu ayarla.",
      "Beğendiyi tabağa alıp üzerine kuzu etini yerleştir.",
    ],
  },
  {
    slug: "su-boregi",
    name: "Su Böreği",
    category: "Hamur işi",
    timeMinutes: 120,
    difficulty: "Zor",
    baseServings: 8,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Un", 6, "su bardağı"),
      ingredient("Yumurta", 6, "adet"),
      ingredient("Su", 1, "su bardağı"),
      ingredient("Beyaz peynir", 400, "gram", { preparation: "ezilmiş" }),
      ingredient("Maydanoz", 1, "demet", { preparation: "doğranmış", optional: true }),
      ingredient("Tereyağı", 200, "gram", { preparation: "eritilmiş" }),
      ingredient("Tuz", 2, "çay kaşığı"),
    ],
    steps: [
      "Un, yumurta, su ve tuzla sert bir hamur yoğurup bezelere ayır.",
      "Bezeleri ince yufkalar halinde aç.",
      "Yufkaları kaynar tuzlu suda kısa süre haşlayıp soğuk suya al.",
      "Tepsiyi yağlayıp ilk yufkayı kuru ser; diğer yufkaları eritilmiş tereyağıyla kat kat yerleştir.",
      "Orta kata peynir ve maydanoz serpiştir.",
      "Kalan yufkaları yerleştirip üzerine tereyağı sür.",
      "180 derece fırında üzeri kızarana kadar pişir.",
    ],
  },
  {
    slug: "patatesli-gozleme",
    name: "Patatesli Gözleme",
    category: "Hamur işi",
    timeMinutes: 60,
    difficulty: "Orta",
    baseServings: 4,
    diets: ["vegan", "vegetarian"],
    ingredients: [
      ingredient("Un", 4, "su bardağı"),
      ingredient("Su", 1.5, "su bardağı"),
      ingredient("Tuz", 1, "çay kaşığı"),
      ingredient("Patates", 4, "adet"),
      ingredient("Soğan", 1, "adet", { preparation: "doğranmış" }),
      ingredient("Zeytinyağı", 3, "yemek kaşığı"),
      ingredient("Pul biber", 1, "çay kaşığı", { optional: true }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Un, su ve tuzla yumuşak bir hamur yoğurup dinlendir.",
      "Patatesleri haşlayıp ez.",
      "Zeytinyağında soğanı kavurup patates, pul biber ve karabiberle karıştır.",
      "Hamuru bezelere ayırıp ince aç ve yarısına iç harcı yay.",
      "Hamuru kapatıp kenarlarını bastır.",
      "Gözlemeleri yağsız tavada iki tarafı kızarana kadar pişir.",
    ],
  },
  {
    slug: "lahmacun",
    name: "Lahmacun",
    category: "Hamur işi",
    timeMinutes: 75,
    difficulty: "Zor",
    baseServings: 6,
    diets: [],
    ingredients: [
      ingredient("Un", 4, "su bardağı"),
      ingredient("Su", 1.5, "su bardağı"),
      ingredient("Kıyma", 400, "gram"),
      ingredient("Soğan", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Domates", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Kırmızı biber", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Maydanoz", 1, "demet", { preparation: "doğranmış" }),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Biber salçası", 1, "yemek kaşığı"),
      ingredient("Sıvı yağ", 2, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Pul biber", 1, "çay kaşığı", { optional: true }),
    ],
    steps: [
      "Un, su ve tuzla yumuşak bir hamur yoğurup dinlendir.",
      "Kıyma, sebzeler, maydanoz, salçalar, yağ ve baharatları ince bir harç olana kadar karıştır.",
      "Hamuru bezelere ayırıp çok ince aç.",
      "Kıymalı harcı hamurların üzerine ince bir tabaka halinde yay.",
      "Lahmacunları 250 derece fırında kenarları kızarana kadar pişir.",
    ],
  },
  {
    slug: "kiymali-pide",
    name: "Kıymalı Pide",
    category: "Hamur işi",
    timeMinutes: 75,
    difficulty: "Orta",
    baseServings: 4,
    diets: [],
    ingredients: [
      ingredient("Un", 4, "su bardağı"),
      ingredient("Su", 1.5, "su bardağı"),
      ingredient("Kuru maya", 1, "tatlı kaşığı"),
      ingredient("Kıyma", 400, "gram"),
      ingredient("Soğan", 2, "adet", { preparation: "ince doğranmış" }),
      ingredient("Domates", 2, "adet", { preparation: "küçük doğranmış" }),
      ingredient("Yeşil biber", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Sıvı yağ", 2, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Un, su, maya ve tuzla yumuşak bir hamur yoğurup mayalandır.",
      "Kıyma, soğan, domates, biber, salça ve baharatları karıştır.",
      "Hamuru dört bezeye ayırıp uzun oval şekilde aç.",
      "Kıymalı harcı hamurun ortasına yay ve kenarlarını içe doğru kıvır.",
      "250 derece fırında pide kenarları kızarana kadar pişir.",
    ],
  },
  {
    slug: "coban-salatasi",
    name: "Çoban Salatası",
    category: "Salata/meze",
    timeMinutes: 15,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Domates", 4, "adet", { preparation: "küçük doğranmış" }),
      ingredient("Salatalık", 2, "adet", { preparation: "küçük doğranmış" }),
      ingredient("Yeşil biber", 2, "adet", { preparation: "doğranmış" }),
      ingredient("Soğan", 1, "adet", { preparation: "ince doğranmış" }),
      ingredient("Maydanoz", 1, "demet", { preparation: "doğranmış" }),
      ingredient("Zeytinyağı", 4, "yemek kaşığı"),
      ingredient("Limon suyu", 2, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Domates, salatalık, biber ve soğanı küçük doğrayıp kaseye al.",
      "Maydanozu ekleyip sebzeleri karıştır.",
      "Zeytinyağı, limon suyu ve tuzu ayrı kapta çırp.",
      "Sosu salatanın üzerine döküp servis et.",
    ],
  },
  {
    slug: "kisir",
    name: "Kısır",
    category: "Salata/meze",
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 6,
    diets: ["vegan", "vegetarian"],
    ingredients: [
      ingredient("İnce bulgur", 2, "su bardağı"),
      ingredient("Su", 2, "su bardağı", { preparation: "sıcak" }),
      ingredient("Domates salçası", 2, "yemek kaşığı"),
      ingredient("Biber salçası", 1, "yemek kaşığı"),
      ingredient("Soğan", 1, "adet", { preparation: "ince doğranmış" }),
      ingredient("Maydanoz", 1, "demet", { preparation: "doğranmış" }),
      ingredient("Taze soğan", 4, "adet", { preparation: "doğranmış" }),
      ingredient("Zeytinyağı", 5, "yemek kaşığı"),
      ingredient("Limon suyu", 3, "yemek kaşığı"),
      ingredient("Nar ekşisi", 2, "yemek kaşığı", { optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
      ingredient("Pul biber", 1, "çay kaşığı", { optional: true }),
    ],
    steps: [
      "İnce bulguru sıcak suyla ıslatıp üzerini kapat ve 15 dakika beklet.",
      "Soğanı zeytinyağında yumuşatıp salçaları ekleyerek kavur.",
      "Salçalı karışımı bulgura ekleyip iyice yoğur.",
      "Maydanoz, taze soğan, limon suyu, nar ekşisi ve baharatları karıştır.",
      "Kısırı dinlendirip marul yapraklarıyla servis et.",
    ],
  },
  {
    slug: "haydari",
    name: "Haydari",
    category: "Salata/meze",
    timeMinutes: 20,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegetarian", "gluten_free", "low_carb"],
    ingredients: [
      ingredient("Süzme yoğurt", 2, "su bardağı"),
      ingredient("Beyaz peynir", 100, "gram", { preparation: "ezilmiş" }),
      ingredient("Sarımsak", 2, "diş", { preparation: "ezilmiş" }),
      ingredient("Tereyağı", 1, "yemek kaşığı"),
      ingredient("Kuru nane", 1, "tatlı kaşığı"),
      ingredient("Dereotu", 2, "yemek kaşığı", { preparation: "doğranmış", optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "isteğe göre" }),
    ],
    steps: [
      "Tereyağında kuru naneyi kısa süre kızdırıp soğumaya bırak.",
      "Süzme yoğurt, beyaz peynir ve sarımsağı karıştır.",
      "Naneli tereyağı, dereotu ve tuzu ekleyip pürüzsüz olana kadar karıştır.",
      "Haydarinin üzerini düzeltip soğuk servis et.",
    ],
  },
  {
    slug: "patlican-salatasi",
    name: "Patlıcan Salatası",
    category: "Salata/meze",
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Patlıcan", 4, "adet"),
      ingredient("Kırmızı biber", 2, "adet", { optional: true }),
      ingredient("Sarımsak", 2, "diş", { preparation: "ezilmiş" }),
      ingredient("Zeytinyağı", 4, "yemek kaşığı"),
      ingredient("Limon suyu", 2, "yemek kaşığı"),
      ingredient("Maydanoz", 0.5, "demet", { preparation: "doğranmış", optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Patlıcan ve biberleri közleyip kabuklarını soy.",
      "Közlenmiş sebzeleri bıçakla ince kıy.",
      "Sarımsak, zeytinyağı, limon suyu ve tuzla karıştır.",
      "Maydanozla süsleyip soğuk servis et.",
    ],
  },
  {
    slug: "baklava",
    name: "Baklava",
    category: "Tatlı",
    timeMinutes: 120,
    difficulty: "Zor",
    baseServings: 12,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Baklavalık yufka", 1, "paket"),
      ingredient("Ceviz içi", 300, "gram", { preparation: "iri çekilmiş" }),
      ingredient("Tereyağı", 250, "gram", { preparation: "eritilmiş" }),
      ingredient("Toz şeker", 3, "su bardağı"),
      ingredient("Su", 3, "su bardağı"),
      ingredient("Limon suyu", 1, "tatlı kaşığı"),
    ],
    steps: [
      "Su ve şekeri kaynatıp limon suyunu ekleyerek şerbeti hazırla ve soğut.",
      "Tepsiyi yağlayıp yufkaların yarısını aralarına tereyağı sürerek diz.",
      "Cevizi tepsiye eşit şekilde yay.",
      "Kalan yufkaları da tereyağıyla kat kat yerleştirip baklavayı dilimle.",
      "180 derece fırında üzeri kızarana kadar pişir.",
      "Sıcak baklavaya soğuk şerbeti döküp dinlendir.",
    ],
  },
  {
    slug: "sutlac",
    name: "Sütlaç",
    category: "Tatlı",
    timeMinutes: 55,
    difficulty: "Kolay",
    baseServings: 6,
    diets: ["vegetarian", "gluten_free"],
    ingredients: [
      ingredient("Süt", 1, "litre"),
      ingredient("Pirinç", 1, "çay bardağı"),
      ingredient("Su", 2, "su bardağı"),
      ingredient("Toz şeker", 1, "su bardağı"),
      ingredient("Mısır nişastası", 1, "yemek kaşığı", { optional: true }),
      ingredient("Vanilin", 1, "paket", { optional: true }),
      ingredient("Tarçın", null, "tutam", { quantityText: "servis için, isteğe göre", optional: true }),
    ],
    steps: [
      "Pirinci yıkayıp suyla tamamen yumuşayana kadar haşla.",
      "Sütü ve şekeri ekleyip karıştırarak kaynat.",
      "Daha koyu bir kıvam için nişastayı az suyla açıp tencereye ekle.",
      "Vanilini ekleyip birkaç dakika daha pişir.",
      "Sütlacı kaselere paylaştırıp soğut ve tarçınla servis et.",
    ],
  },
  {
    slug: "revani",
    name: "Revani",
    category: "Tatlı",
    timeMinutes: 70,
    difficulty: "Orta",
    baseServings: 10,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Yumurta", 3, "adet"),
      ingredient("Toz şeker", 4, "su bardağı", {
        preparation: "1 su bardağı hamur, 3 su bardağı şerbet için",
      }),
      ingredient("Yoğurt", 1, "su bardağı"),
      ingredient("İrmik", 1, "su bardağı"),
      ingredient("Un", 1, "su bardağı"),
      ingredient("Sıvı yağ", 0.5, "su bardağı"),
      ingredient("Kabartma tozu", 1, "paket"),
      ingredient("Limon kabuğu", 1, "tatlı kaşığı", { preparation: "rendelenmiş", optional: true }),
      ingredient("Su", 3, "su bardağı"),
      ingredient("Limon suyu", 1, "tatlı kaşığı"),
    ],
    steps: [
      "Su ve şekeri kaynatıp limon suyunu ekleyerek şerbeti hazırla ve soğut.",
      "Yumurta ve şekeri köpürene kadar çırp.",
      "Yoğurt, sıvı yağ, irmik, un, kabartma tozu ve limon kabuğunu ekleyip karıştır.",
      "Karışımı yağlanmış tepsiye dök.",
      "180 derece fırında üzeri kızarana kadar pişir.",
      "Sıcak revaninin üzerine soğuk şerbeti döküp dinlendir.",
    ],
  },
  {
    slug: "cilbir", name: "Çılbır", category: "Kahvaltı", cuisine: "Türk Mutfağı", mealType: "Kahvaltı", cookingMethod: "Tencere", budgetLevel: "Düşük", estimatedCostPerServing: 40, timeMinutes: 15, difficulty: "Kolay", baseServings: 2,
    diets: ["vegetarian", "gluten_free", "low_carb"],
    ingredients: [ingredient("Yumurta", 4, "adet"), ingredient("Yoğurt", 1, "su bardağı"), ingredient("Sarımsak", 1, "diş"), ingredient("Tereyağı", 2, "yemek kaşığı"), ingredient("Pul biber", 1, "çay kaşığı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Yoğurdu sarımsak ve tuzla karıştır.", "Yumurtaları kaynayan suda poşe et.", "Tereyağında pul biberi kızdır.", "Yumurtaları yoğurt üzerine alıp biberli yağla servis et."],
  },
  {
    slug: "sebzeli-omlet", name: "Sebzeli Omlet", category: "Kahvaltı", cuisine: "Türk Mutfağı", mealType: "Kahvaltı", cookingMethod: "Tava", budgetLevel: "Düşük", estimatedCostPerServing: 45, timeMinutes: 20, difficulty: "Kolay", baseServings: 2,
    diets: ["vegetarian", "gluten_free", "low_carb"],
    ingredients: [ingredient("Yumurta", 4, "adet"), ingredient("Mantar", 100, "gram"), ingredient("Kabak", 1, "adet"), ingredient("Bezelye", 100, "gram", { optional: true }), ingredient("Yeşil biber", 1, "adet"), ingredient("Kaşar peyniri", 50, "gram", { optional: true }), ingredient("Sıvı yağ", 1, "yemek kaşığı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Mantar, kabak ve biberi yağda sotele.", "Çırpılmış yumurtayı sebzelerin üzerine dök.", "Kaşar peynirini serpiştirip omleti pişir.", "İkiye katlayıp sıcak servis et."],
  },
  {
    slug: "peynirli-sahanda-yumurta", name: "Peynirli Sahanda Yumurta", category: "Kahvaltı", cuisine: "Türk Mutfağı", timeMinutes: 15, difficulty: "Kolay", baseServings: 2,
    diets: ["vegetarian", "gluten_free", "low_carb"],
    ingredients: [ingredient("Yumurta", 4, "adet"), ingredient("Beyaz peynir", 100, "gram"), ingredient("Domates", 1, "adet"), ingredient("Tereyağı", 1, "yemek kaşığı"), ingredient("Kırmızı biber", 0.5, "adet", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Domates ve biberi tereyağında pişir.", "Beyaz peyniri ekleyip karıştır.", "Yumurtaları üzerine kırıp kapağı kapat.", "Yumurta akları pişince servis et."],
  },
  {
    slug: "domates-corbasi", name: "Domates Çorbası", category: "Çorba", cuisine: "Türk Mutfağı", mealType: "Akşam", cookingMethod: "Tencere", budgetLevel: "Düşük", estimatedCostPerServing: 30, timeMinutes: 30, difficulty: "Kolay", baseServings: 4,
    diets: ["vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Domates", 5, "adet"), ingredient("Domates salçası", 1, "yemek kaşığı"), ingredient("Soğan", 1, "adet"), ingredient("Sarımsak", 1, "diş", { optional: true }), ingredient("Zeytinyağı", 2, "yemek kaşığı"), ingredient("Su", 4, "su bardağı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }), ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" })],
    steps: ["Soğanı yağda kavurup salçayı ekle.", "Domates, sarımsak ve suyu ilave edip kaynat.", "Çorbayı blenderdan geçir.", "Tuz ve karabiberle servis et."],
  },
  {
    slug: "tavuk-suyu-corbasi", name: "Tavuk Suyu Çorbası", category: "Çorba", cuisine: "Türk Mutfağı", timeMinutes: 45, difficulty: "Kolay", baseServings: 4,
    diets: ["gluten_free"],
    ingredients: [ingredient("Tavuk göğsü", 300, "gram"), ingredient("Havuç", 1, "adet"), ingredient("Soğan", 1, "adet"), ingredient("Pirinç", 0.5, "su bardağı"), ingredient("Su", 6, "su bardağı"), ingredient("Limon suyu", 1, "yemek kaşığı", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Tavuğu soğan ve suyla haşla.", "Tavuğu didikleyip suyunu süz.", "Pirinç ve havucu tavuk suyunda pişir.", "Tavuğu ekleyip limon ve tuzla servis et."],
  },
  {
    slug: "mantar-corbasi", name: "Mantar Çorbası", category: "Çorba", cuisine: "İtalyan mutfağı", timeMinutes: 30, difficulty: "Kolay", baseServings: 4,
    diets: ["vegetarian", "gluten_free"],
    ingredients: [ingredient("Mantar", 400, "gram"), ingredient("Soğan", 1, "adet"), ingredient("Tereyağı", 2, "yemek kaşığı"), ingredient("Süt", 1, "su bardağı"), ingredient("Su", 3, "su bardağı"), ingredient("Sarımsak", 1, "diş", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }), ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" })],
    steps: ["Soğan ve sarımsağı tereyağında kavur.", "Mantarları ekleyip suyunu çektir.", "Süt ve suyu ekleyip kaynat.", "Bir kısmını blenderdan geçirip baharatla servis et."],
  },
  {
    slug: "sebze-corbasi", name: "Sebze Çorbası", category: "Çorba", cuisine: "Akdeniz mutfağı", timeMinutes: 35, difficulty: "Kolay", baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Kabak", 1, "adet"), ingredient("Brokoli", 200, "gram"), ingredient("Bezelye", 150, "gram", { optional: true }), ingredient("Havuç", 1, "adet"), ingredient("Soğan", 1, "adet"), ingredient("Zeytinyağı", 2, "yemek kaşığı"), ingredient("Su", 5, "su bardağı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Soğanı yağda yumuşat.", "Sebzeleri ekleyip birkaç dakika çevir.", "Suyu ekleyip sebzeler yumuşayana kadar pişir.", "Tuzlayıp taneli veya pürüzsüz servis et."],
  },
  {
    slug: "tavuk-sote", name: "Tavuk Sote", category: "Ana yemek", cuisine: "Türk Mutfağı", mealType: "Akşam", cookingMethod: "Tava", budgetLevel: "Orta", estimatedCostPerServing: 75, timeMinutes: 35, difficulty: "Kolay", baseServings: 4,
    diets: ["gluten_free", "low_carb"],
    ingredients: [ingredient("Tavuk göğsü", 500, "gram"), ingredient("Soğan", 1, "adet"), ingredient("Domates", 2, "adet"), ingredient("Yeşil biber", 2, "adet"), ingredient("Sarımsak", 2, "diş"), ingredient("Zeytinyağı", 3, "yemek kaşığı"), ingredient("Kekik", 1, "çay kaşığı", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Tavuğu yağda renk alana kadar sotele.", "Soğan ve biberi ekleyip yumuşat.", "Domates ve sarımsağı ilave edip pişir.", "Kekik ve tuzla servis et."],
  },
  {
    slug: "nohut-yemegi", name: "Nohut Yemeği", category: "Ana yemek", cuisine: "Türk Mutfağı", timeMinutes: 75, difficulty: "Orta", baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Nohut", 2, "su bardağı"), ingredient("Soğan", 1, "adet"), ingredient("Domates salçası", 1, "yemek kaşığı"), ingredient("Biber salçası", 1, "tatlı kaşığı", { optional: true }), ingredient("Zeytinyağı", 3, "yemek kaşığı"), ingredient("Su", 5, "su bardağı"), ingredient("Kimyon", 0.5, "çay kaşığı", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Nohudu haşla.", "Soğanı yağda kavurup salçaları ekle.", "Nohut ve suyu ilave edip kısık ateşte pişir.", "Kimyon ve tuzla servis et."],
  },
  {
    slug: "zeytinyagli-taze-fasulye", name: "Zeytinyağlı Taze Fasulye", category: "Ana yemek", cuisine: "Türk Mutfağı", timeMinutes: 50, difficulty: "Kolay", baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Taze fasulye", 600, "gram"), ingredient("Domates", 3, "adet"), ingredient("Soğan", 1, "adet"), ingredient("Sarımsak", 2, "diş", { optional: true }), ingredient("Zeytinyağı", 5, "yemek kaşığı"), ingredient("Su", 1, "su bardağı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Soğanı yağda kavur.", "Fasulyeyi ekleyip birkaç dakika çevir.", "Domates, sarımsak ve suyu ilave et.", "Fasulyeler yumuşayana kadar pişir."],
  },
  {
    slug: "firinda-somon", name: "Fırında Somon", category: "Ana yemek", cuisine: "Akdeniz mutfağı", mealType: "Akşam", cookingMethod: "Fırın", budgetLevel: "Yüksek", estimatedCostPerServing: 220, timeMinutes: 30, difficulty: "Kolay", baseServings: 2,
    diets: ["gluten_free", "low_carb", "low_calorie"],
    ingredients: [ingredient("Somon fileto", 400, "gram"), ingredient("Limon suyu", 2, "yemek kaşığı"), ingredient("Zeytinyağı", 2, "yemek kaşığı"), ingredient("Sarımsak", 1, "diş", { optional: true }), ingredient("Biberiye", 1, "dal", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }), ingredient("Karabiber", null, "tutam", { quantityText: "isteğe göre" })],
    steps: ["Somonları tepsiye yerleştir.", "Limon, yağ, sarımsak ve baharatları üzerine sür.", "200 derece fırında 20 dakika pişir.", "Sıcak servis et."],
  },
  {
    slug: "ratatouille", name: "Ratatouille", category: "Ana yemek", cuisine: "Akdeniz mutfağı", timeMinutes: 45, difficulty: "Orta", baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Kabak", 2, "adet"), ingredient("Patlıcan", 1, "adet"), ingredient("Domates", 4, "adet"), ingredient("Soğan", 1, "adet"), ingredient("Yeşil biber", 1, "adet"), ingredient("Zeytinyağı", 4, "yemek kaşığı"), ingredient("Fesleğen", 0.5, "demet", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Soğan ve biberi yağda yumuşat.", "Patlıcan ve kabağı ekleyip sotele.", "Domatesi ilave edip sebzeler yumuşayana kadar pişir.", "Fesleğen ve tuzla servis et."],
  },
  {
    slug: "pasta-arrabbiata", name: "Pasta Arrabbiata", category: "Ana yemek", cuisine: "İtalyan mutfağı", mealType: "Akşam", cookingMethod: "Tencere", budgetLevel: "Düşük", estimatedCostPerServing: 35, timeMinutes: 30, difficulty: "Kolay", baseServings: 4,
    diets: ["vegan", "vegetarian"],
    ingredients: [ingredient("Makarna", 350, "gram"), ingredient("Domates", 4, "adet"), ingredient("Sarımsak", 3, "diş"), ingredient("Zeytinyağı", 3, "yemek kaşığı"), ingredient("Pul biber", 1, "çay kaşığı"), ingredient("Fesleğen", 0.5, "demet", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Makarnayı tuzlu suda haşla.", "Sarımsağı yağda çevirip domates ve pul biberi ekle.", "Sosu koyulaşana kadar pişir.", "Makarnayı sosla karıştırıp fesleğenle servis et."],
  },
  {
    slug: "tavuklu-kori", name: "Tavuklu Köri", category: "Ana yemek", cuisine: "Asya mutfağı", timeMinutes: 40, difficulty: "Orta", baseServings: 4,
    diets: ["gluten_free"],
    ingredients: [ingredient("Tavuk göğsü", 500, "gram"), ingredient("Hindistan cevizi sütü", 400, "mililitre"), ingredient("Soğan", 1, "adet"), ingredient("Sarımsak", 2, "diş"), ingredient("Zencefil", 1, "tatlı kaşığı"), ingredient("Köri", 2, "çay kaşığı"), ingredient("Sıvı yağ", 2, "yemek kaşığı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Tavuğu yağda sotele.", "Soğan, sarımsak ve zencefili ekle.", "Köri ve Hindistan cevizi sütünü ilave et.", "Tavuk pişene kadar kaynatıp servis et."],
  },
  {
    slug: "chili-con-carne", name: "Chili con Carne", category: "Ana yemek", cuisine: "Meksika mutfağı", timeMinutes: 60, difficulty: "Orta", baseServings: 4,
    diets: ["gluten_free", "low_carb"],
    ingredients: [ingredient("Kıyma", 400, "gram"), ingredient("Kuru fasulye", 1, "su bardağı"), ingredient("Domates", 4, "adet"), ingredient("Soğan", 1, "adet"), ingredient("Yeşil biber", 1, "adet"), ingredient("Mısır", 1, "su bardağı", { optional: true }), ingredient("Kimyon", 1, "çay kaşığı"), ingredient("Pul biber", 1, "çay kaşığı"), ingredient("Zeytinyağı", 2, "yemek kaşığı")],
    steps: ["Soğan ve biberi yağda kavur.", "Kıymayı ekleyip suyunu çektir.", "Domates, fasulye, mısır ve baharatları ekle.", "Kısık ateşte 30 dakika pişir."],
  },
  {
    slug: "ispanakli-borek", name: "Ispanaklı Börek", category: "Hamur işi", cuisine: "Türk Mutfağı", timeMinutes: 60, difficulty: "Orta", baseServings: 6,
    diets: ["vegetarian"],
    ingredients: [ingredient("Yufka", 3, "adet"), ingredient("Ispanak", 500, "gram"), ingredient("Beyaz peynir", 150, "gram"), ingredient("Soğan", 1, "adet"), ingredient("Yumurta", 1, "adet"), ingredient("Yoğurt", 1, "su bardağı"), ingredient("Sıvı yağ", 0.5, "su bardağı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Soğanı kavurup ıspanağı suyunu çekene kadar pişir.", "Peynir ve tuzla iç harcı hazırla.", "Yoğurt, yumurta ve yağı çırpıp yufkaları sosla.", "Harçla katlayıp 180 derece fırında kızart."],
  },
  {
    slug: "peynirli-pide", name: "Peynirli Pide", category: "Hamur işi", cuisine: "Türk Mutfağı", timeMinutes: 55, difficulty: "Orta", baseServings: 4,
    diets: ["vegetarian"],
    ingredients: [ingredient("Un", 500, "gram"), ingredient("Kuru maya", 1, "paket"), ingredient("Beyaz peynir", 200, "gram"), ingredient("Kaşar peyniri", 100, "gram"), ingredient("Yumurta", 1, "adet", { optional: true }), ingredient("Su", 1.5, "su bardağı"), ingredient("Zeytinyağı", 2, "yemek kaşığı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Un, maya, su, yağ ve tuzla hamur yoğurup mayalandır.", "Hamuru dört parçaya bölüp aç.", "Peynirleri doldurup kenarları kapat.", "220 derece fırında kızarana kadar pişir."],
  },
  {
    slug: "pizza-margherita", name: "Pizza Margherita", category: "Hamur işi", cuisine: "İtalyan mutfağı", timeMinutes: 45, difficulty: "Orta", baseServings: 4,
    diets: ["vegetarian"],
    ingredients: [ingredient("Un", 400, "gram"), ingredient("Kuru maya", 1, "paket"), ingredient("Domates", 3, "adet"), ingredient("Mozzarella", 200, "gram"), ingredient("Fesleğen", 0.5, "demet", { optional: true }), ingredient("Zeytinyağı", 2, "yemek kaşığı"), ingredient("Su", 1.25, "su bardağı"), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Un, maya, su, yağ ve tuzla hamur yoğurup mayalandır.", "Hamuru açıp domatesi ve mozzarellayı yerleştir.", "240 derece fırında pişir.", "Fesleğenle servis et."],
  },
  {
    slug: "quesadilla", name: "Quesadilla", category: "Hamur işi", cuisine: "Meksika mutfağı", timeMinutes: 25, difficulty: "Kolay", baseServings: 2,
    diets: ["vegetarian"],
    ingredients: [ingredient("Tortilla", 4, "adet"), ingredient("Kaşar peyniri", 150, "gram"), ingredient("Mısır", 1, "su bardağı"), ingredient("Kırmızı biber", 1, "adet"), ingredient("Domates", 1, "adet"), ingredient("Zeytinyağı", 1, "yemek kaşığı"), ingredient("Kimyon", 0.5, "çay kaşığı", { optional: true })],
    steps: ["Biber ve domatesi yağda sotele.", "Tortillaya peynir, mısır ve sebzeleri yerleştir.", "Tortillayı kapatıp iki tarafını tavada kızart.", "Dilimleyip servis et."],
  },
  {
    slug: "humus", name: "Humus", category: "Salata/meze", cuisine: "Akdeniz mutfağı", mealType: "Atıştırmalık", cookingMethod: "Pişirme yok", budgetLevel: "Düşük", estimatedCostPerServing: 40, timeMinutes: 20, difficulty: "Kolay", baseServings: 4,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Nohut", 2, "su bardağı"), ingredient("Tahin", 3, "yemek kaşığı"), ingredient("Limon suyu", 3, "yemek kaşığı"), ingredient("Sarımsak", 1, "diş"), ingredient("Zeytinyağı", 3, "yemek kaşığı"), ingredient("Su", 0.5, "su bardağı"), ingredient("Kimyon", 0.5, "çay kaşığı", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Nohut, tahin, limon, sarımsak ve kimyonu blendera al.", "Su ekleyerek pürüzsüz çek.", "Tuzla tatlandırıp tabağa al.", "Zeytinyağı gezdirerek servis et."],
  },
  {
    slug: "caprese-salatasi", name: "Caprese Salatası", category: "Salata/meze", cuisine: "İtalyan mutfağı", mealType: "Öğle", cookingMethod: "Pişirme yok", budgetLevel: "Orta", estimatedCostPerServing: 95, timeMinutes: 15, difficulty: "Kolay", baseServings: 2,
    diets: ["vegetarian", "gluten_free", "low_carb"],
    ingredients: [ingredient("Domates", 3, "adet"), ingredient("Mozzarella", 200, "gram"), ingredient("Fesleğen", 0.5, "demet", { optional: true }), ingredient("Zeytinyağı", 2, "yemek kaşığı"), ingredient("Limon suyu", 1, "yemek kaşığı", { optional: true }), ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" })],
    steps: ["Domates ve mozzarellayı dilimleyip sırayla diz.", "Fesleğen yapraklarını aralara yerleştir.", "Yağ, limon ve tuz gezdir.", "Bekletmeden servis et."],
  },
  {
    slug: "asya-usulu-salatalik-salatasi", name: "Asya Usulü Salatalık Salatası", category: "Salata/meze", cuisine: "Asya mutfağı", timeMinutes: 15, difficulty: "Kolay", baseServings: 2,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Salatalık", 3, "adet"), ingredient("Ton balığı", 1, "kutu", { optional: true }), ingredient("Pirinç sirkesi", 2, "yemek kaşığı"), ingredient("Soya sosu", 1, "yemek kaşığı"), ingredient("Susam yağı", 1, "tatlı kaşığı"), ingredient("Zencefil", 0.5, "tatlı kaşığı", { optional: true }), ingredient("Susam", 1, "yemek kaşığı", { optional: true }), ingredient("Pul biber", 0.5, "çay kaşığı", { optional: true })],
    steps: ["Salatalıkları kaseye al.", "Sirke, soya sosu, susam yağı ve zencefili karıştır.", "Sosu salatalıklarla harmanlayıp dinlendir.", "Susam ve pul biberle servis et."],
  },
  {
    slug: "tiramisu", name: "Tiramisu", category: "Tatlı", cuisine: "İtalyan mutfağı", timeMinutes: 90, difficulty: "Orta", baseServings: 8,
    diets: ["vegetarian"],
    ingredients: [ingredient("Kedi dili", 1, "paket"), ingredient("Mascarpone", 250, "gram"), ingredient("Yumurta", 3, "adet"), ingredient("Toz şeker", 1, "su bardağı"), ingredient("Kahve", 2, "su bardağı"), ingredient("Kakao", 2, "yemek kaşığı", { optional: true })],
    steps: ["Yumurta sarısı, şeker ve mascarpone ile krema hazırla.", "Kedi dillerini kahveye batırıp kaba diz.", "Krema ile katları oluştur.", "Soğutup kakao serperek servis et."],
  },
  {
    slug: "chia-puding", name: "Chia Puding", category: "Tatlı", cuisine: "Asya mutfağı", timeMinutes: 10, difficulty: "Kolay", baseServings: 2,
    diets: ["vegetarian", "gluten_free", "low_calorie"],
    ingredients: [ingredient("Chia tohumu", 4, "yemek kaşığı"), ingredient("Hindistan cevizi sütü", 2, "su bardağı"), ingredient("Bal", 1, "yemek kaşığı", { optional: true }), ingredient("Muz", 1, "adet", { optional: true }), ingredient("Tarçın", 0.5, "çay kaşığı", { optional: true })],
    steps: ["Chia tohumlarını Hindistan cevizi sütüyle karıştır.", "Bal ve tarçın ekle.", "Buzdolabında en az 2 saat beklet.", "Muzla servis et."],
  },
  {
    slug: "tres-leches", name: "Tres Leches", category: "Tatlı", cuisine: "Meksika mutfağı", timeMinutes: 75, difficulty: "Orta", baseServings: 10,
    diets: ["vegetarian"],
    ingredients: [ingredient("Yumurta", 4, "adet"), ingredient("Un", 1.5, "su bardağı"), ingredient("Toz şeker", 1, "su bardağı"), ingredient("Süt", 2, "su bardağı"), ingredient("Yoğunlaştırılmış süt", 1, "kutu"), ingredient("Krema", 1, "su bardağı"), ingredient("Vanilin", 1, "paket", { optional: true })],
    steps: ["Yumurta, şeker, un ve vanilinle kek harcı hazırla.", "180 derece fırında pişir.", "Süt, yoğunlaştırılmış süt ve kremayı karıştır.", "Kek ılınınca sütlü karışımı döküp soğuk servis et."],
  },
];

type CatalogGroup = {
  cuisine: string;
  category: string;
  names: string[];
  ingredientSets: string[][];
  times: number[];
  diets: string[][];
};

const catalogMeasures: Record<string, [number, string]> = {
  "Tavuk göğsü": [300, "gram"], Tavuk: [300, "gram"],
  "Dana eti": [300, "gram"], Kıyma: [300, "gram"], "Kuzu eti": [300, "gram"],
  "Somon fileto": [250, "gram"], "Ton balığı": [1, "kutu"], Karides: [250, "gram"],
  Mantar: [200, "gram"], Kabak: [2, "adet"], Patlıcan: [2, "adet"], Brokoli: [250, "gram"],
  Karnabahar: [300, "gram"], Ispanak: [300, "gram"], Bezelye: [150, "gram"], Mısır: [1, "su bardağı"],
  Domates: [3, "adet"], "Çeri domates": [250, "gram"], Soğan: [1, "adet"], "Kırmızı soğan": [1, "adet"],
  "Yeşil biber": [2, "adet"], "Kırmızı biber": [1, "adet"], Havuç: [2, "adet"], Patates: [3, "adet"],
  "Tatlı patates": [2, "adet"], Salatalık: [2, "adet"], Avokado: [1, "adet"], Lahana: [300, "gram"],
  "Taze fasulye": [400, "gram"], Nohut: [1, "su bardağı"], Mercimek: [1, "su bardağı"],
  "Kuru fasulye": [1, "su bardağı"], Pirinç: [1, "su bardağı"], Makarna: [300, "gram"],
  Spagetti: [300, "gram"], "Pirinç eriştesi": [250, "gram"], "Tortilla": [4, "adet"],
  Un: [300, "gram"], Yufka: [2, "adet"], Ekmek: [4, "dilim"], Yumurta: [2, "adet"],
  Yoğurt: [1, "su bardağı"], "Hindistan cevizi sütü": [200, "mililitre"], Süt: [1, "su bardağı"],
  "Beyaz peynir": [100, "gram"], "Kaşar peyniri": [100, "gram"], Mozzarella: [125, "gram"],
  Parmesan: [50, "gram"], Tofu: [250, "gram"], Tahin: [2, "yemek kaşığı"],
  "Zeytinyağı": [2, "yemek kaşığı"], "Sıvı yağ": [2, "yemek kaşığı"], "Limon suyu": [2, "yemek kaşığı"],
  "Soya sosu": [2, "yemek kaşığı"], "Domates sosu": [1, "su bardağı"], "Kırmızı köri": [1, "yemek kaşığı"],
  "Taze fesleğen": [0.5, "demet"], Maydanoz: [0.5, "demet"], Kişniş: [0.5, "demet"],
  Fesleğen: [0.5, "demet"], Sarımsak: [2, "diş"], Zencefil: [1, "tatlı kaşığı"],
  "Elma sirkesi": [1, "yemek kaşığı"], "Pirinç sirkesi": [1, "yemek kaşığı"],
  "Balzamik sirke": [1, "yemek kaşığı"], "Akçaağaç şurubu": [1, "yemek kaşığı"],
};

function catalogIngredient(name: string): SeedIngredient {
  const [quantity, unit] = catalogMeasures[name] ?? [1, "adet"];
  return ingredient(name, quantity, unit);
}

function formatSeedAmount(item: SeedIngredient): string {
  if (item.quantity === null) return item.quantityText ?? item.unit;

  if (item.unit === "mililitre" || item.unit === "ml") {
    const glasses = item.quantity / 200;
    if (glasses >= 1) {
      return `${glasses.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} su bardağı`;
    }
    return `${(item.quantity / 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} çay bardağı`;
  }

  if (item.unit === "litre") {
    return `${(item.quantity * 5).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} su bardağı`;
  }

  const amount = Number.isInteger(item.quantity)
    ? String(item.quantity)
    : item.quantity.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  return `${amount} ${item.unit}`;
}

function catalogSteps(
  name: string,
  category: string,
  items: SeedIngredient[]
): string[] {
  const measuredIngredients = items
    .map((item) => `${item.name} (${formatSeedAmount(item)})`)
    .join(", ");
  const mainIngredient = items[0]?.name ?? "ana malzeme";
  const supportingIngredients = items
    .slice(1, 4)
    .map((item) => item.name)
    .join(", ");

  const preparation = `Ön hazırlık: ${measuredIngredients} malzemelerini tezgâha çıkar. ${supportingIngredients || "Diğer malzemeleri"} tarifte kullanılacak şekilde yıka, gerekiyorsa doğra veya rendele.`;

  if (category === "Çorba") {
    return [
      preparation,
      `Orta boy tencereyi ısıt. ${mainIngredient} ve doğranan malzemeleri az yağla orta ateşte 3-4 dakika, renkleri dönene kadar karıştırarak sotele.`,
      "Baharatları ekleyip 30 saniye daha karıştır; bu aşama baharatların kokusunu açar.",
      "Üzerini iki parmak geçecek kadar sıcak su ekle. Kaynayınca ocağı kıs ve kapağı yarı açık şekilde malzemeler tamamen yumuşayana kadar 20-25 dakika pişir.",
      "Kıvamı kontrol et; gerekirse biraz sıcak su ekle. İstersen blenderdan geçir, tuzunu en son ayarlayıp 2 dakika dinlendirerek sıcak servis et.",
    ];
  }

  if (category === "Salata/meze") {
    return [
      preparation,
      `${mainIngredient} ve diğer taze malzemeleri eşit büyüklükte doğrayıp geniş bir karıştırma kabına al.`,
      "Sos için yağ, limon veya sirke ve baharatları küçük bir kasede iyice çırp.",
      "Sosu servisten hemen önce malzemelerin üzerine gezdirip ezmeden nazikçe harmanla.",
      "Tadını kontrol edip tuzunu ayarla. 5 dakika dinlendirip soğuk veya oda sıcaklığında servis et.",
    ];
  }

  if (category === "Tatlı") {
    return [
      preparation,
      "Sıvı ve kuru malzemeleri ayrı kaplarda karıştır; toz malzemeleri eklerken topaklanmaması için çırpıcı kullan.",
      "Karışımı pürüzsüz olana kadar 1-2 dakika çırp. Pişecek tatlılarda kısık-orta ateşte sürekli karıştırarak kıvam aldır.",
      "Kıvam alan karışımı servis kaplarına paylaştır veya tarifin kalıbına aktar. Fırın kullanılıyorsa önceden ısıtılmış fırında üstü hafif renk alana kadar pişir.",
      "Önce oda sıcaklığına gelmesini bekle, ardından gerekiyorsa buzdolabında en az 30 dakika dinlendir. Porsiyonlayıp servis et.",
    ];
  }

  if (category === "Hamur işi") {
    return [
      preparation,
      "Hamur veya ekmek tabanı kullanılacaksa çalışma yüzeyini hafifçe unla. İç malzemeleri ayrı bir kapta karıştırıp tuz ve baharatını ayarla.",
      "Tabanı aç veya hazır yufkayı ser. İç harcı kenarlarda 1-2 parmak boşluk kalacak şekilde yay ve istediğin biçimde kapat.",
      "Tavada yapılacak tarifleri orta ateşte iki yüzü kızarana kadar çevirerek; fırın tariflerini ise önceden ısıtılmış fırında üstü altın rengi olana kadar pişir.",
      "Pişen hamur işini 3-4 dakika dinlendir. Dilimleyip sıcak servis et.",
    ];
  }

  return [
    preparation,
    `${mainIngredient} ve sert sebzeleri geniş bir tava veya tencerede orta ateşte 3-4 dakika çevirerek pişirmeye başla.`,
    "Diğer malzemeleri sırasıyla ekle; her eklemeden sonra malzemelerin birbirine karışması için 1 dakika karıştır.",
    "Baharatları ve gerekiyorsa sıcak suyu ekle. Kapağı kapalı, kısık-orta ateşte malzemeler yumuşayana ve sos kıvam alana kadar 15-20 dakika pişir.",
    "Tuzunu en son kontrol et. Ocağı kapatıp 3 dakika dinlendir, ardından sıcak servis et.",
  ];
}

function catalogMealType(category: string): string {
  if (category === "Kahvaltı") return "Kahvaltı";
  if (category === "Tatlı") return "Tatlı";
  if (category === "Salata/meze") return "Öğle";
  if (category === "Hamur işi") return "Atıştırmalık";
  return "Akşam";
}

function catalogCookingMethod(name: string, category: string): string {
  const normalizedName = normalizeIngredientName(name);
  if (category === "Çorba") return "Tencere";
  if (category === "Salata/meze") return "Pişirme yok";
  if (category === "Kahvaltı") return "Tava";
  if (normalizedName.includes("sorbe") || normalizedName.includes("puding")) {
    return "Pişirme yok";
  }
  if (
    normalizedName.includes("tost") ||
    normalizedName.includes("gozleme") ||
    normalizedName.includes("krep") ||
    normalizedName.includes("quesadilla")
  ) {
    return "Tava";
  }
  if (normalizedName.includes("humus") || normalizedName.includes("guacamole")) {
    return "Pişirme yok";
  }
  if (
    category === "Hamur işi" ||
    normalizedName.includes("firin") ||
    normalizedName.includes("graten") ||
    normalizedName.includes("lazanya") ||
    normalizedName.includes("pizza")
  ) {
    return "Fırın";
  }
  if (
    normalizedName.includes("wok") ||
    normalizedName.includes("sote") ||
    normalizedName.includes("omlet") ||
    normalizedName.includes("tava") ||
    normalizedName.includes("krep")
  ) {
    return "Tava";
  }
  return "Tencere";
}

function catalogBudgetLevel(name: string, category: string): string {
  const normalizedName = normalizeIngredientName(name);
  const premiumIngredients = [
    "somon",
    "karides",
    "kuzu",
    "dana",
    "biftek",
    "ton baligi",
    "parmesan",
    "avokado",
  ];

  if (premiumIngredients.some((item) => normalizedName.includes(item))) {
    return "Yüksek";
  }
  if (
    category === "Kahvaltı" ||
    category === "Çorba" ||
    category === "Salata/meze" ||
    category === "Hamur işi"
  ) {
    return "Düşük";
  }
  return "Orta";
}

function buildCatalogGroups(groups: CatalogGroup[]): SeedRecipe[] {
  return groups.flatMap((group) =>
    group.names.map((name, index) => {
      const slug = normalizeIngredientName(name).replace(/ /g, "-");
      return {
        slug,
        name,
        category: group.category,
        cuisine: group.cuisine,
        mealType: catalogMealType(group.category),
        cookingMethod: catalogCookingMethod(name, group.category),
        budgetLevel: catalogBudgetLevel(name, group.category),
        timeMinutes: group.times[index % group.times.length],
        difficulty: group.times[index % group.times.length] <= 20 ? "Kolay" : index % 3 === 0 ? "Zor" : "Orta",
        baseServings: [1, 2, 3, 4][index % 4],
        diets: group.diets[index % group.diets.length],
        ingredients: group.ingredientSets[index % group.ingredientSets.length].map(catalogIngredient),
        steps: catalogSteps(
          name,
          group.category,
          group.ingredientSets[index % group.ingredientSets.length].map(catalogIngredient)
        ),
      } satisfies SeedRecipe;
    })
  );
}

const additionalRecipes = buildCatalogGroups([
  {
    cuisine: "Türk Mutfağı", category: "Ana yemek",
    names: ["Tavuklu Sebze Güveç", "Etli Bezelye", "Kabak Yemeği", "Brokolili Tavuk"],
    ingredientSets: [["Tavuk göğsü", "Kabak", "Domates", "Soğan", "Zeytinyağı"], ["Kıyma", "Bezelye", "Havuç", "Domates", "Soğan"], ["Kabak", "Domates", "Soğan", "Sarımsak", "Zeytinyağı"], ["Tavuk göğsü", "Brokoli", "Havuç", "Sarımsak", "Zeytinyağı"]],
    times: [15, 30, 45, 60], diets: [["gluten_free"], ["vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free", "low_calorie"], ["gluten_free", "low_carb"]],
  },
  {
    cuisine: "Türk Mutfağı", category: "Çorba",
    names: ["Sebzeli Mercimek Çorbası", "Brokoli Çorbası"],
    ingredientSets: [["Mercimek", "Havuç", "Soğan", "Zeytinyağı"], ["Brokoli", "Patates", "Soğan", "Süt"], ["Mantar", "Soğan", "Süt", "Tereyağı"], ["Tavuk göğsü", "Havuç", "Soğan", "Yumurta"]],
    times: [15, 30, 45], diets: [["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegetarian", "gluten_free"], ["gluten_free"], ["vegetarian"]],
  },
  {
    cuisine: "Türk Mutfağı", category: "Kahvaltı",
    names: ["Yoğurtlu Salatalık", "Bezelyeli Omlet"],
    ingredientSets: [["Yoğurt", "Salatalık", "Sarımsak", "Zeytinyağı"], ["Yumurta", "Bezelye", "Beyaz peynir", "Yeşil biber"], ["Yumurta", "Ispanak", "Beyaz peynir", "Soğan"], ["Yumurta", "Mantar", "Domates", "Yeşil biber"]],
    times: [10, 15, 20], diets: [["vegetarian", "gluten_free", "low_calorie"], ["vegetarian", "gluten_free", "low_carb"], ["vegetarian", "gluten_free"], ["vegetarian"]],
  },
  {
    cuisine: "Türk Mutfağı", category: "Salata/meze",
    names: [],
    ingredientSets: [["Mercimek", "İnce bulgur", "Soğan", "Maydanoz"], ["Kabak", "Yoğurt", "Sarımsak", "Zeytinyağı"], ["Brokoli", "Yoğurt", "Limon suyu", "Sarımsak"], ["Mısır", "Domates", "Salatalık", "Limon suyu"]],
    times: [15, 20, 30], diets: [["vegan", "vegetarian"], ["vegetarian", "gluten_free"], ["vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Türk Mutfağı", category: "Hamur işi",
    names: [],
    ingredientSets: [["Yufka", "Patates", "Soğan", "Sıvı yağ"], ["Un", "Ispanak", "Beyaz peynir", "Yoğurt"], ["Un", "Beyaz peynir", "Tereyağı", "Yumurta"], ["Yufka", "Tavuk göğsü", "Soğan", "Yoğurt"]],
    times: [30, 45, 60], diets: [["vegetarian"], ["vegetarian"], ["vegetarian"], []],
  },
  {
    cuisine: "Türk Mutfağı", category: "Tatlı",
    names: [],
    ingredientSets: [["İncir", "Ceviz içi", "Yoğurt"], ["Süt", "Pirinç", "Toz şeker", "Vanilin"], ["Yoğurt", "Şeftali", "Bal"], ["Hurma", "Ceviz içi", "Tarçın"], ["Elma", "İrmik", "Süt", "Tarçın"]],
    times: [10, 30, 45], diets: [["vegan", "vegetarian", "gluten_free"], ["vegetarian", "gluten_free"], ["vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"], ["vegetarian"]],
  },
  {
    cuisine: "İtalyan mutfağı", category: "Ana yemek",
    names: ["Sebzeli Risotto", "Mantarlı Risotto", "Limonlu Tavuk", "Pesto Tavuk", "Melanzane alla Parmigiana", "Polenta Sebzeli", "Gnocchi Domates Soslu", "Lazanya Sebzeli", "Penne Puttanesca", "Spagetti Carbonara", "Fırın Makarna", "Tavuklu Pesto Makarna"],
    ingredientSets: [["Pirinç", "Mantar", "Soğan", "Parmesan"], ["Pirinç", "Mantar", "Soğan", "Parmesan"], ["Tavuk göğsü", "Limon suyu", "Sarımsak", "Zeytinyağı"], ["Tavuk göğsü", "Taze fesleğen", "Mozzarella", "Domates"], ["Patlıcan", "Domates sosu", "Mozzarella", "Parmesan"], ["Mısır unu", "Kabak", "Domates", "Zeytinyağı"]],
    times: [20, 30, 45, 60], diets: [["vegetarian", "gluten_free"], ["vegetarian"], ["gluten_free", "low_carb"], ["gluten_free"], ["vegetarian"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "İtalyan mutfağı", category: "Çorba",
    names: ["Minestrone", "Stracciatella Çorbası", "Zuppa di Ceci", "Kremalı Kabak Çorbası", "Mercimekli İtalyan Çorbası"],
    ingredientSets: [["Kabak", "Havuç", "Domates", "Makarna"], ["Yumurta", "Parmesan", "Ispanak", "Su"], ["Nohut", "Domates", "Soğan", "Zeytinyağı"], ["Kabak", "Soğan", "Süt", "Tereyağı"]],
    times: [15, 30, 45], diets: [["vegan", "vegetarian"], ["vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free"], ["vegetarian", "gluten_free"]],
  },
  {
    cuisine: "İtalyan mutfağı", category: "Salata/meze",
    names: ["Bruschetta", "Panzanella", "Roka Parmesan Salatası", "Fasulye Ton Balığı Salatası", "İtalyan Mercimek Salatası"],
    ingredientSets: [["Ekmek", "Domates", "Taze fesleğen", "Zeytinyağı"], ["Ekmek", "Domates", "Salatalık", "Kırmızı soğan"], ["Roka", "Parmesan", "Limon suyu", "Zeytinyağı"], ["Kuru fasulye", "Ton balığı", "Kırmızı soğan", "Limon suyu"]],
    times: [10, 15, 20, 30], diets: [["vegan", "vegetarian"], ["vegan", "vegetarian"], ["vegetarian", "gluten_free", "low_carb"], ["gluten_free", "low_carb"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "İtalyan mutfağı", category: "Tatlı",
    names: ["Panna Cotta", "Zabaglione", "Limonlu Sorbe", "Bademli Biscotti", "Affogato"],
    ingredientSets: [["Krema", "Süt", "Toz şeker", "Vanilin"], ["Yumurta", "Toz şeker", "Kahve"], ["Limon suyu", "Toz şeker", "Su"], ["Un", "Badem", "Yumurta", "Toz şeker"], ["Kahve", "Dondurma"]],
    times: [10, 30, 45, 60], diets: [["vegetarian", "gluten_free"], ["vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegetarian"], ["vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Asya mutfağı", category: "Ana yemek",
    names: ["Sebzeli Tofu Wok", "Tavuklu Teriyaki", "Pad Thai", "Sushi Bowl", "Kore Usulü Dana", "Sebzeli Udon", "Miso Noodle", "Tayland Fesleğenli Tavuk", "Kore Usulü Tofu", "Hindistan Cevizli Sebze", "Soya Soslu Mantar", "Asya Usulü Balık"],
    ingredientSets: [["Tofu", "Brokoli", "Havuç", "Soya sosu"], ["Tavuk göğsü", "Soya sosu", "Zencefil", "Mısır"], ["Pirinç eriştesi", "Yumurta", "Mısır", "Soya sosu"], ["Pirinç", "Avokado", "Salatalık", "Ton balığı"], ["Dana eti", "Soğan", "Soya sosu", "Zencefil"], ["Makarna", "Brokoli", "Mantar", "Soya sosu"]],
    times: [15, 25, 30, 45], diets: [["vegan", "vegetarian"], ["gluten_free"], ["vegetarian"], ["gluten_free", "low_calorie"], ["gluten_free", "low_carb"], ["vegan", "vegetarian"]],
  },
  {
    cuisine: "Asya mutfağı", category: "Çorba",
    names: ["Miso Çorbası", "Tom Yum", "Ramen Sebzeli", "Hindistan Cevizli Mercimek Çorbası", "Kore Tofu Çorbası"],
    ingredientSets: [["Tofu", "Mantar", "Soğan", "Soya sosu"], ["Karides", "Mantar", "Limon suyu", "Kırmızı köri"], ["Makarna", "Mantar", "Brokoli", "Yumurta"], ["Mercimek", "Hindistan cevizi sütü", "Havuç", "Zencefil"]],
    times: [15, 30, 45], diets: [["vegan", "vegetarian", "gluten_free"], ["gluten_free", "low_calorie"], ["vegetarian"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Asya mutfağı", category: "Salata/meze",
    names: ["Edamame Salatası", "Vietnam Usulü Lahana Salatası", "Susamlı Brokoli", "Mango Avokado Salatası", "Kore Salatalık Mezesi"],
    ingredientSets: [["Bezelye", "Salatalık", "Susam yağı", "Limon suyu"], ["Lahana", "Havuç", "Kişniş", "Pirinç sirkesi"], ["Brokoli", "Susam", "Soya sosu", "Susam yağı"], ["Mango", "Avokado", "Kırmızı soğan", "Limon suyu"]],
    times: [10, 15, 20, 30], diets: [["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian"], ["vegan", "vegetarian", "gluten_free", "low_calorie"]],
  },
  {
    cuisine: "Meksika mutfağı", category: "Ana yemek",
    names: ["Tavuklu Fajita", "Sebzeli Burrito", "Enchilada Tavuklu", "Fasulyeli Tacos", "Meksika Pilavı", "Mısır ve Kabak Sotesi", "Balıklı Taco", "Etli Nachos", "Kırmızı Fasulye Güveci", "Tavuklu Mısır Kasesi"],
    ingredientSets: [["Tavuk göğsü", "Kırmızı biber", "Soğan", "Tortilla"], ["Nohut", "Mısır", "Avokado", "Tortilla"], ["Tavuk göğsü", "Domates sosu", "Mısır", "Kaşar peyniri"], ["Kuru fasulye", "Mısır", "Avokado", "Tortilla"], ["Pirinç", "Domates", "Mısır", "Kırmızı biber"]],
    times: [20, 30, 45, 60], diets: [["gluten_free"], ["vegan", "vegetarian"], ["gluten_free"], ["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Meksika mutfağı", category: "Çorba",
    names: ["Meksika Fasulye Çorbası", "Tortilla Çorbası", "Mısır Çorbası", "Acılı Domates Çorbası"],
    ingredientSets: [["Kuru fasulye", "Domates", "Mısır", "Soğan"], ["Domates", "Tortilla", "Avokado", "Soğan"], ["Mısır", "Patates", "Soğan", "Süt"], ["Domates", "Kırmızı biber", "Soğan", "Limon suyu"]],
    times: [15, 30, 45], diets: [["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian"], ["vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free", "low_calorie"]],
  },
  {
    cuisine: "Meksika mutfağı", category: "Salata/meze",
    names: ["Pico de Gallo", "Meksika Fasulye Salatası", "Mısır Salsa", "Avokadolu Nohut Salatası"],
    ingredientSets: [["Domates", "Kırmızı soğan", "Kişniş", "Limon suyu"], ["Kuru fasulye", "Mısır", "Domates", "Avokado"], ["Mısır", "Domates", "Kırmızı biber", "Limon suyu"], ["Nohut", "Avokado", "Salatalık", "Limon suyu"]],
    times: [10, 15, 20], diets: [["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Meksika mutfağı", category: "Tatlı",
    names: ["Meksika Churros", "Tarçınlı Mısır Tatlısı", "Mango Sorbe", "Kakaolu Avokado Puding"],
    ingredientSets: [["Un", "Yumurta", "Toz şeker", "Tarçın"], ["Mısır", "Süt", "Toz şeker", "Tarçın"], ["Mango", "Limon suyu", "Toz şeker"], ["Avokado", "Kakao", "Akçaağaç şurubu"]],
    times: [15, 30, 45], diets: [["vegetarian"], ["vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Akdeniz mutfağı", category: "Ana yemek",
    names: ["Ton Balıklı Nicoise", "Fırında Sebzeli Levrek", "Karidesli Kabak", "Zeytinli Tavuk", "Akdeniz Sebze Güveci", "Limonlu Karides", "Fırında Kuzu Sebzeli", "Mercimekli Akdeniz Tabağı", "Fesleğenli Tavuk", "Kabaklı Nohut Tavası"],
    ingredientSets: [["Ton balığı", "Yumurta", "Patates", "Salatalık"], ["Somon fileto", "Kabak", "Domates", "Limon suyu"], ["Karides", "Kabak", "Sarımsak", "Zeytinyağı"], ["Tavuk göğsü", "Zeytin", "Domates", "Kırmızı biber"], ["Patlıcan", "Kabak", "Domates", "Nohut"]],
    times: [20, 30, 45, 60], diets: [["gluten_free", "low_carb"], ["gluten_free", "low_calorie"], ["gluten_free", "low_carb"], ["gluten_free", "low_carb"], ["vegan", "vegetarian", "gluten_free", "low_calorie"]],
  },
  {
    cuisine: "Akdeniz mutfağı", category: "Çorba",
    names: ["Akdeniz Balık Çorbası", "Kabak ve Mercimek Çorbası", "Nohutlu Sebze Çorbası", "Limonlu Tavuk Çorbası"],
    ingredientSets: [["Somon fileto", "Domates", "Havuç", "Soğan"], ["Kabak", "Mercimek", "Soğan", "Limon suyu"], ["Nohut", "Brokoli", "Havuç", "Domates"], ["Tavuk göğsü", "Yumurta", "Limon suyu", "Pirinç"]],
    times: [15, 30, 45], diets: [["gluten_free", "low_carb"], ["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"], ["gluten_free"]],
  },
  {
    cuisine: "Akdeniz mutfağı", category: "Salata/meze",
    names: ["Yunan Salatası", "Tabule", "Zeytinli Nohut Salatası", "Tahinli Karnabahar", "Akdeniz Ton Balığı Salatası"],
    ingredientSets: [["Domates", "Salatalık", "Beyaz peynir", "Zeytin"], ["İnce bulgur", "Maydanoz", "Domates", "Limon suyu"], ["Nohut", "Zeytin", "Kırmızı soğan", "Limon suyu"], ["Karnabahar", "Tahin", "Limon suyu", "Sarımsak"], ["Ton balığı", "Salatalık", "Domates", "Zeytinyağı"]],
    times: [10, 15, 20, 30], diets: [["vegetarian", "gluten_free"], ["vegan", "vegetarian"], ["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free", "low_calorie"], ["gluten_free", "low_carb"]],
  },
  {
    cuisine: "Hint mutfağı", category: "Ana yemek",
    names: ["Chana Masala", "Palak Tofu", "Aloo Gobi", "Tavuk Tikka Masala", "Sebzeli Biryani", "Dal Tadka", "Kokoslu Karides", "Hint Usulü Mercimek", "Paneer Tikka", "Mango Chutney Tavuk", "Korma Sebzeli", "Hint Usulü Patates", "Masala Tofu", "Bezelyeli Biryani", "Baharatlı Nohut"],
    ingredientSets: [["Nohut", "Domates", "Soğan", "Kırmızı köri"], ["Tofu", "Ispanak", "Hindistan cevizi sütü", "Zencefil"], ["Patates", "Karnabahar", "Domates", "Kırmızı köri"], ["Tavuk göğsü", "Yoğurt", "Domates", "Kırmızı köri"]],
    times: [20, 30, 45, 60], diets: [["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free"], ["gluten_free"], ["vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Hint mutfağı", category: "Çorba",
    names: ["Mulligatawny", "Hint Domates Çorbası", "Köri Kabak Çorbası", "Nohutlu Hindistan Çorbası", "Ispanaklı Dal", "Hint Mercimek Çorbası", "Karnabahar Çorbası", "Zencefilli Havuç Çorbası", "Köri Mantar Çorbası", "Baharatlı Bezelye Çorbası"],
    ingredientSets: [["Mercimek", "Havuç", "Hindistan cevizi sütü", "Kırmızı köri"], ["Domates", "Soğan", "Zencefil", "Kırmızı köri"], ["Kabak", "Soğan", "Hindistan cevizi sütü", "Kırmızı köri"]],
    times: [15, 30, 45], diets: [["vegan", "vegetarian", "gluten_free", "low_calorie"], ["vegan", "vegetarian", "gluten_free"], ["vegan", "vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Fransız mutfağı", category: "Ana yemek",
    names: ["Sebzeli Ratatouille", "Coq au Vin", "Somon Meuniere", "Mercimekli Fransız Güveci", "Kremalı Mantar", "Nicoise Usulü Balık", "Sebzeli Galette", "Tavuk Provençal", "Karnabahar Graten", "Fırında Pırasa", "Fransız Usulü Omlet", "Fransız Usulü Bezelye", "Kabaklı Kiş", "Biberli Dana Sote", "Ispanaklı Krep", "Mantar Bourguignon"],
    ingredientSets: [["Kabak", "Patlıcan", "Domates", "Soğan"], ["Tavuk göğsü", "Mantar", "Havuç", "Soğan"], ["Somon fileto", "Limon suyu", "Tereyağı", "Maydanoz"], ["Mercimek", "Havuç", "Soğan", "Domates"], ["Mantar", "Süt", "Tereyağı", "Sarımsak"]],
    times: [15, 30, 45, 60], diets: [["vegan", "vegetarian", "gluten_free", "low_calorie"], ["gluten_free"], ["gluten_free", "low_carb"], ["vegan", "vegetarian", "gluten_free"], ["vegetarian", "gluten_free"]],
  },
  {
    cuisine: "Fransız mutfağı", category: "Tatlı",
    names: ["Elmalı Tarte Tatin", "Çikolatalı Mousse", "Limonlu Tart", "Krep Suzette", "Çilekli Yoğurt Parfe"],
    ingredientSets: [["Elma", "Un", "Tereyağı", "Toz şeker"], ["Kakao", "Yumurta", "Krema", "Toz şeker"], ["Limon suyu", "Un", "Yumurta", "Toz şeker"], ["Un", "Yumurta", "Portakal", "Tereyağı"], ["Yoğurt", "Çilek", "Akçaağaç şurubu"]],
    times: [15, 30, 45, 60], diets: [["vegetarian"], ["vegetarian", "gluten_free"], ["vegetarian"], ["vegetarian"], ["vegetarian", "gluten_free", "low_calorie"]],
  },
  {
    cuisine: "Türk Mutfağı", category: "Hamur işi",
    names: ["Patatesli Gözleme", "Peynirli Gözleme", "Ispanaklı Gözleme", "Kaşarlı Tost", "Sucuklu Tost", "Sigara Böreği", "Paçanga Böreği", "Mini Lahmacun", "Peynirli Mini Pide", "Fırın Patates Dilimleri", "Kabak Cipsi", "Çıtır Nohut"],
    ingredientSets: [["Yufka", "Patates", "Soğan", "Zeytinyağı"], ["Yufka", "Beyaz peynir", "Maydanoz", "Zeytinyağı"], ["Ispanak", "Beyaz peynir", "Yufka", "Soğan"], ["Ekmek", "Kaşar peyniri", "Domates", "Tereyağı"], ["Nohut", "Zeytinyağı", "Kimyon", "Pul biber"]],
    times: [10, 15, 20, 25, 30], diets: [["vegetarian"], ["vegetarian"], ["vegetarian", "gluten_free"], ["gluten_free", "vegan", "vegetarian"], []],
  },
  {
    cuisine: "İtalyan mutfağı", category: "Hamur işi",
    names: ["Mini Margherita Pizza", "Pesto Bruschetta", "Mozzarella Çubukları", "Domatesli Panini", "Mantarlı Panini", "Arancini", "Focaccia Dilimleri", "Ricotta Crostini"],
    ingredientSets: [["Ekmek", "Domates", "Mozzarella", "Taze fesleğen"], ["Ekmek", "Mantar", "Mozzarella", "Zeytinyağı"], ["Pirinç", "Parmesan", "Mozzarella", "Domates sosu"], ["Ekmek", "Ricotta", "Domates", "Zeytinyağı"]],
    times: [10, 15, 20, 25, 30], diets: [["vegetarian"], ["vegetarian"], ["vegetarian", "gluten_free"], ["vegetarian"]],
  },
  {
    cuisine: "Asya mutfağı", category: "Hamur işi",
    names: ["Sebzeli Spring Roll", "Tofulu Spring Roll", "Sebzeli Gyoza", "Edamame Atıştırmalığı", "Susamlı Pirinç Topları", "Sebzeli Onigiri", "Kore Usulü Patates", "Acılı Tofu Lokmaları"],
    ingredientSets: [["Yufka", "Lahana", "Havuç", "Soya sosu"], ["Tofu", "Lahana", "Havuç", "Soya sosu"], ["Pirinç", "Salatalık", "Avokado", "Soya sosu"], ["Bezelye", "Susam", "Soya sosu", "Zeytinyağı"]],
    times: [10, 15, 20, 25, 30], diets: [["vegan", "vegetarian"], ["vegan", "vegetarian", "gluten_free"], ["vegetarian"], ["vegan", "vegetarian", "gluten_free", "low_calorie"]],
  },
  {
    cuisine: "Meksika mutfağı", category: "Hamur işi",
    names: ["Guacamole ve Tortilla", "Peynirli Nachos", "Fasulyeli Nachos", "Mini Quesadilla", "Mısır Cipsli Salsa", "Avokadolu Taco Lokmaları"],
    ingredientSets: [["Avokado", "Domates", "Tortilla", "Limon suyu"], ["Tortilla", "Kaşar peyniri", "Domates", "Mısır"], ["Kuru fasulye", "Mısır", "Tortilla", "Avokado"], ["Domates", "Kırmızı biber", "Mısır", "Limon suyu"]],
    times: [10, 15, 20, 25, 30], diets: [["vegan", "vegetarian", "gluten_free"], ["vegetarian"], ["vegan", "vegetarian", "gluten_free"], ["vegetarian"]],
  },
  {
    cuisine: "Türk Mutfağı", category: "Kahvaltı",
    names: ["Ispanaklı Omlet", "Mantarlı Omlet", "Yulaflı Krep", "Peynirli Krep", "Avokadolu Yumurta Toast", "Lor Peynirli Tost", "Yoğurtlu Yulaf Kasesi", "Meyveli Chia Kasesi", "Domatesli Kaşarlı Tost", "Sebzeli Kahvaltı Tavası", "Muzlu Yulaf Pankek", "Zeytinli Açık Sandviç"],
    ingredientSets: [["Yumurta", "Ispanak", "Beyaz peynir", "Soğan"], ["Yumurta", "Mantar", "Domates", "Kaşar peyniri"], ["Yulaf", "Süt", "Yumurta", "Muz"], ["Ekmek", "Avokado", "Yumurta", "Domates"], ["Yoğurt", "Yulaf", "Muz", "Tarçın"]],
    times: [10, 15, 20, 25, 30], diets: [["vegetarian", "gluten_free"], ["vegetarian"], ["vegetarian", "low_calorie"], ["vegetarian", "gluten_free", "low_carb"]],
  },
]);

const curatedCatalogV2: SeedRecipe[] = [
  {
    slug: "kabak-mucveri",
    name: "Kabak Mücveri",
    category: "Kahvaltı",
    cuisine: "Türk Mutfağı",
    mealType: "Kahvaltı",
    cookingMethod: "Tava",
    budgetLevel: "Düşük",
    estimatedCostPerServing: 45,
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Kabak", 3, "adet", { preparation: "rendelenmiş" }),
      ingredient("Yumurta", 2, "adet"),
      ingredient("Un", 4, "yemek kaşığı"),
      ingredient("Beyaz peynir", 100, "gram", { optional: true }),
      ingredient("Dereotu", 0.5, "demet", { optional: true }),
      ingredient("Sıvı yağ", 3, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Rendelenmiş kabağın suyunu iyice sık.",
      "Yumurta, un, peynir, dereotu ve tuzla karıştır.",
      "Karışımdan kaşıkla alıp kızgın yağda iki tarafını pişir.",
      "Fazla yağını süzdürüp sıcak servis et.",
    ],
  },
  {
    slug: "yogurtlu-patlican",
    name: "Yoğurtlu Patlıcan",
    category: "Salata/meze",
    cuisine: "Türk Mutfağı",
    mealType: "Öğle",
    cookingMethod: "Fırın",
    budgetLevel: "Düşük",
    timeMinutes: 40,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegetarian", "gluten_free", "low_carb"],
    ingredients: [
      ingredient("Patlıcan", 3, "adet"),
      ingredient("Yoğurt", 2, "su bardağı"),
      ingredient("Sarımsak", 2, "diş", { optional: true }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Pul biber", 0.5, "çay kaşığı", { optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Patlıcanları közleyip kabuklarını soy.",
      "Patlıcanları doğrayıp sarımsaklı yoğurtla karıştır.",
      "Üzerine zeytinyağı ve pul biber gezdir.",
      "Soğuk veya oda sıcaklığında servis et.",
    ],
  },
  {
    slug: "firinda-sebzeli-tavuk",
    name: "Fırında Sebzeli Tavuk",
    category: "Ana yemek",
    cuisine: "Türk Mutfağı",
    mealType: "Akşam",
    cookingMethod: "Fırın",
    budgetLevel: "Orta",
    estimatedCostPerServing: 85,
    timeMinutes: 55,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["gluten_free", "low_carb"],
    ingredients: [
      ingredient("Tavuk göğsü", 600, "gram"),
      ingredient("Patates", 3, "adet"),
      ingredient("Havuç", 2, "adet"),
      ingredient("Kırmızı biber", 1, "adet"),
      ingredient("Soğan", 1, "adet"),
      ingredient("Zeytinyağı", 3, "yemek kaşığı"),
      ingredient("Kekik", 1, "çay kaşığı", { optional: true }),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Tavuk ve sebzeleri iri parçalar halinde doğra.",
      "Zeytinyağı, kekik ve tuzla harmanla.",
      "Fırın tepsisine yayıp 200 derecede sebzeler yumuşayana kadar pişir.",
      "Sıcak servis et.",
    ],
  },
  {
    slug: "kinoa-nohut-salatasi",
    name: "Kinoa Nohut Salatası",
    category: "Salata/meze",
    cuisine: "Akdeniz mutfağı",
    mealType: "Öğle",
    cookingMethod: "Tencere",
    budgetLevel: "Orta",
    timeMinutes: 30,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Kinoa", 1, "su bardağı"),
      ingredient("Nohut", 1, "su bardağı"),
      ingredient("Salatalık", 1, "adet"),
      ingredient("Çeri domates", 250, "gram"),
      ingredient("Maydanoz", 0.5, "demet", { optional: true }),
      ingredient("Limon suyu", 2, "yemek kaşığı"),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
    ],
    steps: [
      "Kinoayı yıkayıp suyunu çekene kadar pişir ve soğut.",
      "Nohut, sebzeler ve maydanozu doğrayıp kaseye al.",
      "Kinoa, limon suyu ve zeytinyağını ekleyip karıştır.",
      "Dinlendirip servis et.",
    ],
  },
  {
    slug: "mercimekli-sebze-bowl",
    name: "Mercimekli Sebze Bowl",
    category: "Ana yemek",
    cuisine: "Akdeniz mutfağı",
    mealType: "Öğle",
    cookingMethod: "Tencere",
    budgetLevel: "Düşük",
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Mercimek", 1, "su bardağı"),
      ingredient("Bulgur", 0.5, "su bardağı", { optional: true }),
      ingredient("Kabak", 1, "adet"),
      ingredient("Havuç", 1, "adet"),
      ingredient("Yoğurt", 1, "su bardağı", { optional: true }),
      ingredient("Limon suyu", 1, "yemek kaşığı"),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
    ],
    steps: [
      "Mercimeği yumuşayana kadar haşla.",
      "Kabak ve havucu zeytinyağında kısa süre sotele.",
      "Mercimeği sebzelerle karıştırıp limon suyu ekle.",
      "İsteğe göre bulgur veya yoğurtla kasede servis et.",
    ],
  },
  {
    slug: "tofu-sebze-wok",
    name: "Tofu Sebze Wok",
    category: "Ana yemek",
    cuisine: "Asya mutfağı",
    mealType: "Akşam",
    cookingMethod: "Tava",
    budgetLevel: "Orta",
    estimatedCostPerServing: 110,
    timeMinutes: 25,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian"],
    ingredients: [
      ingredient("Tofu", 300, "gram"),
      ingredient("Brokoli", 250, "gram"),
      ingredient("Havuç", 1, "adet"),
      ingredient("Kırmızı biber", 1, "adet"),
      ingredient("Soya sosu", 2, "yemek kaşığı"),
      ingredient("Zencefil", 1, "tatlı kaşığı", { optional: true }),
      ingredient("Susam yağı", 1, "tatlı kaşığı", { optional: true }),
    ],
    steps: [
      "Tofuyu küp doğrayıp tavada hafifçe kızart.",
      "Sebzeleri ekleyip yüksek ateşte diri kalacak şekilde sotele.",
      "Soya sosu, zencefil ve susam yağını ilave et.",
      "Bekletmeden sıcak servis et.",
    ],
  },
  {
    slug: "tavuklu-noodle",
    name: "Tavuklu Noodle",
    category: "Ana yemek",
    cuisine: "Asya mutfağı",
    mealType: "Akşam",
    cookingMethod: "Tava",
    budgetLevel: "Orta",
    timeMinutes: 30,
    difficulty: "Kolay",
    baseServings: 3,
    diets: [],
    ingredients: [
      ingredient("Pirinç eriştesi", 250, "gram"),
      ingredient("Tavuk göğsü", 300, "gram"),
      ingredient("Havuç", 1, "adet"),
      ingredient("Brokoli", 150, "gram"),
      ingredient("Soya sosu", 2, "yemek kaşığı"),
      ingredient("Sarımsak", 2, "diş", { optional: true }),
      ingredient("Sıvı yağ", 1, "yemek kaşığı"),
    ],
    steps: [
      "Pirinç eriştesini paket talimatına göre yumuşat.",
      "Tavuğu yağda pişirip sebzeleri ekle.",
      "Erişte ve soya sosunu tavaya alıp karıştır.",
      "Sıcak servis et.",
    ],
  },
  {
    slug: "fasulyeli-burrito-bowl",
    name: "Fasulyeli Burrito Bowl",
    category: "Ana yemek",
    cuisine: "Meksika mutfağı",
    mealType: "Akşam",
    cookingMethod: "Tencere",
    budgetLevel: "Düşük",
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian", "gluten_free"],
    ingredients: [
      ingredient("Kuru fasulye", 1, "su bardağı"),
      ingredient("Pirinç", 1, "su bardağı"),
      ingredient("Mısır", 1, "su bardağı"),
      ingredient("Avokado", 1, "adet", { optional: true }),
      ingredient("Domates", 2, "adet"),
      ingredient("Limon suyu", 1, "yemek kaşığı"),
      ingredient("Kimyon", 0.5, "çay kaşığı", { optional: true }),
    ],
    steps: [
      "Fasulyeyi haşlayıp kimyonla kısa süre ısıt.",
      "Pirinci ayrı tencerede pişir.",
      "Domates, mısır ve avokadoyu doğra.",
      "Tüm malzemeleri kasede birleştirip limonla servis et.",
    ],
  },
  {
    slug: "firinda-karnabahar",
    name: "Fırında Baharatlı Karnabahar",
    category: "Ana yemek",
    cuisine: "Akdeniz mutfağı",
    mealType: "Akşam",
    cookingMethod: "Fırın",
    budgetLevel: "Düşük",
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Karnabahar", 600, "gram"),
      ingredient("Zeytinyağı", 3, "yemek kaşığı"),
      ingredient("Kırmızı biber", 1, "çay kaşığı"),
      ingredient("Kimyon", 0.5, "çay kaşığı", { optional: true }),
      ingredient("Limon suyu", 1, "yemek kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "yeteri kadar" }),
    ],
    steps: [
      "Karnabaharı küçük çiçeklere ayırıp yıka.",
      "Zeytinyağı, baharatlar ve limon suyuyla harmanla.",
      "200 derece fırında kenarları kızarana kadar pişir.",
      "Sıcak veya ılık servis et.",
    ],
  },
  {
    slug: "ton-balikli-makarna-salatasi",
    name: "Ton Balıklı Makarna Salatası",
    category: "Salata/meze",
    cuisine: "İtalyan mutfağı",
    mealType: "Öğle",
    cookingMethod: "Tencere",
    budgetLevel: "Orta",
    timeMinutes: 25,
    difficulty: "Kolay",
    baseServings: 3,
    diets: [],
    ingredients: [
      ingredient("Makarna", 250, "gram"),
      ingredient("Ton balığı", 1, "kutu"),
      ingredient("Çeri domates", 200, "gram"),
      ingredient("Mısır", 0.5, "su bardağı", { optional: true }),
      ingredient("Yoğurt", 0.5, "su bardağı", { optional: true }),
      ingredient("Limon suyu", 1, "yemek kaşığı"),
      ingredient("Maydanoz", 0.5, "demet", { optional: true }),
    ],
    steps: [
      "Makarnayı haşlayıp soğuk sudan geçir.",
      "Ton balığı, domates ve mısırı ekle.",
      "Yoğurt, limon suyu ve maydanozla karıştır.",
      "Soğutup servis et.",
    ],
  },
  {
    slug: "elmali-yulaf-firini",
    name: "Elmalı Yulaf Fırını",
    category: "Tatlı",
    cuisine: "Akdeniz mutfağı",
    mealType: "Tatlı",
    cookingMethod: "Fırın",
    budgetLevel: "Düşük",
    timeMinutes: 35,
    difficulty: "Kolay",
    baseServings: 4,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Elma", 3, "adet"),
      ingredient("Yulaf", 1.5, "su bardağı"),
      ingredient("Yoğurt", 1, "su bardağı"),
      ingredient("Bal", 2, "yemek kaşığı", { optional: true }),
      ingredient("Tarçın", 1, "çay kaşığı"),
      ingredient("Ceviz içi", 0.5, "su bardağı", { optional: true }),
    ],
    steps: [
      "Elmaları küp doğrayıp tarçınla karıştır.",
      "Yulaf, yoğurt ve balı ayrı kapta birleştir.",
      "Elmalarla yulaflı karışımı fırın kabına alıp ceviz serp.",
      "180 derece fırında üzeri kızarana kadar pişir.",
    ],
  },
];

const curatedCatalogV2SecondBatch: SeedRecipe[] = [
  {
    slug: "mercimek-koftesi",
    name: "Mercimek Köftesi",
    category: "Salata/meze",
    cuisine: "Türk Mutfağı",
    mealType: "Öğle",
    cookingMethod: "Tencere",
    budgetLevel: "Düşük",
    timeMinutes: 45,
    difficulty: "Orta",
    baseServings: 6,
    diets: ["vegan", "vegetarian"],
    ingredients: [
      ingredient("Mercimek", 1, "su bardağı"),
      ingredient("İnce bulgur", 1.5, "su bardağı"),
      ingredient("Soğan", 1, "adet"),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Maydanoz", 0.5, "demet"),
      ingredient("Limon suyu", 2, "yemek kaşığı"),
      ingredient("Zeytinyağı", 3, "yemek kaşığı"),
    ],
    steps: [
      "Mercimeği yumuşayana kadar haşla.",
      "İnce bulguru ekleyip kapağı kapalı şekilde dinlendir.",
      "Soğanı salça ve zeytinyağıyla kavurup karışıma ekle.",
      "Maydanoz ve limon suyunu ekleyip yoğur, şekil vererek servis et.",
    ],
  },
  {
    slug: "firinda-kofte-sebze",
    name: "Fırında Köfte ve Sebze",
    category: "Ana yemek",
    cuisine: "Türk Mutfağı",
    mealType: "Akşam",
    cookingMethod: "Fırın",
    budgetLevel: "Orta",
    timeMinutes: 50,
    difficulty: "Orta",
    baseServings: 4,
    diets: [],
    ingredients: [
      ingredient("Kıyma", 500, "gram"),
      ingredient("Patates", 3, "adet"),
      ingredient("Domates", 2, "adet"),
      ingredient("Yeşil biber", 2, "adet"),
      ingredient("Soğan", 1, "adet"),
      ingredient("Ekmek", 2, "dilim", { optional: true }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Kimyon", 0.5, "çay kaşığı", { optional: true }),
    ],
    steps: [
      "Kıyma, rendelenmiş soğan, ekmek ve baharatlarla köfte harcı hazırla.",
      "Harçtan köfteler şekillendirip sebzelerle tepsiye diz.",
      "Üzerine zeytinyağı gezdirip 200 derece fırında pişir.",
      "Sebzeler yumuşayıp köfteler kızarınca sıcak servis et.",
    ],
  },
  {
    slug: "nohutlu-kabak-sote",
    name: "Nohutlu Kabak Sote",
    category: "Ana yemek",
    cuisine: "Türk Mutfağı",
    mealType: "Akşam",
    cookingMethod: "Tava",
    budgetLevel: "Düşük",
    timeMinutes: 25,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian", "gluten_free", "low_calorie"],
    ingredients: [
      ingredient("Kabak", 3, "adet"),
      ingredient("Nohut", 1, "su bardağı"),
      ingredient("Domates", 2, "adet"),
      ingredient("Soğan", 1, "adet"),
      ingredient("Sarımsak", 1, "diş", { optional: true }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Yoğurt", 1, "su bardağı", { optional: true }),
    ],
    steps: [
      "Soğanı ve sarımsağı zeytinyağında yumuşat.",
      "Kabakları ekleyip birkaç dakika sotele.",
      "Domates ve nohudu ilave edip sebzeler yumuşayana kadar pişir.",
      "İsteğe göre yoğurtla servis et.",
    ],
  },
  {
    slug: "avokadolu-yumurta-toast",
    name: "Avokadolu Yumurta Toast",
    category: "Kahvaltı",
    cuisine: "Akdeniz mutfağı",
    mealType: "Kahvaltı",
    cookingMethod: "Tava",
    budgetLevel: "Orta",
    estimatedCostPerServing: 70,
    timeMinutes: 15,
    difficulty: "Kolay",
    baseServings: 2,
    diets: ["vegetarian"],
    ingredients: [
      ingredient("Ekmek", 4, "dilim"),
      ingredient("Avokado", 1, "adet"),
      ingredient("Yumurta", 2, "adet"),
      ingredient("Limon suyu", 1, "tatlı kaşığı"),
      ingredient("Pul biber", 0.5, "çay kaşığı", { optional: true }),
      ingredient("Zeytinyağı", 1, "yemek kaşığı"),
    ],
    steps: [
      "Avokadoyu limon suyu ve tuzla ez.",
      "Ekmekleri tavada veya tost makinesinde kızart.",
      "Yumurtaları tavada istediğin kıvamda pişir.",
      "Avokadoyu ekmeklerin üzerine sürüp yumurtayla servis et.",
    ],
  },
  {
    slug: "somonlu-kinoa-bowl",
    name: "Somonlu Kinoa Bowl",
    category: "Ana yemek",
    cuisine: "Akdeniz mutfağı",
    mealType: "Öğle",
    cookingMethod: "Fırın",
    budgetLevel: "Yüksek",
    estimatedCostPerServing: 240,
    timeMinutes: 35,
    difficulty: "Orta",
    baseServings: 2,
    diets: ["gluten_free", "low_carb"],
    ingredients: [
      ingredient("Somon fileto", 300, "gram"),
      ingredient("Kinoa", 1, "su bardağı"),
      ingredient("Salatalık", 1, "adet"),
      ingredient("Avokado", 1, "adet", { optional: true }),
      ingredient("Limon suyu", 2, "yemek kaşığı"),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Dereotu", 0.5, "demet", { optional: true }),
    ],
    steps: [
      "Kinoayı yıkayıp suyunu çekene kadar pişir.",
      "Somonu limon ve zeytinyağıyla harmanlayıp fırında pişir.",
      "Salatalık ve avokadoyu doğra.",
      "Kinoayı sebzeler ve somonla kasede birleştir.",
    ],
  },
  {
    slug: "sebzeli-kuskus",
    name: "Sebzeli Kuskus",
    category: "Ana yemek",
    cuisine: "Akdeniz mutfağı",
    mealType: "Öğle",
    cookingMethod: "Tencere",
    budgetLevel: "Düşük",
    timeMinutes: 25,
    difficulty: "Kolay",
    baseServings: 3,
    diets: ["vegan", "vegetarian"],
    ingredients: [
      ingredient("Kuskus", 1.5, "su bardağı"),
      ingredient("Kabak", 1, "adet"),
      ingredient("Havuç", 1, "adet"),
      ingredient("Kırmızı biber", 1, "adet"),
      ingredient("Nohut", 0.5, "su bardağı", { optional: true }),
      ingredient("Zeytinyağı", 2, "yemek kaşığı"),
      ingredient("Limon suyu", 1, "yemek kaşığı"),
    ],
    steps: [
      "Kuskusu sıcak suyla yumuşatıp dinlendir.",
      "Sebzeleri zeytinyağında diri kalacak şekilde sotele.",
      "Kuskus ve nohudu sebzelere ekleyip karıştır.",
      "Limon suyu gezdirip ılık servis et.",
    ],
  },
];

const detailedRecipes: SeedRecipe[] = [
  {
    slug: "tavuklu-perde-pilavi",
    name: "Tavuklu Perde Pilavı",
    category: "Ana yemek",
    cuisine: "Türk Mutfağı",
    mealType: "Akşam",
    cookingMethod: "Fırın",
    budgetLevel: "Orta",
    estimatedCostPerServing: 95,
    timeMinutes: 90,
    difficulty: "Orta",
    baseServings: 6,
    diets: [],
    ingredients: [
      ingredient("Tavuk göğsü", 2, "adet"),
      ingredient("Pirinç", 2, "su bardağı"),
      ingredient("Kuru soğan", 1, "adet"),
      ingredient("Sarımsak", 1, "diş"),
      ingredient("Sıvı yağ", 0.5, "çay bardağı"),
      ingredient("Tereyağı", 1, "yemek kaşığı"),
      ingredient("Domates salçası", 1, "yemek kaşığı"),
      ingredient("Toz biber", 1, "tatlı kaşığı"),
      ingredient("Pul biber", 1, "tatlı kaşığı"),
      ingredient("Karabiber", 1, "tatlı kaşığı"),
      ingredient("Nane", 1, "tatlı kaşığı"),
      ingredient("Reyhan", 1, "tatlı kaşığı"),
      ingredient("Kimyon", 1, "tatlı kaşığı"),
      ingredient("Zerdeçal", 1, "çay kaşığı"),
      ingredient("Tuz", null, "tutam", { quantityText: "damak tadına göre" }),
      ingredient("Sıcak su", 3, "su bardağı"),
      ingredient("Yumurta", 2, "adet"),
      ingredient("Ilık su", 2, "su bardağı"),
      ingredient("Un", 5.5, "su bardağı"),
    ],
    steps: [
      "Tavuk göğüslerini tencereye alıp üzerini geçecek kadar su ekle. Kaynadıktan sonra orta ateşte 20-25 dakika haşla; ılınınca tavukları didikle ve haşlama suyunu pilavda kullanmak üzere ayır.",
      "Pirinci geniş bir kasede ılık ve tuzlu suda 15 dakika beklet. Suyu berraklaşana kadar yıkayıp süzgeçte 5 dakika beklet.",
      "Pilav için soğanı küçük küpler halinde doğra, sarımsağı ez. Tencerede sıvı yağ ve tereyağını ısıtıp soğanı 3-4 dakika pembeleştir; sarımsağı ekleyip 30 saniye çevir.",
      "Salçayı ve toz biberi ekleyip kokusu çıkana kadar 1 dakika kavur. Süzülen pirinci ilave edip taneler yağla kaplanana kadar 2 dakika karıştır.",
      "Didiklenmiş tavukları, pul biberi, karabiberi, naneyi, reyhanı, kimyonu, zerdeçalı ve tuzu tencereye ekle. 3 su bardağı sıcak tavuk suyunu dök; kaynayınca kapağı kapatıp en kısık ateşte 12-15 dakika pişir.",
      "Pilav suyunu çekince ocağı kapat. Kapağın altına temiz bir bez veya kâğıt havlu koyup 15 dakika dinlendir; bu sırada hamuru hazırla.",
      "Hamur için yumurta, ılık su ve 2 tatlı kaşığı tuzu yoğurma kabında karıştır. Unu bardak bardak ekleyerek ele hafif yapışan, yumuşak bir hamur yoğur; üzerini kapatıp 10 dakika dinlendir.",
      "Fırına dayanıklı derin bir kabı yağla. Hamurun üçte ikisini kabın tabanını ve kenarlarını kaplayacak büyüklükte aç; dinlenmiş tavuklu pilavı içine doldur ve kenarlardan sarkan hamuru üzerine kapat.",
      "Kalan hamuru kapak olacak şekilde açıp üstüne yerleştir. Kenarlarını bastırarak kapat, üzerine birkaç küçük delik aç ve 180 derece önceden ısıtılmış fırında 30-35 dakika altın rengi olana kadar pişir.",
      "Fırından çıkan perde pilavını 10 dakika dinlendir. Servis tabağına dikkatlice ters çevirip dilimleyerek sıcak servis et.",
    ],
  },
];

const pantryStaples = new Set([
  "Su",
  "Tuz",
  "Karabiber",
  "Pul biber",
  "Kuru nane",
  "Nane",
  "Zeytinyağı",
  "Sıvı yağ",
  "Toz şeker",
  "Tarçın",
  "Kekik",
  "Fesleğen",
  "Biberiye",
  "Kimyon",
  "Köri",
  "Zencefil",
  "Pirinç sirkesi",
  "Susam yağı",
  "Susam",
  "Kakao",
]);

function withDetailedPreparation(recipe: SeedRecipe): string[] {
  if (recipe.steps[0]?.startsWith("Ön hazırlık:")) return recipe.steps;

  const measuredIngredients = recipe.ingredients
    .map((item) => `${item.name} (${formatSeedAmount(item)})`)
    .join(", ");

  return [
    `Ön hazırlık: ${measuredIngredients} malzemelerini tezgâha çıkar. Sebzeleri yıka ve tarifte istenen şekilde doğra; tüm ölçüleri pişirmeye başlamadan hazır et.`,
    ...recipe.steps,
  ];
}

function upsertRecipe(recipe: SeedRecipe): number {
  const existing = db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.slug, recipe.slug))
    .all()[0];

  if (existing) {
    db.update(recipes)
      .set({
        name: recipe.name,
        category: recipe.category,
        cuisine: recipe.cuisine ?? CUISINE,
        mealType: recipe.mealType ?? catalogMealType(recipe.category),
        cookingMethod:
          recipe.cookingMethod ?? catalogCookingMethod(recipe.name, recipe.category),
        budgetLevel:
          recipe.budgetLevel ?? catalogBudgetLevel(recipe.name, recipe.category),
        estimatedCostPerServing: recipe.estimatedCostPerServing ?? null,
        caloriesPerServing: recipe.caloriesPerServing ?? null,
        proteinGrams: recipe.proteinGrams ?? null,
        isFreezerFriendly: recipe.isFreezerFriendly ?? false,
        timeMinutes: recipe.timeMinutes,
        difficulty: recipe.difficulty,
        baseServings: recipe.baseServings,
        note: recipe.note ?? null,
        isActive: true,
      })
      .where(eq(recipes.id, existing.id))
      .run();
    return existing.id;
  }

  const inserted = db
    .insert(recipes)
    .values({
      slug: recipe.slug,
      name: recipe.name,
      category: recipe.category,
      cuisine: recipe.cuisine ?? CUISINE,
      mealType: recipe.mealType ?? catalogMealType(recipe.category),
      cookingMethod:
        recipe.cookingMethod ?? catalogCookingMethod(recipe.name, recipe.category),
      budgetLevel:
        recipe.budgetLevel ?? catalogBudgetLevel(recipe.name, recipe.category),
      estimatedCostPerServing: recipe.estimatedCostPerServing ?? null,
      caloriesPerServing: recipe.caloriesPerServing ?? null,
      proteinGrams: recipe.proteinGrams ?? null,
      isFreezerFriendly: recipe.isFreezerFriendly ?? false,
      timeMinutes: recipe.timeMinutes,
      difficulty: recipe.difficulty,
      baseServings: recipe.baseServings,
      note: recipe.note ?? null,
      isActive: true,
    })
    .returning({ id: recipes.id })
    .all()[0];

  return inserted.id;
}

function upsertIngredient(item: SeedIngredient): number {
  const normalizedName = normalizeIngredientName(item.name);
  const existing = db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(eq(ingredients.normalizedName, normalizedName))
    .all()[0];

  if (existing) return existing.id;

  const inserted = db
    .insert(ingredients)
    .values({
      name: item.name,
      normalizedName,
      isPantryStaple: pantryStaples.has(item.name),
    })
    .returning({ id: ingredients.id })
    .get();

  return inserted.id;
}

db.transaction(() => {
  for (const recipe of [
    ...seedRecipes,
    ...additionalRecipes,
    ...curatedCatalogV2,
    ...curatedCatalogV2SecondBatch,
    ...detailedRecipes,
  ]) {
    const recipeId = upsertRecipe(recipe);

    db.delete(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId))
      .run();
    db.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId)).run();
    db.delete(recipeDiets).where(eq(recipeDiets.recipeId, recipeId)).run();

    const ingredientRows = recipe.ingredients.map((item) => ({
      recipeId,
      ingredientId: upsertIngredient(item),
      quantity: item.quantity,
      unit: item.unit,
      quantityText: item.quantityText ?? null,
      preparation: item.preparation ?? null,
      isOptional: item.optional ?? false,
    }));

    db.insert(recipeIngredients).values(ingredientRows).run();

    db.insert(recipeSteps)
      .values(
        withDetailedPreparation(recipe).map((instruction, index) => ({
          recipeId,
          stepOrder: index + 1,
          instruction,
        }))
      )
      .run();

    if (recipe.diets.length > 0) {
      db.insert(recipeDiets)
        .values(
          recipe.diets.map((diet) => ({
            recipeId,
            diet,
          }))
        )
        .run();
    }
  }
});

const counts = {
  recipes: db.select({ id: recipes.id }).from(recipes).all().length,
  ingredients: db.select({ id: ingredients.id }).from(ingredients).all().length,
  recipeIngredients: db
    .select({ recipeId: recipeIngredients.recipeId })
    .from(recipeIngredients)
    .all().length,
  recipeSteps: db.select({ recipeId: recipeSteps.recipeId }).from(recipeSteps).all()
    .length,
  recipeDiets: db.select({ recipeId: recipeDiets.recipeId }).from(recipeDiets).all()
    .length,
};

console.log(`Seed tamamlandı: ${counts.recipes} tarif, ${counts.ingredients} ingredient.`);
console.log(JSON.stringify(counts, null, 2));
