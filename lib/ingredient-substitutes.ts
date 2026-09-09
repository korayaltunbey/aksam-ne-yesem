export interface IngredientSubstitute {
  replacement: string;
  note: string;
}

const SUBSTITUTES: Record<string, IngredientSubstitute[]> = {
  "Domates salçası": [
    { replacement: "2 yemek kaşığı rendelenmiş domates", note: "Suyu biraz daha uzun çektir." },
  ],
  "Sarımsak": [
    { replacement: "1 çay kaşığı sarımsak tozu", note: "Kavurma aşamasında ekle." },
  ],
  "Yoğurt": [
    { replacement: "Aynı miktarda süzme yoğurt", note: "Koyuysa 1-2 kaşık suyla aç." },
    { replacement: "Aynı miktarda kefir", note: "Soğuk mezeler için uygundur." },
  ],
  "Süt": [
    { replacement: "Aynı miktarda laktozsuz süt", note: "Doğrudan kullanabilirsin." },
    { replacement: "Aynı miktarda bitkisel içecek", note: "Şekersiz olanı seç." },
  ],
  "Tereyağı": [
    { replacement: "Aynı miktarda zeytinyağı", note: "Tat değişir, pişirme sürer." },
  ],
  "Krema": [
    { replacement: "Yarım su bardağı süt + 1 tatlı kaşığı un", note: "Topaklanmaması için önce karıştır." },
  ],
  "Kaşar peyniri": [
    { replacement: "Aynı miktarda mozzarella veya dil peyniri", note: "Erime özelliği benzerdir." },
  ],
  "Limon": [
    { replacement: "1 yemek kaşığı elma sirkesi", note: "Azar azar ekleyip tadına bak." },
  ],
  "Un": [
    { replacement: "Aynı miktarda glutensiz un karışımı", note: "Hamurun kıvamını kontrollü ayarla." },
  ],
};

export function getIngredientSubstitutes(name: string): IngredientSubstitute[] {
  return SUBSTITUTES[name] ?? [];
}
